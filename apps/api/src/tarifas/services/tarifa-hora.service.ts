import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PeriodosService } from '../../periodos/periodos.service';

import { Tarifa, TarifaHora } from '../entities';

import { SaveTarifaHoraDto } from '../dto';
import { TarifaHoraDescripcionService } from './tarifa-hora-descripcion.service';

@Injectable()
export class TarifaHoraService {

  private readonly logger = new Logger('TarifaHoraService');

  constructor(
    @InjectRepository(TarifaHora)
    private readonly tarifaHoraRepository: Repository<TarifaHora>,
    @InjectRepository(Tarifa)
    private readonly tarifaRepository: Repository<Tarifa>,
    private readonly dataSource: DataSource,
    private readonly tarifaHoraDescripcionService: TarifaHoraDescripcionService,
    @Inject(forwardRef(() => PeriodosService))
    private readonly periodoService: PeriodosService,
  ) {}

  // CREAR O ACTUALIZAR (UPSERT) LAS TARIFAS POR HORA DE UN PERIODO
  // Siempre se deben enviar las 4 tarifas por hora (diurna, diurna dominical/festiva, nocturna, nocturna dominical/festiva)
  async guardarTarifasHora(saveTarifaHoraDto: SaveTarifaHoraDto) {

    const { idPeriodo, tarifas } = saveTarifaHoraDto;

    // OBTENER PERIODO
    const periodo = await this.periodoService.findOne(idPeriodo);

    for (const tarifaHoraDto of tarifas) {

      if (tarifaHoraDto.idPeriodo !== idPeriodo) {
        throw new BadRequestException(`Una de las tarifas por hora tiene un periodo diferente al especificado`);
      }

    }

    // VALIDAR QUE NO SE REPITAN TIPOS DE TARIFA HORA
    const idsDescripcion = tarifas.map(tarifaHoraDto => tarifaHoraDto.idTarifaHoraDescripcion);

    if (new Set(idsDescripcion).size !== idsDescripcion.length) {
      throw new BadRequestException(`No se puede repetir el mismo tipo de tarifa hora en la misma solicitud`);
    }

    // VALIDAR QUE SE ENVIEN LAS 4 TARIFAS POR HORA EXISTENTES
    const tiposTarifaHoraDescripcion = await this.tarifaHoraDescripcionService.findAll();

    if (tarifas.length !== tiposTarifaHoraDescripcion.length) {
      throw new BadRequestException(`Debe enviar el valor de las ${tiposTarifaHoraDescripcion.length} tarifas por hora existentes`);
    }

    // VALIDAR QUE EL PERIODO NO TENGA ORDENES DE SERVICIO CREADAS CON TARIFAS DE ESTE PERIODO
    await this.validarPeriodoSinOrdenesServicio(idPeriodo);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const tarifasHoraGuardadas: TarifaHora[] = [];

      for (const tarifaHoraDto of tarifas) {

        const tarifaHoraDescripcion = tiposTarifaHoraDescripcion.find(
          tipo => tipo.idTarifaHoraDescripcion === tarifaHoraDto.idTarifaHoraDescripcion
        );

        if (!tarifaHoraDescripcion) {
          throw new NotFoundException(`Tarifa hora descripcion con id "${tarifaHoraDto.idTarifaHoraDescripcion}" no se ha encontrado`);
        }

        // Nota: no se usa find/findOne con criterio anidado por relacion (where: { idPeriodo: { idPeriodo } })
        // porque tanto TarifaHora.idPeriodo como TarifaHora.idTarifaHoraDescripcion son relaciones eager cuyo
        // nombre de propiedad coincide exactamente con el nombre de la PK de la entidad relacionada (idPeriodo,
        // idTarifaHoraDescripcion); TypeORM genera un WHERE ambiguo/mal formado en ese caso. Con QueryBuilder
        // se referencia la columna FK explicitamente y no hay ambiguedad. Los leftJoinAndSelect son necesarios
        // porque QueryBuilder (a diferencia de find/findOne) no aplica automaticamente las relaciones eager.
        let tarifaHora = await queryRunner.manager
          .createQueryBuilder(TarifaHora, 'tarifaHora')
          .leftJoinAndSelect('tarifaHora.idPeriodo', 'idPeriodo')
          .leftJoinAndSelect('tarifaHora.idTarifaHoraDescripcion', 'idTarifaHoraDescripcion')
          .where('tarifaHora.idPeriodo = :idPeriodo', { idPeriodo })
          .andWhere('tarifaHora.idTarifaHoraDescripcion = :idTarifaHoraDescripcion', {
            idTarifaHoraDescripcion: tarifaHoraDto.idTarifaHoraDescripcion,
          })
          .getOne();

        if (tarifaHora) {

          tarifaHora.costosDirectos = tarifaHoraDto.costosDirectos;
          tarifaHora.seguroVida = tarifaHoraDto.seguroVida ?? null;
          tarifaHora.aui = tarifaHoraDto.aui;

        } else {

          tarifaHora = queryRunner.manager.create(TarifaHora, {
            idPeriodo: periodo,
            idTarifaHoraDescripcion: tarifaHoraDescripcion,
            costosDirectos: tarifaHoraDto.costosDirectos,
            seguroVida: tarifaHoraDto.seguroVida ?? null,
            aui: tarifaHoraDto.aui,
          });

        }

        const tarifaHoraGuardada = await queryRunner.manager.save(TarifaHora, tarifaHora);

        tarifasHoraGuardadas.push(tarifaHoraGuardada);

      }

      await queryRunner.commitTransaction();

      return tarifasHoraGuardadas;

    } catch (error) {

      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.handleDbExceptions(error);

    } finally {

      await queryRunner.release();

    }

  }

  // OBTENER LAS TARIFAS POR HORA DE UN PERIODO
  // Si para una tarifa hora descripcion aun no existe un valor creado para el periodo, se retorna solo la descripcion (sin precios)
  async findAllByPeriodo(idPeriodo: number) {

    // VALIDAR QUE EL PERIODO EXISTA
    await this.periodoService.findOne(idPeriodo);

    const tiposTarifaHoraDescripcion = await this.tarifaHoraDescripcionService.findAll();

    // Ver nota en guardarTarifasHora sobre por que no se usa find({ where: { idPeriodo: { idPeriodo } } })
    // y por que hacen falta los leftJoinAndSelect (QueryBuilder no aplica relaciones eager automaticamente)
    const tarifasHora = await this.tarifaHoraRepository
      .createQueryBuilder('tarifaHora')
      .leftJoinAndSelect('tarifaHora.idPeriodo', 'idPeriodo')
      .leftJoinAndSelect('tarifaHora.idTarifaHoraDescripcion', 'idTarifaHoraDescripcion')
      .where('tarifaHora.idPeriodo = :idPeriodo', { idPeriodo })
      .getMany();

    return tiposTarifaHoraDescripcion.map(tarifaHoraDescripcion => {

      const tarifaHora = tarifasHora.find(
        tarifa => tarifa.idTarifaHoraDescripcion.idTarifaHoraDescripcion === tarifaHoraDescripcion.idTarifaHoraDescripcion
      );

      if (tarifaHora) return tarifaHora;

      return {
        idTarifaHora: null,
        idPeriodo,
        idTarifaHoraDescripcion: tarifaHoraDescripcion,
        costosDirectos: null,
        seguroVida: null,
        aui: null,
        fechaCreacion: null,
        fechaActualizacion: null,
      };

    });

  }

  // OBTENER EL VALOR DE LA TARIFA HORA DE UN PERIODO PARA UNA TARIFA HORA DESCRIPCION ESPECIFICA
  // Retorna null si aun no se ha configurado un valor para ese periodo (no lanza excepcion)
  async findOneByPeriodoYDescripcion(idPeriodo: number, idTarifaHoraDescripcion: number) {

    // Ver nota en guardarTarifasHora sobre por que no se usa findOne({ where: { idPeriodo: { idPeriodo }, ... } })
    // y por que hacen falta los leftJoinAndSelect (QueryBuilder no aplica relaciones eager automaticamente)
    return await this.tarifaHoraRepository
      .createQueryBuilder('tarifaHora')
      .leftJoinAndSelect('tarifaHora.idPeriodo', 'idPeriodo')
      .leftJoinAndSelect('tarifaHora.idTarifaHoraDescripcion', 'idTarifaHoraDescripcion')
      .where('tarifaHora.idPeriodo = :idPeriodo', { idPeriodo })
      .andWhere('tarifaHora.idTarifaHoraDescripcion = :idTarifaHoraDescripcion', { idTarifaHoraDescripcion })
      .getOne();

  }

  // OBTENER UNA TARIFA HORA
  async findOne(id: number) {

    const tarifaHora = await this.tarifaHoraRepository.findOne({
      where: {
        idTarifaHora: id
      }
    });

    if (!tarifaHora) throw new NotFoundException(`Tarifa hora con id "${id}" no se ha encontrado`);

    return tarifaHora;

  }

  // ELIMINAR UNA TARIFA HORA
  async remove(id: number) {

    const tarifaHora = await this.findOne(id);

    // VALIDAR QUE EL PERIODO NO TENGA ORDENES DE SERVICIO CREADAS CON TARIFAS DE ESTE PERIODO
    await this.validarPeriodoSinOrdenesServicio(tarifaHora.idPeriodo.idPeriodo);

    try {

      await this.tarifaHoraRepository.remove(tarifaHora);

    } catch (error) {

      this.logger.error(error);

      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  // VALIDAR QUE NO EXISTAN ORDENES DE SERVICIO CREADAS CON TARIFAS (idTarifa) DE ESTE PERIODO
  // Las tarifas por hora de un periodo no se pueden modificar/eliminar si ya se generaron ordenes de servicio con precios de ese periodo,
  // ya que se arriesgaria el valor ya calculado y facturado de una orden
  private async validarPeriodoSinOrdenesServicio(idPeriodo: number) {

    const totalOrdenesConTarifaDelPeriodo = await this.tarifaRepository
      .createQueryBuilder('tarifa')
      .innerJoin('tarifa.ordenesServicio', 'ordenServicioTarifa')
      .where('tarifa.idPeriodo = :idPeriodo', { idPeriodo })
      .getCount();

    if (totalOrdenesConTarifaDelPeriodo > 0) {
      throw new BadRequestException(`No se pueden modificar las tarifas por hora de este periodo, ya existen ordenes de servicio creadas con tarifas de este periodo`);
    }

  }

  private handleDbExceptions(error: any) {

    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

}
