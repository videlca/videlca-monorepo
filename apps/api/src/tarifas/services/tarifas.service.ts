import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { ServiciosService } from '../../servicios/services';
import { PeriodosService } from '../../periodos/periodos.service';
import { EmailService, CorreoDefaultService } from '../../common/services';
import { ReporteTarifasService } from '../../reportes/services';

import { SendMailOptions } from '../../common/services/email/email.service';
import { EnviarCorreoDto, PaginationDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';
import { EstadoAppInterface } from '../../common/interfaces/estado-app.interface';

import { TipoHorarioInterface } from '../../servicios/interfaces/tipo-horario.interface';
import { TipoDuracionInterface } from '../../servicios/interfaces/tipo-duracion.interface';
import { TipoTarifaInterface } from '../interfaces/tipo-tarifa.interface';

import { Tarifa } from '../entities';
import { Servicio } from '../../servicios/entities';
import { Periodo } from '../../periodos/entities/periodo.entity';

import { CreateTarifaDto, UpdateTarifaDto, SaveTarifaDto, CalcularPreciosTarifaDto } from '../dto';
import { TipoTarifaService } from './tipo-tarifa.service';
import { TarifaHoraService } from './tarifa-hora.service';
import { TarifaHoraDescripcionService } from './tarifa-hora-descripcion.service';

@Injectable()
export class TarifasService {

  private readonly logger = new Logger('TarifasService');

  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta

  constructor(
    @InjectRepository(Tarifa)
    private readonly tarifaRepository: Repository<Tarifa>,
    private readonly dataSource: DataSource,
    private readonly tipoTarifaService: TipoTarifaService,
    private readonly servicioService: ServiciosService,
    @Inject(forwardRef(() => PeriodosService))
    private readonly periodoService: PeriodosService,
    private readonly tarifaHoraService: TarifaHoraService,
    private readonly tarifaHoraDescripcionService: TarifaHoraDescripcionService,
    private readonly emailService: EmailService, // Servicio de email para envio de correos
    private readonly correoDefaultService: CorreoDefaultService, // Servicio para obtener el email por defecto
    private readonly reporteTarifasService: ReporteTarifasService, // Servicio para generar reportes
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  // CALCULAR EL PRECIO DE LA TARIFA DE UN GRUPO DE SERVICIOS PARA UN PERIODO, A PARTIR DE LAS TARIFAS POR HORA (tarifa_hora) DE ESE PERIODO
  // No persiste nada, solo retorna una propuesta de precio (o indica que debe ingresarse manualmente) para que luego se guarde con create/guardar-tarifas
  async calcularPreciosServicios(calcularPreciosTarifaDto: CalcularPreciosTarifaDto) {

    const { idPeriodo, idsServicios } = calcularPreciosTarifaDto;

    // VALIDAR QUE EL PERIODO EXISTA
    await this.periodoService.findOne(idPeriodo);

    const calculados = [];
    const manuales = [];

    for (const idServicio of idsServicios) {

      const servicio = await this.servicioService.findOne(idServicio);

      const resultado = await this.calcularPrecioServicio(idPeriodo, servicio);

      if (resultado.calculado) {
        calculados.push(resultado);
      } else {
        manuales.push(resultado);
      }

    }

    return { calculados, manuales };

  }

  private async calcularPrecioServicio(idPeriodo: number, servicio: Servicio) {

    const base = {
      idServicio: servicio.idServicio,
      codigo: servicio.codigo,
      descripcion: servicio.descripcion,
      idTipoHorarioDescripcion: servicio.idTipoHorarioDescripcion.idTipoHorarioDescripcion,
      tipoHorario: servicio.idTipoHorarioDescripcion.nombre,
      idTipoDuracion: servicio.idTipoDuracion.idTipoDuracion,
      tipoDuracion: servicio.idTipoDuracion.descripcion,
      idTipoTarifa: servicio.idTipoTarifa.idTipoTarifa,
      tipoTarifa: servicio.idTipoTarifa.nombre,
      dominical: servicio.dominical,
    };

    const manual = (mensaje: string) => ({
      ...base,
      calculado: false,
      mensaje,
      costosDirectos: null,
      seguroVida: null,
      costosDirectosSeguroVida: null,
      aui: null,
      precioAntesIva: null,
      iva: null,
      precioTotal: null,
    });

    // SI EL SERVICIO SE COBRA "POR SERVICIO", NO IMPORTA SU HORARIO NI DURACION, EL PRECIO SIEMPRE ES MANUAL
    if (servicio.idTipoTarifa.nombre == TipoTarifaInterface.SERVICIO) {
      return manual('El servicio se cobra "por servicio", el precio (costos directos, seguro vida y aui) debe ingresarse manualmente');
    }

    // DIA COMPLETO (24 HORAS): EL PRECIO NO SE PUEDE CALCULAR, SE INGRESA MANUAL TAL CUAL LO VA A COBRAR
    if (servicio.idTipoHorarioDescripcion.nombre == TipoHorarioInterface.DIA_COMPLETO) {

      const nota = servicio.idTipoTarifa.nombre == TipoTarifaInterface.MES
        ? 'debe ingresar el valor total por 30 dias'
        : 'debe ingresar el valor del turno (24 horas)';

      return manual(`El horario es dia completo (24 horas), el precio debe ingresarse manualmente. Como el tipo de tarifa es "${servicio.idTipoTarifa.nombre}", ${nota}`);

    }

    // MIXTO + POR SERVICIO ya se filtro arriba. MIXTO + POR HORA: EL PRECIO SOLO SE CONOCE AL CREAR LA ORDEN DE SERVICIO (se desconoce cuantas horas seran de dia y cuantas de noche)
    if (servicio.idTipoHorarioDescripcion.nombre == TipoHorarioInterface.MIXTO) {
      return manual('El horario es mixto, el precio real se calcula al momento de crear la orden de servicio; por ahora debe ingresarse un valor manualmente');
    }

    // DIURNO O NOCTURNO: SE CALCULA A PARTIR DE LA TARIFA HORA DEL PERIODO
    const diurno = servicio.idTipoHorarioDescripcion.nombre == TipoHorarioInterface.DIURNO;

    const tarifaHoraDescripcion = await this.tarifaHoraDescripcionService.findOneByTipo(diurno, servicio.dominical);

    const valorHora = await this.tarifaHoraService.findOneByPeriodoYDescripcion(idPeriodo, tarifaHoraDescripcion.idTarifaHoraDescripcion);

    if (!valorHora) {
      return manual(`No se ha configurado el valor de la tarifa hora "${tarifaHoraDescripcion.nombre}" para este periodo`);
    }

    let multiplicador: number;

    if (servicio.idTipoDuracion.descripcion == TipoDuracionInterface.FIJA) {

      if (servicio.idTipoTarifa.nombre != TipoTarifaInterface.MES && servicio.idTipoTarifa.nombre != TipoTarifaInterface.TURNO) {
        return manual(`El tipo de tarifa "${servicio.idTipoTarifa.nombre}" no es valido para una duracion fija, debe ser mensual o por turno`);
      }

      multiplicador = servicio.idTipoTarifa.nombre == TipoTarifaInterface.MES
        ? servicio.horasFijas * 30
        : servicio.horasFijas;

    } else {

      if (servicio.idTipoTarifa.nombre != TipoTarifaInterface.HORA) {
        return manual(`El tipo de tarifa "${servicio.idTipoTarifa.nombre}" no es valido para una duracion flexible, debe ser por hora`);
      }

      // El precio se deja como el valor unitario de la hora, la cantidad real de horas se multiplica al crear la orden de servicio
      multiplicador = 1;

    }

    // BASE: costos directos, seguro vida y aui (los mismos 3 campos que el usuario ingresaria manualmente, aca se obtienen del valor hora del periodo)
    const costosDirectos = Number(valorHora.costosDirectos) * multiplicador;
    const seguroVida = Number(valorHora.seguroVida ?? 0) * multiplicador;
    const aui = Number(valorHora.aui) * multiplicador;

    return {
      ...base,
      calculado: true,
      mensaje: `Calculado con la tarifa hora "${tarifaHoraDescripcion.nombre}" del periodo`,
      ...this.calcularTotalesTarifa(costosDirectos, seguroVida, aui),
    };

  }

  // A PARTIR DE COSTOS DIRECTOS, SEGURO VIDA Y AUI (ya sea calculados o ingresados manualmente), CALCULA EL RESTO DE CAMPOS DE UNA TARIFA
  private calcularTotalesTarifa(costosDirectos: number, seguroVida: number, aui: number) {

    const costosDirectosSeguroVida = costosDirectos + seguroVida;
    const precioAntesIva = costosDirectosSeguroVida + aui;
    const iva = Math.round(precioAntesIva * 0.19); // IVA del 19%
    const precioTotal = Math.round(precioAntesIva + iva);

    return {
      costosDirectos,
      seguroVida,
      costosDirectosSeguroVida,
      aui,
      precioAntesIva,
      iva,
      precioTotal,
    };

  }

  async bulkCreate(bulkCreateTarifaDto: SaveTarifaDto) {

    const { idPeriodo, tarifas } = bulkCreateTarifaDto;

    // Crear QueryRunner para manejar la transacción
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // 1. Verificar que el periodo existe
      const periodo = await this.periodoService.findOne(idPeriodo);

      if (!periodo) {
        throw new NotFoundException(`Periodo con ID ${idPeriodo} no encontrado`);
      }

      // 3. Validar y obtener las entidades relacionadas para todas las tarifas
      const tarifasToCreate: Tarifa[] = [];

      for (const tarifaDto of tarifas) {

        // Verificar que el idPeriodo coincida
        if (tarifaDto.idPeriodo !== idPeriodo) {

          throw new BadRequestException(
            `La tarifa con servicio ${tarifaDto.idServicio} tiene un periodo diferente al especificado`
          );

        }

        // Obtener servicio
        const servicio = await this.servicioService.findOne(tarifaDto.idServicio);

        // Obtener tipo de tarifa
        const tipoTarifa = await this.tipoTarifaService.findOne(tarifaDto.idTipoTarifa);

        // Crear la entidad tarifa
        const tarifa = queryRunner.manager.create(Tarifa, {
          ...tarifaDto,
          idTipoTarifa: tipoTarifa,
          idServicio: servicio,
          idPeriodo: periodo
        });

        tarifasToCreate.push(tarifa);
      }

      // 4. Guardar todas las tarifas de una vez
      const savedTarifas = await queryRunner.manager.save(Tarifa, tarifasToCreate);

      // 5. Notificar por correo la creación de las tarifas
      await this.notificarTarifasPeriodoExcel(savedTarifas);

      // 6. Confirmar la transacción
      await queryRunner.commitTransaction();

      return {
        message: `Se guardaron ${savedTarifas.length} tarifas exitosamente`,
        tarifas: savedTarifas,
        idPeriodo: idPeriodo
      };

    } catch (error) {
      // Rollback en caso de error
      await queryRunner.rollbackTransaction();

      // Manejar errores específicos
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      // Para otros errores, usar tu método existente
      this.handleDbExceptions(error);

    } finally {

      // Liberar el QueryRunner
      await queryRunner.release();

    }

  }

  async create(createTarifaDto: CreateTarifaDto) {

    // OBTENER TIPO DE TARIFA
    const tipoTarifa = await this.tipoTarifaService.findOne(createTarifaDto.idTipoTarifa);

    // OBTENER SERVICIO
    const servicio = await this.servicioService.findOne(createTarifaDto.idServicio);

    // OBTENER PERIODO
    const periodo = await this.periodoService.findOne(createTarifaDto.idPeriodo);

    try {

      const tarifa = this.tarifaRepository.create({
        ...createTarifaDto,
        idServicio: servicio,
        idPeriodo: periodo
      });

      await this.tarifaRepository.save(tarifa);

      return tarifa;

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

  async findAllByPeriodo(id: number) {

    const queryBuilder = this.tarifaRepository.createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.idTipoDuracion', 'tipoDuracion')
      .leftJoinAndSelect('servicio.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      // .leftJoinAndSelect('tipoHorarioDescripcion.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      // .leftJoinAndSelect('tipoHorario.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      .where('tarifa.idPeriodo = :id', { id })

    const tarifas = await queryBuilder.getMany();

    // Agrupar por tipo de servicio
    const tarifasAgrupadas = tarifas.reduce((acc, tarifa) => {

      const tipo = tarifa.idServicio.idTipoServicio.nombre

      if (!acc[tipo]) {
        acc[tipo] = [];
      }

      acc[tipo].push(tarifa);

      return acc;

    }, {} as Record<string, Tarifa[]>);

    return tarifasAgrupadas;

  }

  async findAllActivesByPeriodo(id: number, paginationDto: PaginationDto) {

    const queryBuilder = this.tarifaRepository.createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .where('tarifa.idPeriodo = :id', { id })
      .andWhere('tarifa.estado = :estado', { estado: true })

    if (paginationDto.pagination === PaginationOption.TRUE) {
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      queryBuilder.take(limit).skip(offset);

      const [tarifas, total] = await queryBuilder.getManyAndCount();

      return {
        data: tarifas,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0
        }
      };

    }

    const tarifas = await queryBuilder.getMany();

    return {
      data: tarifas,
      pagination: {
        total: tarifas.length,
        limit: tarifas.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  async findAllActivesByPeriodoActivo(paginationDto: PaginationDto, pagination: boolean = true) {

    const periodoActivoFacturacion = await this.periodoService.obtenerPeriodoActivo();

    const queryBuilder = this.tarifaRepository.createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.idTipoDuracion', 'tipoDuracion')
      .where('tarifa.idPeriodo = :id', { id: periodoActivoFacturacion.idPeriodo })

    if (pagination) {
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      queryBuilder.take(limit).skip(offset);
      
      const [tarifas, total] = await queryBuilder.getManyAndCount();

      return {
        data: tarifas,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0
        }
      };

    }

    const tarifas = await queryBuilder.getMany();

    return {
      data: tarifas,
      pagination: {
        total: tarifas.length,
        limit: tarifas.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  async findAllActivesByPeriodoActivoTipoServicio(idTipoServicio: number, paginationDto: PaginationDto) {

    const periodoActivoFacturacion = await this.periodoService.obtenerPeriodoActivo();

    const queryBuilder = this.tarifaRepository.createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.idTipoDuracion', 'tipoDuracion')
      .where('tarifa.idPeriodo = :id', { id: periodoActivoFacturacion.idPeriodo })
      .andWhere('tipoServicio.idTipoServicio = :idTipoServicio', { idTipoServicio })
      .andWhere('tarifa.estado = :estado', { estado: true })

    if (paginationDto.pagination === PaginationOption.TRUE) {
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      queryBuilder.take(limit).skip(offset);

      const [tarifas, total] = await queryBuilder.getManyAndCount();

      // LOS SERVICIOS DE HORARIO MIXTO CON TARIFA POR HORA NO TIENEN FILA EN LA TABLA TARIFA (su precio se calcula al crear la orden),
      // se agregan solo en la primera pagina para que tambien queden disponibles para seleccionar en la orden de servicio
      const serviciosVirtuales = offset === 0
        ? await this.obtenerServiciosVirtualesMixtoPorHora(idTipoServicio, periodoActivoFacturacion, tarifas)
        : [];

      const total2 = total + serviciosVirtuales.length;

      return {
        data: [...tarifas, ...serviciosVirtuales],
        pagination: {
          total: total2,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total2 / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0
        }
      };

    }

    const tarifas = await queryBuilder.getMany();

    const serviciosVirtuales = await this.obtenerServiciosVirtualesMixtoPorHora(idTipoServicio, periodoActivoFacturacion, tarifas);

    const data = [...tarifas, ...serviciosVirtuales];

    return {
      data,
      pagination: {
        total: data.length,
        limit: data.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  // CONSTRUYE ENTRADAS "VIRTUALES" (SIN FILA REAL EN LA TABLA TARIFA) PARA LOS SERVICIOS DE HORARIO MIXTO CON TARIFA POR HORA,
  // PARA QUE TAMBIEN APAREZCAN COMO DISPONIBLES AL SELECCIONAR EL SERVICIO DE UNA ORDEN. Su precio se calcula al crear la orden de servicio.
  private async obtenerServiciosVirtualesMixtoPorHora(idTipoServicio: number, periodoActivoFacturacion: Periodo, tarifasExistentes: Tarifa[]) {

    const serviciosMixtoPorHora = await this.servicioService.findAllMixtoPorHora(idTipoServicio);

    const idsServiciosConTarifa = new Set(tarifasExistentes.map(tarifa => tarifa.idServicio.idServicio));

    return serviciosMixtoPorHora
      .filter(servicio => !idsServiciosConTarifa.has(servicio.idServicio))
      .map(servicio => ({
        idTarifa: null,
        idPeriodo: periodoActivoFacturacion,
        idServicio: servicio,
        idTipoTarifa: servicio.idTipoTarifa,
        costosDirectos: null,
        seguroVida: null,
        costosDirectosSeguroVida: null,
        aui: null,
        precioAntesIva: null,
        iva: null,
        precioTotal: null,
        estado: true,
        fechaCreacion: null,
        fechaActualizacion: null,
        calculadoEnOrden: true, // indica que este servicio no tiene una tarifa guardada, su precio se calcula al crear la orden de servicio
      }));

  }

  async findOne(id: number) {

    const tarifa = await this.tarifaRepository.findOne({
      where: {
        idTarifa: id
      },
      relations: {
        idPeriodo: true
      }
    });

    if (!tarifa) throw new NotFoundException(`Tarifa con id "${id}" no se ha encontrado`);

    return tarifa;

  }

  async findTarifaByServicio(idServicio: number) {

    // Use QueryBuilder to avoid ambiguous column issue
    const tarifas = await this.tarifaRepository
      .createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('tipoTarifa.idTipoUnidadTiempo', 'tipoUnidadTiempo')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('servicio.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      .where('tarifa.idServicio = :idServicio', { idServicio })
      .andWhere('tarifa.estado = :estado', { estado: true })
      .orderBy('tarifa.fechaCreacion', 'DESC')
      .getMany();

    if (!tarifas || tarifas.length === 0) {
      throw new NotFoundException(`No se encontraron tarifas para el servicio con ID ${idServicio}`);
    }

    return tarifas;

  }

  async update(id: number, updateTarifaDto: UpdateTarifaDto) {

    const { idTipoTarifa, idServicio, idPeriodo, ...tarifaData } = updateTarifaDto;

    const tarifa = await this.tarifaRepository.preload({ idTarifa: id, ...tarifaData });

    if (!tarifa) throw new NotFoundException(`Tarifa con id "${id}" no encontrado`);

    if (updateTarifaDto.idServicio) {

      // OBTENER SERVICIO
      const servicio = await this.servicioService.findOne(idServicio);

      tarifa.idServicio = servicio;

    }


    try {

      await this.tarifaRepository.save(tarifa);

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {

    const tarifa = await this.findOne(id);

    try {

      await this.tarifaRepository.remove(tarifa);

    } catch (error) {

      this.logger.error(error);

      if (error.errno == 1451) {
        throw new BadRequestException(`La tarifa no se puede eliminar debido a que se esta usando en el sistema`);
      }

      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  async downloadTarifasPeriodoExcel(id: number) {

    const queryBuilder = this.tarifaRepository.createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.idTipoDuracion', 'tipoDuracion')
      .leftJoinAndSelect('servicio.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      .where('tarifa.idPeriodo = :id', { id })

    const tarifas = await queryBuilder.getMany();

    // Agrupar por tipo de servicio
    const tarifasAgrupadas = tarifas.reduce((acc, tarifa) => {

      const tipo = tarifa.idServicio.idTipoServicio.nombre

      if (!acc[tipo]) {
        acc[tipo] = [];
      }

      acc[tipo].push(tarifa);

      return acc;

    }, {} as Record<string, Tarifa[]>);

    const nombrePeriodo = tarifas[0]?.idPeriodo?.nombre || 'Periodo';

    const excelBuffer = await this.reporteTarifasService.generateExcel(nombrePeriodo, tarifasAgrupadas);

    return {
      excelBuffer: excelBuffer,
      title: `tarifas-periodo-${nombrePeriodo}`
    };

  }

  async sendTarifasPeriodoExcel(idPeriodo: number, enviarCorreoDto: EnviarCorreoDto) {

    const queryBuilder = this.tarifaRepository.createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.idTipoDuracion', 'tipoDuracion')
      .leftJoinAndSelect('servicio.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      .where('tarifa.idPeriodo = :id', { id: idPeriodo })

    const tarifas = await queryBuilder.getMany();

    // Agrupar por tipo de servicio
    const tarifasAgrupadas = tarifas.reduce((acc, tarifa) => {

      const tipo = tarifa.idServicio.idTipoServicio.nombre

      if (!acc[tipo]) {
        acc[tipo] = [];
      }

      acc[tipo].push(tarifa);

      return acc;

    }, {} as Record<string, Tarifa[]>);

    const nombrePeriodo = tarifas[0]?.idPeriodo?.nombre || 'Periodo';

    const excelBuffer = await this.reporteTarifasService.generateExcel(nombrePeriodo, tarifasAgrupadas);

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Tarifas periodo ${nombrePeriodo}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">PERIODO ${nombrePeriodo}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia EXCEL adjunto con tarifas del periodo <b>${nombrePeriodo}</b>. <br><br>
              Por favor, revise el <b>EXCEL adjunto</b> para más detalles.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;

    const emails = enviarCorreoDto.correos.map(correo => correo.email);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `tarifas-periodo-${nombrePeriodo}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend) {
      throw new InternalServerErrorException(`Error al enviar correo con tarifas del periodo ${nombrePeriodo} a los emails ${emails}, revisar correos si estan bien escritos`);
    }

  }

  async notificarTarifasPeriodoExcel(tarifasPeriodo: Tarifa[]) {

    // Agrupar por tipo de servicio
    const tarifasAgrupadas = tarifasPeriodo.reduce((acc, tarifa) => {

      const tipo = tarifa.idServicio.idTipoServicio.nombre

      if (!acc[tipo]) {
        acc[tipo] = [];
      }

      acc[tipo].push(tarifa);

      return acc;

    }, {} as Record<string, Tarifa[]>);

    const nombrePeriodo = tarifasPeriodo[0]?.idPeriodo?.nombre || 'Periodo';

    const excelBuffer = await this.reporteTarifasService.generateExcel(nombrePeriodo, tarifasAgrupadas);

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Tarifas periodo ${nombrePeriodo}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">PERIODO ${nombrePeriodo}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se han creado tarifas para el periodo <b>${nombrePeriodo}</b>. <br><br>
              Por favor, revise el <b>EXCEL adjunto</b> para más detalles.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;

    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CONFIGURACION_TARIFAS);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `tarifas-periodo-${nombrePeriodo}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend) {
      throw new InternalServerErrorException(`Error al enviar correo con tarifas del periodo ${nombrePeriodo} a los emails ${emails}, revisar correos si estan bien escritos`);
    }

  }

  async searchTarifaByPeriodo(idPeriodo: number) {

    const tarifas = await this.tarifaRepository
      .createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.ordenesServicio', 'ordenServicioTarifa')
      .leftJoinAndSelect(
        'ordenServicioTarifa.idOrdenServicio',
        'ordenServicio'
      )
      .where('tarifa.idPeriodo = :idPeriodo', {
        idPeriodo,
      })
      .getMany();

    return tarifas;

  }

  private handleDbExceptions(error: any) {

    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

  // ELIMINAR TODOS LAS TARIFAS
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TARIFAS
  async deleteAllTarifas() {

    const query = this.tarifaRepository.createQueryBuilder('tarifa');

    try {

      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

}
