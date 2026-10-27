import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationOption } from '../../common/interfaces/pagination.interface';
import { ClientesService } from '../../clientes/services';
import { User } from '../../users/entities/user.entity';

import { Adicional, TipoAdicional } from '../entities';
import { CreateAdicionalDto, UpdateAdicionalDto, FindAdicionalesDto } from '../dto';

@Injectable()
export class AdicionalesService {

  private readonly logger = new Logger('AdicionalesService');

  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta

  constructor(
    @InjectRepository(Adicional)
    private readonly adicionalRepository: Repository<Adicional>,
    @InjectRepository(TipoAdicional)
    private readonly tipoAdicionalRepository: Repository<TipoAdicional>,
    private readonly clientesService: ClientesService,
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createAdicionalDto: CreateAdicionalDto, user: User) {

    const cliente = await this.clientesService.findOne(createAdicionalDto.idCliente);

    const tipoAdicional = await this.findTipoAdicional(createAdicionalDto.idTipoAdicional);

    const mesInicio = this.normalizarMes(createAdicionalDto.mesInicio);
    const mesFin = createAdicionalDto.mesFin ? this.normalizarMes(createAdicionalDto.mesFin) : null;

    if (mesFin != null && mesFin < mesInicio) {
      throw new BadRequestException('El mes de fin debe ser posterior o igual al mes de inicio');
    }

    const costosDirectos = createAdicionalDto.costosDirectos ?? 0;
    const seguroVida = createAdicionalDto.seguroVida ?? 0;
    // AUI por defecto = 10% de (costos directos + seguro de vida) (el usuario puede enviarlo ajustado manualmente)
    const aui = createAdicionalDto.aui ?? Math.ceil((costosDirectos + seguroVida) * 0.10);

    const totales = this.calcularTotales(costosDirectos, seguroVida, aui);

    const adicional = this.adicionalRepository.create({
      idTipoAdicional: tipoAdicional,
      idCliente: cliente,
      idUsuarioCreacion: user,
      mesInicio,
      mesFin,
      costosDirectos,
      seguroVida,
      ...totales,
      costosDirectosSeguroVida: createAdicionalDto.costosDirectosSeguroVida ?? totales.costosDirectosSeguroVida,
      precioAntesIva: createAdicionalDto.precioAntesIva ?? totales.precioAntesIva,
      // Los adicionales no llevan IVA: siempre se guarda en 0, sin importar lo que se envie
      iva: 0,
      precioTotal: createAdicionalDto.precioTotal ?? totales.precioTotal,
    });

    try {

      await this.adicionalRepository.save(adicional);

      return adicional;

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

  async findAll(findAdicionalesDto: FindAdicionalesDto) {

    const { idCliente, pagination, limit = this.defaultLimit, offset = 0 } = findAdicionalesDto;

    const where = idCliente ? { idCliente: { idCliente } } : {};

    if (pagination === PaginationOption.TRUE) {

      const [adicionales, total] = await this.adicionalRepository.findAndCount({
        where,
        take: limit,
        skip: offset,
        order: { fechaCreacion: 'DESC' },
      });

      return {
        data: adicionales,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
        }
      };

    }

    const adicionales = await this.adicionalRepository.find({
      where,
      order: { fechaCreacion: 'DESC' },
    });

    return {
      data: adicionales,
      pagination: {
        total: adicionales.length,
        limit: adicionales.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  async findOne(id: number) {

    const adicional = await this.adicionalRepository.findOneBy({ idAdicional: id });

    if (!adicional) throw new NotFoundException(`Adicional con id "${id}" no se ha encontrado`);

    return adicional;

  }

  async update(id: number, updateAdicionalDto: UpdateAdicionalDto) {

    const adicional = await this.findOne(id);

    const mesInicio = updateAdicionalDto.mesInicio ? this.normalizarMes(updateAdicionalDto.mesInicio) : adicional.mesInicio;

    const mesFin = updateAdicionalDto.mesFin !== undefined
      ? (updateAdicionalDto.mesFin ? this.normalizarMes(updateAdicionalDto.mesFin) : null)
      : adicional.mesFin;

    if (mesFin != null && mesFin < mesInicio) {
      throw new BadRequestException('El mes de fin debe ser posterior o igual al mes de inicio');
    }

    const costosDirectos = updateAdicionalDto.costosDirectos ?? adicional.costosDirectos;
    const seguroVida = updateAdicionalDto.seguroVida ?? adicional.seguroVida;
    const aui = updateAdicionalDto.aui ?? adicional.aui;

    const totales = this.calcularTotales(costosDirectos, seguroVida, aui);

    const tipoAdicional = updateAdicionalDto.idTipoAdicional
      ? await this.findTipoAdicional(updateAdicionalDto.idTipoAdicional)
      : adicional.idTipoAdicional;

    Object.assign(adicional, {
      idTipoAdicional: tipoAdicional,
      mesInicio,
      mesFin,
      costosDirectos,
      seguroVida,
      estado: updateAdicionalDto.estado ?? adicional.estado,
      ...totales,
      costosDirectosSeguroVida: updateAdicionalDto.costosDirectosSeguroVida ?? totales.costosDirectosSeguroVida,
      precioAntesIva: updateAdicionalDto.precioAntesIva ?? totales.precioAntesIva,
      // Los adicionales no llevan IVA: siempre se guarda en 0, sin importar lo que se envie
      iva: 0,
      precioTotal: updateAdicionalDto.precioTotal ?? totales.precioTotal,
    });

    try {

      await this.adicionalRepository.save(adicional);

      return adicional;

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

  // CANCELAR UN ADICIONAL: deja de cobrarse desde este momento, sin importar el mesFin que tuviera configurado.
  // No se elimina, para conservar el historial de lo ya liquidado
  async cancelar(id: number) {

    const adicional = await this.findOne(id);

    adicional.estado = false;

    await this.adicionalRepository.save(adicional);

    return adicional;

  }

  async remove(id: number) {

    const adicional = await this.findOne(id);

    try {

      await this.adicionalRepository.remove(adicional);

    } catch (error) {

      this.logger.error(error);

      if (error.errno == 1451) {
        throw new BadRequestException(`El adicional "${adicional.idTipoAdicional.descripcion}" no se puede eliminar debido a que se esta usando en el sistema`);
      }

      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  // TIPOS DE ADICIONAL ACTIVOS (para el dropdown al crear/editar un adicional)
  async findAllTiposAdicional() {

    return this.tipoAdicionalRepository.find({
      where: { estado: true },
      order: { codigo: 'ASC' },
    });

  }

  private async findTipoAdicional(idTipoAdicional: number) {

    const tipoAdicional = await this.tipoAdicionalRepository.findOneBy({ idTipoAdicional });

    if (!tipoAdicional) throw new NotFoundException(`Tipo de adicional con id "${idTipoAdicional}" no se ha encontrado`);

    return tipoAdicional;

  }

  // NORMALIZA UNA FECHA AL DIA 1 DE SU MES (los adicionales se cobran por mes completo, no por dia).
  // SE EXTRAE EL AÑO/MES DEL STRING ISO (UTC), NO DE LOS GETTERS LOCALES (getFullYear/getMonth): si se usaran los
  // getters locales, una fecha como "2026-09-01" (medianoche UTC) se leeria como 31 de agosto a las 7pm en un
  // servidor en UTC-5 (Colombia), y el adicional quedaria guardado un mes atras del que realmente se selecciono
  private normalizarMes(fecha: Date): Date {

    const fechaSplit = new Date(fecha).toISOString().split('T')[0];

    const [año, mes] = fechaSplit.split('-').map(Number);

    return new Date(año, mes - 1, 1);

  }

  // A PARTIR DE COSTOS DIRECTOS, SEGURO VIDA Y AUI (los 3 valores fijos que coloca el usuario, no un porcentaje) CALCULA
  // EL RESTO DE CAMPOS. EL IVA ES DEL 1.9% (0.019), MISMO CRITERIO QUE EL RESTO DE TARIFAS DEL SISTEMA.
  // TODOS LOS VALORES SE REDONDEAN HACIA ARRIBA AL SIGUIENTE NUMERO ENTERO
  private calcularTotales(costosDirectos: number, seguroVida: number, aui: number) {

    const costosDirectosSeguroVida = Math.ceil(costosDirectos + seguroVida);
    const auiRedondeado = Math.ceil(aui);
    const precioAntesIva = costosDirectosSeguroVida + auiRedondeado;
    // Los adicionales no llevan IVA: se mantiene el campo en 0 para no alterar calculos posteriores
    const iva = 0;
    const precioTotal = Math.ceil(precioAntesIva + iva);

    return {
      costosDirectosSeguroVida,
      aui: auiRedondeado,
      precioAntesIva,
      iva,
      precioTotal,
    };

  }

  private handleDbExceptions(error: any) {

    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

}
