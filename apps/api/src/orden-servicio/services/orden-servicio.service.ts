import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Not, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

import { PaginationDto, EnviarCorreoDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';
import { EstadoAppInterface } from '../../common/interfaces/estado-app.interface';

import { User } from '../../users/entities/user.entity';
import { EstadoOrdenServicio as EstadoOrdenEntity } from "../../common/entities";
import { SendMailOptions } from '../../common/services/email/email.service';

import { EstadoOrdenServicioService, EmailService, CorreoDefaultService, FestivosService } from '../../common/services';
import { LocacionService } from '../../clientes/services';
import { TarifasService, TarifaHoraService, TarifaHoraDescripcionService } from '../../tarifas/services';
import { TipoHorarioService } from '../../servicios/services';
import { ReporteOrdenServicioService } from '../../reportes/services';
import { PeriodosService } from '../../periodos/periodos.service';

import { EstadoOrdenServicio } from '../../common/interfaces/estado-orden-servicio.interface';
import { TipoHorarioInterface } from 'src/servicios/interfaces/tipo-horario.interface';
import { TipoServicioInterface } from '../../servicios/interfaces/tipo-servicio.interface';
import { TipoTarifaInterface } from '../../tarifas/interfaces/tipo-tarifa.interface';
import { TipoHoraDescripcionInterface } from '../../tarifas/interfaces/tipo-hora-descripcion.interface';
import { OrigenServicioEnum } from '../interfaces/origen-servicio.interface';

import { Tarifa } from '../../tarifas/entities';

import {
  OrdenServicio,
  OrdenServicioId,
  OrdenServicioIdAnulado,
  OrdenServicioDetalle,
} from '../entities';

import {
  CreateOrdenServicioDto,
  UpdateOrdenServicioDto,

  // VALIDACIONES CREACION
  ValidarIdOrdenServicioDto,
  ValidarFechasOrdenServicioDto,
  ValidarHorarioServicioDto,
  PrecioOrdenDto,
  PrecioOrdenServicioItemDto,
  ValidarEmpleadosDisponiblesDto,
  ValidarRangoHorarioPersonalOrdenDto,

  // VALIDACIONES ACTUALIZACION
  UpdateValidarFechaOrdenServicioDto,

  // ANULAR ORDEN
  AnularIdOrdenServicioDto,

  // FILTRO
  FilterOrdenServicioDto,
  OrdenServicioFilterColumn,

  // INICIO
  GetReporteInicioDto
} from '../dto';

@Injectable()
export class OrdenServicioService {

  private readonly logger = new Logger('OrdenServicioService');

  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(OrdenServicio)
    private readonly ordenServicioRepository: Repository<OrdenServicio>,
    @InjectRepository(OrdenServicioId)
    private readonly ordenServicioIdRepository: Repository<OrdenServicioId>,
    @InjectRepository(OrdenServicioIdAnulado)
    private readonly ordenServicioIdAnuladoRepository: Repository<OrdenServicioIdAnulado>,
    @InjectRepository(OrdenServicioDetalle)
    private readonly ordenServicioDetalleRepository: Repository<OrdenServicioDetalle>,
    private readonly estadoOrdenService: EstadoOrdenServicioService,
    private readonly locacionService: LocacionService,
    private readonly tarifasService: TarifasService,
    private readonly tarifaHoraService: TarifaHoraService,
    private readonly tarifaHoraDescripcionService: TarifaHoraDescripcionService,
    private readonly tipoHorarioService: TipoHorarioService,
    private readonly periodosService: PeriodosService,
    private readonly festivosService: FestivosService,
    private readonly emailService: EmailService, // Servicio de email para envio de correos
    private readonly correoDefaultService: CorreoDefaultService, // Servicio para obtener el email por defecto
    private readonly reporteOrdenServicioService: ReporteOrdenServicioService, // Servicio para generar reportes
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async validarOrdenServicioId(validarIdOrdenServicioDto: ValidarIdOrdenServicioDto) {

    const ordenServicioId = await this.ordenServicioIdRepository.findOneBy({
      descripcionId: validarIdOrdenServicioDto.descripcionId
    });

    if (ordenServicioId) {
      throw new BadRequestException(`El ID "${validarIdOrdenServicioDto.descripcionId}" ya existe`);
    }

    return true

  }

  async create(createOrdenServicioDto: CreateOrdenServicioDto, user: User) {

    // Usar QueryRunner para transacción manual
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // OBTENER LOCACION
    const locacion = await this.locacionService.findOne(createOrdenServicioDto.idLocacion);

    // VERIFICAR QUE NO EXISTA EL NUMERO DE ORDEN
    const existeNumeroOrden = await this.ordenServicioIdRepository.findOneBy({
      descripcionId: createOrdenServicioDto.numeroOrdenServicio
    });

    if (existeNumeroOrden) {
      throw new BadRequestException(`El ID "${createOrdenServicioDto.numeroOrdenServicio}" ya existe`);
    }

    // FECHA INICIO ORDEN SERVICIO

    const fechaInicioSplit = createOrdenServicioDto.fechaInicio.toISOString().split('T')[0];

    const [añoInicio, mesInicio, diaInicio] = fechaInicioSplit.split('-').map(Number);

    const fechaInicioOrden = new Date(añoInicio, mesInicio - 1, diaInicio);

    // FECHA FIN ORDEN SERVICIO

    let fechaFinOrden = createOrdenServicioDto.fechaFin != null ? new Date(createOrdenServicioDto.fechaFin) : null;

    // Validar que las fechas sean lógicamente correcto
    if (createOrdenServicioDto.fechaFin != null) {

      // FECHA FIN ORDEN SERVICIO

      const fechaFinSplit = createOrdenServicioDto.fechaFin.toISOString().split('T')[0];

      const [añoFin, mesFin, diaFin] = fechaFinSplit.split('-').map(Number);

      fechaFinOrden = new Date(añoFin, mesFin - 1, diaFin);

      if (fechaInicioOrden > fechaFinOrden) {

        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');

      }

    }

    // FECHA CREACION ORDEN SERVICIO

    const fechaCreacionSplit = createOrdenServicioDto.fechaCreacion.toISOString().split('T')[0];

    const [añoCreacion, mesCreacion, diaCreacion] = fechaCreacionSplit.split('-').map(Number);

    const fechaCreacionOrden = new Date(añoCreacion, mesCreacion - 1, diaCreacion);

    // OBTENER LAS TARIFAS DE CADA SERVICIO DE LA ORDEN (se reutilizan mas abajo, evita volver a consultarlas)
    const tarifasPorItem = new Map<number, Tarifa>();

    for (const detalleDto of createOrdenServicioDto.servicios) {

      if (!tarifasPorItem.has(detalleDto.idTarifa)) {
        tarifasPorItem.set(detalleDto.idTarifa, await this.tarifasService.findOne(detalleDto.idTarifa));
      }

    }

    // SI LA ORDEN ES INDEFINIDA (SIN FECHA FIN), NINGUN SERVICIO PUEDE SER DE TIPO TARIFA "POR SERVICIO" (recogida de
    // dinero): ese tipo de tarifa se cobra por cada dia exacto, por lo que la orden debe tener si o si fecha de fin
    if (createOrdenServicioDto.fechaFin == null) {

      const tieneServicioPorServicio = [...tarifasPorItem.values()].some(
        tarifa => tarifa.idServicio.idTipoTarifa.nombre === TipoTarifaInterface.SERVICIO
      );

      if (tieneServicioPorServicio) {
        throw new BadRequestException('La orden debe tener fecha de fin, ya que tiene un servicio con tipo de tarifa "por servicio" (recogida de dinero)');
      }

    }

    // OBTENER ID ESTADO ORDEN SERVICIO
    //! VALIDAR SEGUN LAS FECHAS DE INICIO Y CREACION DE LA ORDEN DE SERVICIO
    let estadoOrdenServicio: EstadoOrdenEntity;

    if (createOrdenServicioDto.fechaFin != null && fechaFinOrden < fechaCreacionOrden) {
      // Caso 1: Ya terminó (fecha fin es anterior a fecha creación)
      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.TERMINADO);

    }

    else if (fechaInicioOrden > fechaCreacionOrden) {
      // Caso 2: Está programado para el futuro
      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.PROGRAMADO);

    }

    else {
      // Caso 3: Ya inició o debe iniciar (fechaInicio <= fechaCreacion)
      // Esto incluye cuando fechaInicio == fechaCreacion 
      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.INICIADO);

    }

    try {

      // Primero crear el OrdenServicioId
      const numeroOrden = queryRunner.manager.create(OrdenServicioId, {
        descripcionId: createOrdenServicioDto.numeroOrdenServicio,
        anulado: false
      });

      const savedNumeroOrden = await queryRunner.manager.save(OrdenServicioId, numeroOrden);

      // Crear la orden sin los servicios primero
      const ordenServicio = queryRunner.manager.create(OrdenServicio, {
        ordenServicioId: savedNumeroOrden,
        idUsuarioCreacion: user,
        idEstadoOrdenServicio: estadoOrdenServicio,
        idLocacion: locacion,
        origenServicio: createOrdenServicioDto.origenServicio,
        fechaInicio: fechaInicioOrden,
        fechaInicioOrden: fechaInicioOrden,
        fechaFin: createOrdenServicioDto.fechaFin ? fechaFinOrden : null,
        fechaFinOrden: createOrdenServicioDto.fechaFin ? fechaFinOrden : null,
        precioTotal: null,
        fechaCreacion: fechaCreacionOrden,
        fechaActualizacion: fechaCreacionOrden
      });

      const savedOrdenServicio = await queryRunner.manager.save(OrdenServicio, ordenServicio);

      // EL DESGLOSE (idTarifa, horas, precios) YA SE CALCULO PREVIAMENTE EN /obtener-precio Y SE RECIBE TAL CUAL SE
      // ENTREGO ALLA, NO SE VUELVE A CALCULAR AQUI. Solo se recalcula el precioTotal de la orden como la suma de los
      // precios de cada fila del desglose, en vez de confiar en un precioTotal que envie el front directamente
      let precioTotalCalculado = 0;

      for (const detalleDto of createOrdenServicioDto.servicios) {

        const tarifa = tarifasPorItem.get(detalleDto.idTarifa);

        // Si la orden es indefinida (sin fecha fin) todos los valores de precio quedan en null, ya que se cobra mes a mes al liquidar/finalizar
        const detalleOrden = queryRunner.manager.create(OrdenServicioDetalle, {
          idOrdenServicio: savedOrdenServicio,
          idTarifa: tarifa,
          horaInicio: detalleDto.horaInicio,
          horaFin: detalleDto.horaFin,
          fecha: detalleDto.fecha ?? null,
          cantidadHoras: createOrdenServicioDto.fechaFin != null ? (detalleDto.cantidadHoras ?? null) : null,
          costosDirectos: createOrdenServicioDto.fechaFin != null ? (detalleDto.costosDirectos ?? null) : null,
          seguroVida: createOrdenServicioDto.fechaFin != null ? (detalleDto.seguroVida ?? null) : null,
          costosDirectosSeguroVida: createOrdenServicioDto.fechaFin != null ? (detalleDto.costosDirectosSeguroVida ?? null) : null,
          aui: createOrdenServicioDto.fechaFin != null ? (detalleDto.aui ?? null) : null,
          precioAntesIva: createOrdenServicioDto.fechaFin != null ? (detalleDto.precioAntesIva ?? null) : null,
          iva: createOrdenServicioDto.fechaFin != null ? (detalleDto.iva ?? null) : null,
          precio: createOrdenServicioDto.fechaFin != null ? (detalleDto.precio ?? null) : null,
        });

        await queryRunner.manager.save(OrdenServicioDetalle, detalleOrden);

        precioTotalCalculado += detalleDto.precio ?? 0;

      }

      // SI LA ORDEN ES DEFINIDA, EL PRECIO TOTAL DE LA ORDEN SE RECALCULA COMO LA SUMA DE LOS PRECIOS DE CADA FILA DEL DESGLOSE
      if (createOrdenServicioDto.fechaFin != null) {

        savedOrdenServicio.precioTotal = Math.round(precioTotalCalculado);

        await queryRunner.manager.save(OrdenServicio, savedOrdenServicio);

      }

      // envio de correos que se tengan registrados en la locacion
      const nombreResponsable = `${locacion.primerNombreResponsable} ${locacion.primerApellidoResponsable}`;

      const emailsLocacion = await this.locacionService.getEmailsByLocacionAndEstado(
        createOrdenServicioDto.idLocacion,
        estadoOrdenServicio.idEstadoOrdenServicio
      )

      const emailsApp = await this.correoDefaultService.findAllByEstadoOrden(estadoOrdenServicio.nombre);

      const emails = [...emailsLocacion, ...emailsApp];

      await queryRunner.commitTransaction();

      await this.notificationEmail(
        savedOrdenServicio.idOrdenServicio,
        nombreResponsable,
        locacion.nombre,
        emails
      );

      return savedOrdenServicio;

    } catch (error) {

      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      throw error;

    } finally {

      await queryRunner.release();

    }


  }

  // ENVIAR CORREO PARA INFORMAR CREACION DE ORDEN DE SERVICIO
  private async notificationEmail(
    idOrdenServicio: number,
    nombreResponsable: string,
    locacion: string,
    emails: string[]
  ) {

    const ordenServicio = await this.findOneOrdenRelations(idOrdenServicio);

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CREACION ORDEN DE SERVICIO ${ordenServicio.ordenServicioId.descripcionId}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se ha creado una orden de servicio para el puesto <b>${locacion}</b> el cual tiene como responsable a <b>${nombreResponsable}</b>. <br><br>
              Por favor, revise el <b>PDF adjunto</b> para más detalles de la orden de servicio.
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

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): creacion orden de servicio ${ordenServicio.ordenServicioId.descripcionId}`;

    const ordenServicioBuffer = await this.reporteOrdenServicioService.getBufferReporteOrdenServicio(ordenServicio);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `Orden-servicio-${ordenServicio.ordenServicioId.descripcionId}.pdf`,
          content: ordenServicioBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend) {
      throw new InternalServerErrorException(`Error al enviar correo de notificacion a los emails ${emails.join(', ')}, revisar correos si estan bien escritos`);
    }

  }

  async findAll(paginationDto: PaginationDto) {

    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;

      // Se hace la consulta de manera paginada
      const [ordenesServicio, total] = await this.ordenServicioRepository.findAndCount({
        take: limit,
        skip: offset,
        order: {
          fechaInicio: 'DESC'
        }
      });

      return {
        data: ordenesServicio,
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

    const ordenesServicio = await this.ordenServicioRepository.find({
      order: {
        fechaInicio: 'DESC'
      }
    });

    return {
      data: ordenesServicio,
      pagination: {
        total: ordenesServicio.length,
        limit: ordenesServicio.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  // FILTRAR ORDENES DE SERVICIO POR COLUMNA
  async findFiltered(
    filterOrdenServicioDto: FilterOrdenServicioDto
  ) {
    
    const {
      column,
      query,
      limit = this.defaultLimit,
      offset = 0,
    } = filterOrdenServicioDto;
  
    const columnMap: Record<OrdenServicioFilterColumn, string> = {
      [OrdenServicioFilterColumn.NUMERO_ORDEN]: 'ordenServicioId.descripcionId',
      [OrdenServicioFilterColumn.LOCACION]: 'locacion.nombre',
      [OrdenServicioFilterColumn.CLIENTE]: 'cliente.nombre',
      [OrdenServicioFilterColumn.ESTADO]: 'estadoOrdenServicio.nombre',
    };
  
    const dbColumn = columnMap[column];
  
    if (!dbColumn) {
      throw new BadRequestException('Columna de filtro no permitida');
    }
  
    const qb = this.ordenServicioRepository
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('orden.idUsuarioCreacion', 'usuarioCreacion')
      .leftJoinAndSelect('orden.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('orden.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .leftJoinAndSelect('orden.detalles', 'detalles')
      .leftJoinAndSelect('detalles.idTarifa', 'tarifa')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .where(`${dbColumn} LIKE :query`, {
        query: `%${query}%`,
      })
      .orderBy('orden.fechaInicio', 'DESC');
  
    if (filterOrdenServicioDto.pagination === PaginationOption.TRUE) {
      qb.take(limit).skip(offset);

      const [ordenesServicio, total] = await qb.getManyAndCount();

      return {
        data: ordenesServicio,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
        },
      };
    }
  
    const ordenesServicio = await qb.getMany();

    return {
      data: ordenesServicio,
      pagination: {
        total: ordenesServicio.length,
        limit: ordenesServicio.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    }

  }

  async findOne(id: number) {

    const ordenServicio = await this.ordenServicioRepository.findOneBy({ idOrdenServicio: id });

    if (!ordenServicio) throw new NotFoundException(`Orden de servicio con id "${id}" no se ha encontrado`);

    return ordenServicio;

  }

  async findOneOrdenRelations(id: number) {

    const ordenServicio = await this.ordenServicioRepository.findOne({
      where: { idOrdenServicio: id },
      relations: {
        ordenServicioId: true,
        idUsuarioCreacion: true,
        idEstadoOrdenServicio: true,
        detalles: {
          idTarifa: {
            idServicio: true
          },
        },
        idLocacion: {
          correos: true,
          idCliente: {
            idTipoCliente: true
          },
          idCiudad: true,
        },
      },
    });

    if (!ordenServicio)
      throw new NotFoundException(`Orden de servicio con id "${id}" no se ha encontrado`);

    return ordenServicio;
  }

  async validacionFechas(validarFechasOrdenDto: ValidarFechasOrdenServicioDto) {

    const { fechaInicio, fechaFin } = validarFechasOrdenDto;

    //! VALIDACION FECHAS

    // FECHA INICIO ORDEN SERVICIO

    const fechaInicioSplit = fechaInicio.toISOString().split('T')[0];

    const [añoInicio, mesInicio, diaInicio] = fechaInicioSplit.split('-').map(Number);

    const fechaInicioOrden = new Date(añoInicio, mesInicio - 1, diaInicio);

    // FECHA FIN ORDEN SERVICIO

    let fechaFinOrden = fechaFin != null ? new Date(fechaFin) : null;

    // Validar que las fechas sean lógicamente correcto
    if (fechaFin != null) {

      // FECHA FIN ORDEN SERVICIO

      const fechaFinSplit = fechaFin.toISOString().split('T')[0];

      const [añoFin, mesFin, diaFin] = fechaFinSplit.split('-').map(Number);

      fechaFinOrden = new Date(añoFin, mesFin - 1, diaFin);

      if (fechaInicioOrden > fechaFinOrden) {

        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');

      }

    }

  }

  // VALIDA QUE LAS HORAS SELECCIONADAS PARA UN SERVICIO DEL CATALOGO COINCIDAN CON SU DURACION CONFIGURADA.
  // A LA MEDIDA: las horas solo se usan para calcular el precio (/obtener-precio), no hay un servicio del catalogo
  // contra el cual validar su duracion, por lo que no aplica ninguna validacion.
  // CATALOGO: si el servicio es de 24 horas (dia completo, incluye siempre a Monitoreo de alarmas, que es mensual y
  // 24 horas fijas) no se elige horario, es de 00:00:00 a 23:59:00 siempre, no aplica validar horas. Si es de 8 o 12
  // horas, la duracion seleccionada debe coincidir exactamente con las horas fijas del servicio.
  async validacionHorarios(validarHorarioServicioDto: ValidarHorarioServicioDto) {

    const { origenServicio, idTarifa, horaInicio, horaFin } = validarHorarioServicioDto;

    if (origenServicio === OrigenServicioEnum.A_MEDIDA) {
      return;
    }

    const tarifa = await this.tarifasService.findOne(idTarifa);

    const servicio = tarifa.idServicio;

    if (servicio.idTipoServicio.nombre === TipoServicioInterface.MONITOREO_ALARMAS || servicio.horasFijas === 24) {
      return;
    }

    const duracionServicio = await this.calcularDuracionServicio(horaInicio, horaFin);

    if (duracionServicio !== servicio.horasFijas) {

      throw new BadRequestException(`La duracion del servicio debe ser de ${servicio.horasFijas} horas`);

    }

  }

  async calcularDuracionServicio(horaInicio: string, horaFin: string) {

    // Convertir a minutos totales
    function horaAMinutos(hora: string): number {
      const [h, m, s] = hora.split(':').map(Number);
      return h * 60 + m + s / 60;
    }

    let minutosInicio = horaAMinutos(horaInicio);
    let minutosFin = horaAMinutos(horaFin);

    // Si la hora de fin es menor, cruza medianoche
    if (minutosFin < minutosInicio) {
      minutosFin += 24 * 60; // Agregar 24 horas
    }

    const duracionMinutos = minutosFin - minutosInicio;
    return duracionMinutos / 60; // Convertir a horas


  }

  // CALCULA EL PRECIO DE UNA ORDEN DE SERVICIO (CATALOGO O A LA MEDIDA).
  // Retorna los totales de la orden y ademas, en "servicios", el desglose para persistir en OrdenServicioDetalle
  async obtenerPrecio(precioOrdenDto: PrecioOrdenDto) {

    const { origenServicio, fechaInicio, fechaFin } = precioOrdenDto;

    if (!fechaFin) {

      const mensajeIndefinida = 'La orden de servicio es indefinida, el precio se calculara al momento de hacer la liquidacion o al finalizar el servicio';

      return {
        message: mensajeIndefinida,
        precio: null,
        costosDirectos: null,
        seguroVida: null,
        costosDirectosSeguroVida: null,
        aui: null,
        precioAntesIva: null,
        iva: null,
        servicios: origenServicio === OrigenServicioEnum.CATALOGO
          ? precioOrdenDto.servicios.map(item => ({
            idTarifa: item.idTarifa,
            horaInicio: item.horaInicio,
            horaFin: item.horaFin,
            cantidadHoras: null,
            message: mensajeIndefinida,
            costosDirectos: null,
            seguroVida: null,
            costosDirectosSeguroVida: null,
            aui: null,
            precioAntesIva: null,
            iva: null,
            precio: null,
          }))
          : [],
      };

    }

    // FECHAS NORMALIZADAS (sin horas, para poder operar solo con dias)
    const fechaInicioOrden = this.normalizarFecha(fechaInicio);
    const fechaFinOrden = this.normalizarFecha(fechaFin);

    const detalles = origenServicio === OrigenServicioEnum.CATALOGO
      ? await this.calcularPrecioCatalogo(precioOrdenDto.servicios, fechaInicioOrden, fechaFinOrden)
      : await this.calcularPrecioAMedida(precioOrdenDto.horaInicio, fechaInicioOrden, precioOrdenDto.horaFin, fechaFinOrden);

    // TOTALES DE LA ORDEN: se suman los valores YA CALCULADOS (costosDirectos, seguroVida, aui) de cada fila del
    // desglose, y se calcula el iva/precioTotal una sola vez sobre el total, para no arrastrar errores de redondeo
    const baseTotales = detalles.reduce((acumulado, detalle) => ({
      costosDirectos: acumulado.costosDirectos + detalle.costosDirectos,
      seguroVida: acumulado.seguroVida + detalle.seguroVida,
      aui: acumulado.aui + detalle.aui,
    }), { costosDirectos: 0, seguroVida: 0, aui: 0 });

    const totalesOrden = this.calcularTotalesOrden(baseTotales.costosDirectos, baseTotales.seguroVida, baseTotales.aui);

    return {
      message: `Precio calculado para ${detalles.length} fila(s) del desglose`,
      precio: totalesOrden.precioTotal,
      costosDirectos: totalesOrden.costosDirectos,
      seguroVida: totalesOrden.seguroVida,
      costosDirectosSeguroVida: totalesOrden.costosDirectosSeguroVida,
      aui: totalesOrden.aui,
      precioAntesIva: totalesOrden.precioAntesIva,
      iva: totalesOrden.iva,
      servicios: detalles,
    };

  }

  // CALCULA EL PRECIO DE CADA SERVICIO DEL CATALOGO SELECCIONADO PARA LA ORDEN (cada uno ya tiene su propia tarifa)
  private async calcularPrecioCatalogo(
    items: PrecioOrdenServicioItemDto[],
    fechaInicioOrden: Date,
    fechaFinOrden: Date,
  ) {

    const dias = this.calcularDuracionServicioDias(new Date(fechaInicioOrden), new Date(fechaFinOrden));

    const detalles: {
      idTarifa: number; horaInicio: string; horaFin: string; cantidadHoras: number | null; fecha: Date | null; message: string;
      costosDirectos: number; seguroVida: number; costosDirectosSeguroVida: number; aui: number;
      precioAntesIva: number; iva: number; precio: number;
    }[] = [];

    for (const item of items) {

      const tarifa = await this.tarifasService.findOne(item.idTarifa);

      const servicio = tarifa.idServicio;
      const tipoServicioNombre = servicio.idTipoServicio.nombre;
      const tipoTarifaNombre = servicio.idTipoTarifa.nombre;

      let desglose: ReturnType<OrdenServicioService['calcularTotalesTarifa']>;
      let mensaje: string;

      // MONITOREO DE ALARMAS: SIEMPRE MENSUAL, NO COBRA SEGURO DE VIDA
      if (tipoServicioNombre === TipoServicioInterface.MONITOREO_ALARMAS) {

        if (this.esMesExacto(fechaInicioOrden, fechaFinOrden)) {

          desglose = this.tomarTotalesDeTarifa(tarifa);
          mensaje = 'Monitoreo de alarmas, es un mes exacto, se cobra la tarifa mensual completa';

        } else {

          const costosDirectos = this.prorratearValorMensual(Number(tarifa.costosDirectos), fechaInicioOrden, fechaFinOrden);

          desglose = this.calcularTotalesTarifa(costosDirectos, 0, 0.10);
          mensaje = `Monitoreo de alarmas, ${dias} dia(s), proporcional a la tarifa mensual (meses completos a tarifa llena, no cobra seguro de vida)`;

        }

      }

      // POR SERVICIO (recogida de dinero): costos directos * dias, seguro de vida TOTAL MENSUAL (sin dividir entre 30) * dias, aui flat 10%
      else if (tipoTarifaNombre === TipoTarifaInterface.SERVICIO) {

        const costosDirectos = Number(tarifa.costosDirectos) * dias;

        const seguroVidaMensual = await this.obtenerSeguroVidaMensualPeriodo(tarifa.idPeriodo.idPeriodo);
        const seguroVida = seguroVidaMensual * dias;

        desglose = this.calcularTotalesTarifa(costosDirectos, seguroVida, 0.10);
        mensaje = `Por servicio, ${dias} dia(s)`;

      }

      // POR TURNO: costos directos * dias, seguro de vida (mensual, de tarifa_hora) / 30 * dias, aui flat 10%
      else if (tipoTarifaNombre === TipoTarifaInterface.TURNO) {

        const costosDirectos = Number(tarifa.costosDirectos) * dias;

        const seguroVidaMensual = await this.obtenerSeguroVidaMensualPeriodo(tarifa.idPeriodo.idPeriodo);
        const seguroVida = Math.ceil(seguroVidaMensual / 30) * dias;

        desglose = this.calcularTotalesTarifa(costosDirectos, seguroVida, 0.10);
        mensaje = `Por turno, ${dias} dia(s)`;

      }

      // MENSUAL: si es un mes exacto se cobra la tarifa completa, sino se prorratea por dias. AUI 10% armado / 8% sin armado
      else if (tipoTarifaNombre === TipoTarifaInterface.MES) {

        if (this.esMesExacto(fechaInicioOrden, fechaFinOrden)) {

          desglose = this.tomarTotalesDeTarifa(tarifa);
          mensaje = 'Es un mes exacto, se cobra la tarifa mensual completa';

        } else {

          const costosDirectos = this.prorratearValorMensual(Number(tarifa.costosDirectos), fechaInicioOrden, fechaFinOrden);

          const seguroVidaMensual = await this.obtenerSeguroVidaMensualPeriodo(tarifa.idPeriodo.idPeriodo);
          const seguroVida = this.prorratearValorMensual(seguroVidaMensual, fechaInicioOrden, fechaFinOrden);

          const porcentajeAui = servicio.armado ? 0.10 : 0.08;

          desglose = this.calcularTotalesTarifa(costosDirectos, seguroVida, porcentajeAui);
          mensaje = `${dias} dia(s), proporcional a la tarifa mensual (meses completos a tarifa llena, AUI ${servicio.armado ? '10% armado' : '8% sin armado'})`;

        }

      }

      else {

        throw new BadRequestException(`No se pudo determinar la forma de calculo del precio para la tarifa "${item.idTarifa}"`);

      }

      detalles.push({
        idTarifa: tarifa.idTarifa,
        horaInicio: item.horaInicio,
        horaFin: item.horaFin,
        cantidadHoras: null,
        fecha: null,
        message: mensaje,
        costosDirectos: desglose.costosDirectos,
        seguroVida: desglose.seguroVida,
        costosDirectosSeguroVida: desglose.costosDirectosSeguroVida,
        aui: desglose.aui,
        precioAntesIva: desglose.precioAntesIva,
        iva: desglose.iva,
        precio: desglose.precioTotal,
      });

    }

    return detalles;

  }

  // TOMA LOS TOTALES YA CALCULADOS Y GUARDADOS EN UNA TARIFA (usado cuando se cobra el mes/tarifa completa tal cual)
  private tomarTotalesDeTarifa(tarifa: Tarifa) {

    return {
      costosDirectos: Number(tarifa.costosDirectos),
      seguroVida: Number(tarifa.seguroVida),
      costosDirectosSeguroVida: Number(tarifa.costosDirectosSeguroVida),
      aui: Number(tarifa.aui),
      precioAntesIva: Number(tarifa.precioAntesIva),
      iva: Number(tarifa.iva),
      precioTotal: Number(tarifa.precioTotal),
    };

  }

  // CALCULA EL PRECIO DE UNA ORDEN A LA MEDIDA, DIA POR DIA: cada dia se separa en horas diurnas y nocturnas segun
  // el horario vigente (diurno/nocturno) y se calculan sus costos directos con el valor hora de la tarifa catalogo
  // de turno de 12 horas correspondiente (diurna/nocturna, ordinaria/dominical-festiva segun el dia). El seguro de
  // vida se cobra una unica vez por dia completo (no se divide entre las horas diurnas/nocturnas de ese dia). Cada
  // dia genera una fila del desglose asociada a la tarifa catalogo de "turno de 24 horas" (ordinaria o dominical
  // segun el dia), ya que esa es la que representa el dia completo (diurno + nocturno)
  private async calcularPrecioAMedida(
    horaInicio: string,
    fechaInicioOrden: Date,
    horaFin: string,
    fechaFinOrden: Date,
  ) {

    const periodoActivo = await this.periodosService.obtenerPeriodoActivo();

    if (!periodoActivo) {
      throw new BadRequestException('No hay un periodo activo de facturacion configurado para calcular el precio de esta orden');
    }

    const tipoHorarioVigente = await this.tipoHorarioService.findVigenteActual();

    const rangoDiurno = this.tipoHorarioService.obtenerRangoHorario(tipoHorarioVigente, TipoHorarioInterface.DIURNO);

    const minutosInicioDiurno = this.horaAMinutos(rangoDiurno.horaInicio);
    const minutosFinDiurno = this.horaAMinutos(rangoDiurno.horaFin);

    const seguroVidaMensual = await this.obtenerSeguroVidaMensualPeriodo(periodoActivo.idPeriodo);
    const seguroVidaDia = Math.ceil(seguroVidaMensual / 30);

    const detalles: {
      idTarifa: number; horaInicio: string; horaFin: string; cantidadHoras: number | null; fecha: Date | null; message: string;
      costosDirectos: number; seguroVida: number; costosDirectosSeguroVida: number; aui: number;
      precioAntesIva: number; iva: number; precio: number;
    }[] = [];

    const fechaIter = new Date(fechaInicioOrden);

    while (fechaIter <= fechaFinOrden) {

      const esPrimerDia = fechaIter.getTime() === fechaInicioOrden.getTime();
      const esUltimoDia = fechaIter.getTime() === fechaFinOrden.getTime();

      const minutosInicioVentana = esPrimerDia ? this.horaAMinutos(horaInicio) : 0;
      const minutosFinVentana = esUltimoDia ? this.horaAMinutos(horaFin) : 1440;

      if (minutosFinVentana > minutosInicioVentana) {

        const esDominicalDia = await this.esDiaDominicalOFestivo(fechaIter);

        // PARTIR LA VENTANA DEL DIA EN LOS PUNTOS DONDE CAMBIA DE DIURNO A NOCTURNO (O VICEVERSA)
        const limites = [0, minutosInicioDiurno, minutosFinDiurno, 1440]
          .filter(limite => limite > minutosInicioVentana && limite < minutosFinVentana);

        const puntos = [minutosInicioVentana, ...limites, minutosFinVentana];

        let horasDiurnas = 0;
        let horasNocturnas = 0;

        for (let i = 0; i < puntos.length - 1; i++) {

          const inicioSegmento = puntos[i];
          const finSegmento = puntos[i + 1];
          const horasSegmento = (finSegmento - inicioSegmento) / 60;

          if (horasSegmento <= 0) continue;

          // EL PUNTO MEDIO DEL SEGMENTO DETERMINA SI ES DIURNO O NOCTURNO
          const puntoMedio = (inicioSegmento + finSegmento) / 2;
          const esDiurno = puntoMedio >= minutosInicioDiurno && puntoMedio < minutosFinDiurno;

          if (esDiurno) horasDiurnas += horasSegmento;
          else horasNocturnas += horasSegmento;

        }

        const cantidadHoras = horasDiurnas + horasNocturnas;

        if (cantidadHoras > 0) {

          const valorHoraDiurno = horasDiurnas > 0
            ? Number((await this.tarifasService.findOneTurnoVigilanciaByPeriodo(periodoActivo.idPeriodo, 12, TipoHorarioInterface.DIURNO, esDominicalDia)).costosDirectos) / 12
            : 0;

          const valorHoraNocturno = horasNocturnas > 0
            ? Number((await this.tarifasService.findOneTurnoVigilanciaByPeriodo(periodoActivo.idPeriodo, 12, TipoHorarioInterface.NOCTURNO, esDominicalDia)).costosDirectos) / 12
            : 0;

          const costosDirectosDia = (horasDiurnas * valorHoraDiurno) + (horasNocturnas * valorHoraNocturno);

          const tarifa24h = await this.tarifasService.findOneTurnoVigilanciaByPeriodo(periodoActivo.idPeriodo, 24, TipoHorarioInterface.DIA_COMPLETO, esDominicalDia);

          const desglose = this.calcularTotalesTarifa(costosDirectosDia, seguroVidaDia, 0.10);

          detalles.push({
            idTarifa: tarifa24h.idTarifa,
            horaInicio: this.minutosAHora(minutosInicioVentana),
            horaFin: this.minutosAHora(minutosFinVentana),
            cantidadHoras: Math.round(cantidadHoras),
            fecha: new Date(fechaIter),
            message: `${this.formatearFecha(fechaIter)}: ${horasDiurnas}h diurnas + ${horasNocturnas}h nocturnas${esDominicalDia ? ' (dominical/festivo)' : ''}`,
            costosDirectos: desglose.costosDirectos,
            seguroVida: desglose.seguroVida,
            costosDirectosSeguroVida: desglose.costosDirectosSeguroVida,
            aui: desglose.aui,
            precioAntesIva: desglose.precioAntesIva,
            iva: desglose.iva,
            precio: desglose.precioTotal,
          });

        }

      }

      fechaIter.setDate(fechaIter.getDate() + 1);

    }

    return detalles;

  }

  // OBTIENE EL VALOR MENSUAL DEL SEGURO DE VIDA CONFIGURADO EN LAS TARIFAS POR HORA DE UN PERIODO
  private async obtenerSeguroVidaMensualPeriodo(idPeriodo: number): Promise<number> {

    const seguroVidaDescripcion = await this.tarifaHoraDescripcionService.findOneByName(TipoHoraDescripcionInterface.SEGURO_VIDA);

    const tarifaHora = await this.tarifaHoraService.findOneByPeriodoYDescripcion(idPeriodo, seguroVidaDescripcion.idTarifaHoraDescripcion);

    if (!tarifaHora || tarifaHora.precio == null) {
      throw new BadRequestException('No se ha configurado el valor del seguro de vida en las tarifas por hora de este periodo');
    }

    return Number(tarifaHora.precio);

  }

  // A PARTIR DE COSTOS DIRECTOS, SEGURO VIDA Y EL PORCENTAJE DE AUI QUE APLIQUE, CALCULA EL RESTO DE CAMPOS DE UNA
  // FILA DEL DESGLOSE. EL IVA DE ESTA TARIFA (POR HORA) ES DEL 1.9% (0.019).
  // TODOS LOS VALORES SE REDONDEAN HACIA ARRIBA AL SIGUIENTE NUMERO ENTERO
  private calcularTotalesTarifa(costosDirectos: number, seguroVida: number, porcentajeAui: number) {

    const costosDirectosSeguroVida = Math.ceil(costosDirectos + seguroVida);
    const aui = Math.ceil(costosDirectosSeguroVida * porcentajeAui);
    const precioAntesIva = costosDirectosSeguroVida + aui;
    const iva = Math.ceil(precioAntesIva * 0.019);
    const precioTotal = Math.ceil(precioAntesIva + iva);

    return {
      costosDirectos: Math.ceil(costosDirectos),
      seguroVida: Math.ceil(seguroVida),
      costosDirectosSeguroVida,
      aui,
      precioAntesIva,
      iva,
      precioTotal,
    };

  }

  // SUMA LOS VALORES BASE (costosDirectos, seguroVida, aui) YA CALCULADOS POR CADA FILA DEL DESGLOSE Y CALCULA
  // EL IVA/PRECIO TOTAL UNA SOLA VEZ SOBRE EL TOTAL DE LA ORDEN, PARA NO ARRASTRAR ERRORES DE REDONDEO POR FILA
  private calcularTotalesOrden(costosDirectos: number, seguroVida: number, aui: number) {

    const costosDirectosSeguroVida = costosDirectos + seguroVida;
    const precioAntesIva = costosDirectosSeguroVida + aui;
    const iva = Math.ceil(precioAntesIva * 0.019);
    const precioTotal = Math.ceil(precioAntesIva + iva);

    return { costosDirectos, seguroVida, costosDirectosSeguroVida, aui, precioAntesIva, iva, precioTotal };

  }

  // UNA FECHA ES DOMINICAL SI ES DOMINGO O SI ES UN DIA FESTIVO (API DE FESTIVOS)
  private async esDiaDominicalOFestivo(fecha: Date): Promise<boolean> {

    if (fecha.getDay() === 0) return true;

    return await this.festivosService.esFestivo(fecha);

  }

  // CONVIERTE UNA FECHA (ISO o Date) A UN Date NORMALIZADO A MEDIANOCHE, HORA LOCAL, SIN MUTAR EL ORIGINAL
  private normalizarFecha(fecha: Date): Date {

    const fechaSplit = fecha.toISOString().split('T')[0];

    const [año, mes, dia] = fechaSplit.split('-').map(Number);

    return new Date(año, mes - 1, dia);

  }

  // CONVIERTE UNA HORA EN FORMATO 'HH:mm:ss' A MINUTOS DESDE LA MEDIANOCHE
  private horaAMinutos(hora: string): number {

    const [hh, mm = '0', ss = '0'] = hora.split(':');

    return (Number(hh) * 60) + Number(mm) + Math.floor(Number(ss) / 60);

  }

  // CONVIERTE MINUTOS DESDE LA MEDIANOCHE A FORMATO 'HH:mm:ss' (1440 se muestra como '24:00:00', fin del dia)
  private minutosAHora(minutos: number): string {

    const totalMinutos = Math.round(minutos);
    const horas = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;

    return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;

  }

  // FORMATEA UNA FECHA A 'YYYY-MM-DD'
  private formatearFecha(fecha: Date): string {

    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${año}-${mes}-${dia}`;

  }

  // DETERMINA SI EL RANGO DE FECHAS ES UN "MES EXACTO" PARA EFECTOS DE COBRO MENSUAL:
  // unicamente el mes calendario completo (ej: todo enero: 1 ene -> 31 ene). Del 15 de enero al 15 de febrero
  // NO cuenta como mes exacto, aunque sean 30/31 dias de diferencia, debe empezar el dia 1 y terminar el ultimo dia del mes
  private esMesExacto(fechaInicio: Date, fechaFin: Date): boolean {

    if (fechaInicio.getDate() !== 1) {
      return false;
    }

    const ultimoDiaDelMes = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0).getDate();

    return (
      fechaFin.getFullYear() === fechaInicio.getFullYear() &&
      fechaFin.getMonth() === fechaInicio.getMonth() &&
      fechaFin.getDate() === ultimoDiaDelMes
    );

  }

  // PRORRATEA UN VALOR MENSUAL (costos directos o seguro de vida) A TRAVES DE UN RANGO DE FECHAS QUE PUEDE ABARCAR
  // VARIOS MESES: recorre mes por mes el rango [fechaInicioOrden, fechaFinOrden] y por cada mes que este COMPLETO
  // dentro del rango (del dia 1 al ultimo dia de ese mes) cobra el valor mensual completo; los meses parciales
  // (al inicio o al final del rango) se cobran proporcional por dia (valorMensual / 30 * dias de ese tramo).
  // Ej: 25 agosto -> 10 octubre = agosto parcial (7 dias) + septiembre completo (tarifa llena) + octubre parcial (10 dias)
  private prorratearValorMensual(valorMensual: number, fechaInicioOrden: Date, fechaFinOrden: Date): number {

    let total = 0;

    const mesIter = new Date(fechaInicioOrden.getFullYear(), fechaInicioOrden.getMonth(), 1);

    while (mesIter <= fechaFinOrden) {

      const primerDiaMes = new Date(mesIter.getFullYear(), mesIter.getMonth(), 1);
      const ultimoDiaMes = new Date(mesIter.getFullYear(), mesIter.getMonth() + 1, 0);

      const inicioTramo = fechaInicioOrden > primerDiaMes ? fechaInicioOrden : primerDiaMes;
      const finTramo = fechaFinOrden < ultimoDiaMes ? fechaFinOrden : ultimoDiaMes;

      const esMesCompleto = inicioTramo.getTime() === primerDiaMes.getTime() && finTramo.getTime() === ultimoDiaMes.getTime();

      if (esMesCompleto) {

        total += valorMensual;

      } else {

        const diasTramo = this.calcularDuracionServicioDias(new Date(inicioTramo), new Date(finTramo));
        total += (valorMensual / 30) * diasTramo;

      }

      mesIter.setMonth(mesIter.getMonth() + 1);

    }

    return total;

  }

  private calcularDuracionServicioDias(fechaInicio: Date, fechaFin: Date) {

    // Convertir a objetos Date si son strings
    const inicio = fechaInicio;
    const fin = fechaFin;

    // Resetear las horas para trabajar solo con fechas (sin horas)
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);

    // Calcular la diferencia en milisegundos
    const diferenciaMilisegundos = fin.getTime() - inicio.getTime();

    // Convertir a días
    const diasDiferencia = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

    // La duración mínima es 1 día (mismo día = 1 día de servicio)
    return diasDiferencia + 1;

  }

  private parseHour(time: string): number {
    const [hh] = time.split(":").map(Number);
    return hh;
  }

  private getDuration(start: number, end: number): number {
    if (start === end) return 24; // Orden de 24 horas
    if (end > start) return end - start;
    return (24 - start) + end; // Horario nocturno
  }

  async validarAsignaciones(validarRangoHorarioPersonalOrdenDto: ValidarRangoHorarioPersonalOrdenDto) {

    const horaInicio = this.parseHour(validarRangoHorarioPersonalOrdenDto.horaInicio);
    const horaFin = this.parseHour(validarRangoHorarioPersonalOrdenDto.horaFin);
    const duracionServicio = this.getDuration(horaInicio, horaFin);

    let totalEmpleadoHoras = 0;

    if (validarRangoHorarioPersonalOrdenDto.personal.length === 0) {
      return {
        message: "No se asigno personal, no es necesario validar horarios"
      }
    }

    for (const emp of validarRangoHorarioPersonalOrdenDto.personal) {

      const horaInicioEmpleado = this.parseHour(emp.horaInicio);
      const horaFinEmpleado = this.parseHour(emp.horaFin);
      const duracionEmp = this.getDuration(horaInicioEmpleado, horaFinEmpleado);

      if (duracionServicio < 24) {

        if (horaInicioEmpleado == horaFinEmpleado) {
          throw new BadRequestException(`Hora inicio y fin de un empleado no puede ser la misma`);
        }

        // Validar que horario sea durante las horas del dia: hora inicio mayor a hora fin
        if (horaInicio < horaFin) {

          // Validar que el horario del empleado este dentro del rango de la orden de servicio
          if (!(horaInicioEmpleado >= horaInicio && horaFinEmpleado <= horaFin)) {
            throw new BadRequestException(`El horario del empleado debe estar dentro del rango de la orden de servicio`);
          }

        }
        else {

          // Validar que el horario del empleado este dentro del rango de la orden de servicio (turno nocturno) o pasa por la medianoche
          const inicioEnRango = horaInicioEmpleado >= horaInicio || horaInicioEmpleado < horaFin;

          const finEnRango = horaFinEmpleado <= horaFin || horaFinEmpleado > horaInicio;

          // Validar que el turno del empleado esté dentro del rango
          if (!(inicioEnRango && finEnRango)) {

            throw new BadRequestException(
              `El horario del empleado debe estar dentro del rango de la orden de servicio`
            );

          }

        }

      }

      totalEmpleadoHoras += duracionEmp;
    }


    // Validar que los empleados cubran la orden completa
    if (!(totalEmpleadoHoras === duracionServicio)) {
      throw new BadRequestException(`La duracion del horario de los empleados debe cubrir toda el tiempo de la orden`);
    }

    return {
      message: "validacion correcta"
    }

  }

  // ------ Helpers de horas (soporta HH:mm:ss, turnos nocturnos y 24h)
  private timeToMinutes(t: string): number {
    const [hh, mm = "0", ss = "0"] = t.split(":");
    return (+hh) * 60 + (+mm) + Math.floor((+ss) / 60);
  }

  /** Divide un rango horario en 1 o 2 segmentos [ini, fin) en minutos.
   *  - Normal: [a,b)
   *  - Nocturno (cruza medianoche): [a,1440) y [0,b)
   *  - 24h (a==b): [0,1440)
   */
  private toSegments(hInicio: string, hFin: string): Array<[number, number]> {
    const a = this.timeToMinutes(hInicio);
    const b = this.timeToMinutes(hFin);
    if (a === b) return [[0, 1440]];                  // 24 horas
    if (a < b) return [[a, b]];                       // turno normal
    return [[a, 1440], [0, b]];                       // turno nocturno
  }

  private rangesOverlap([a1, a2]: [number, number], [b1, b2]: [number, number]): boolean {
    // solapan si NO (a2 <= b1 o b2 <= a1)
    return !(a2 <= b1 || b2 <= a1);
  }

  /** Devuelve true si los horarios (daily) se solapan, considerando nocturnos y 24h */
  private horasSeSolapan(h1Ini: string, h1Fin: string, h2Ini: string, h2Fin: string): boolean {
    const A = this.toSegments(h1Ini, h1Fin);
    const B = this.toSegments(h2Ini, h2Fin);
    for (const segA of A) for (const segB of B) {
      if (this.rangesOverlap(segA, segB)) return true;
    }
    return false;
  }

  // VALIDA SI UN CAMBIO DE FECHAS ES VALIDO SEGUN EL ESTADO ACTUAL DE LA ORDEN.
  // La usan tanto updateValidarFechasOrdenServicio (precheck informativo) como updateOrdenServicio (la que realmente persiste),
  // para que la restriccion quede garantizada por el backend y no dependa de que el front haya llamado primero al precheck
  private validarCambioFechasSegunEstado(
    estadoActual: string,
    cambioFechaInicio: boolean,
    cambioFechaFin: boolean,
    fechaFinAnteriorExiste: boolean,
    fechaFinNuevaExiste: boolean,
  ) {

    // NUNCA SE PUEDE QUITAR LA FECHA FIN DE UNA ORDEN QUE YA ERA DEFINIDA (volverla indefinida).
    // Si se necesita continuar el servicio de forma indefinida, se debe cancelar/terminar esta orden y crear una nueva orden indefinida
    if (fechaFinAnteriorExiste && !fechaFinNuevaExiste) {

      throw new BadRequestException('No se puede quitar la fecha de fin de una orden que ya era definida. Si el servicio va a continuar de forma indefinida, cree una nueva orden de servicio a partir del dia siguiente en que termina esta');

    }

    if (cambioFechaInicio) {

      if (estadoActual == EstadoOrdenServicio.INICIADO || estadoActual == EstadoOrdenServicio.POR_TERMINAR) {

        throw new BadRequestException('La fecha de inicio solo se puede modificar si la orden aun no ha iniciado');

      }

      if (estadoActual == EstadoOrdenServicio.CANCELADA || estadoActual == EstadoOrdenServicio.ANULADA) {

        throw new BadRequestException('La fecha de inicio solo se puede modificar si la orden no ha sido cancelada o anulada');

      }

      if (estadoActual == EstadoOrdenServicio.TERMINADO) {

        throw new BadRequestException('La fecha de inicio solo se puede modificar si la orden no ha terminado');

      }

    }

    if (cambioFechaFin) {

      if (
        estadoActual == EstadoOrdenServicio.CANCELADA ||
        estadoActual == EstadoOrdenServicio.ANULADA ||
        estadoActual == EstadoOrdenServicio.TERMINADO
      ) {

        throw new BadRequestException('La fecha de fin solo se puede modificar si la orden aun no ha sido cancelada, terminada o anulada');

      }

    }

  }

  async updateValidarFechasOrdenServicio(id: number, updateValidarFechaOrdenServicioDto: UpdateValidarFechaOrdenServicioDto) {

    const { fechaInicio, fechaFin, fechaActualizacion } = updateValidarFechaOrdenServicioDto;

    // validar orden logico de las fechas
    const fechaInicioOrden = this.normalizarFecha(fechaInicio);

    const fechaFinOrden = fechaFin ? this.normalizarFecha(fechaFin) : null;

    if (fechaFinOrden != null && fechaInicioOrden >= fechaFinOrden) {

      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');

    }

    // Obtener orden de servicio
    const ordenServicio = await this.findOne(id);

    const fechaInicioOrdenString = this.formatearFecha(new Date(ordenServicio.fechaInicio));
    const fechaFinOrdenString = ordenServicio.fechaFin ? this.formatearFecha(new Date(ordenServicio.fechaFin)) : null;

    const fechaInicioNuevaString = this.formatearFecha(fechaInicioOrden);
    const fechaFinNuevaString = fechaFinOrden ? this.formatearFecha(fechaFinOrden) : null;

    if (fechaInicioNuevaString == fechaInicioOrdenString && fechaFinNuevaString === fechaFinOrdenString) {
      return {
        message: 'Las fechas son iguales a las que ya tiene la orden de servicio, no se realizo ningun cambio'
      }
    }

    const descripcionEstadoOrdenServicio = ordenServicio.idEstadoOrdenServicio.nombre;

    // VALIDAR SI EL CAMBIO DE FECHAS ES VALIDO SEGUN EL ESTADO ACTUAL DE LA ORDEN
    this.validarCambioFechasSegunEstado(
      descripcionEstadoOrdenServicio,
      fechaInicioNuevaString != fechaInicioOrdenString,
      fechaFinNuevaString != fechaFinOrdenString,
      fechaFinOrdenString != null,
      fechaFinNuevaString != null,
    );

    // VALIDAR ESTADO DE LA ORDEN, TENER EN CUENTA SI LAS FECHAS SON IGUALES QUEDA COMO ESTA, SI CAMBIARON ENTONCES VALIDAR EN QUE ESTADO QUEDA
    const fechaActualizacionOrden = this.normalizarFecha(fechaActualizacion);

    // OBTENER ID ESTADO ORDEN SERVICIO
    //! VALIDAR SEGUN LAS FECHAS DE INICIO Y CREACION DE LA ORDEN DE SERVICIO

    if (fechaFinOrden != null && fechaFinOrden < fechaActualizacionOrden) {
      // Caso 1: Ya terminó (fecha fin es anterior a fecha actualizacion)

      return {
        message: `Estado Orden servicio luego de la actualizacion ${EstadoOrdenServicio.TERMINADO}`
      }

    }

    else if (fechaInicioOrden > fechaActualizacionOrden) {
      // Caso 2: Está programado para el futuro

      return {
        message: `Estado Orden servicio luego de la actualizacion ${EstadoOrdenServicio.PROGRAMADO}`
      }

    }

    else {
      // Caso 3: Ya inició o debe iniciar (fechaInicio <= fechaActualizacionOrden)
      // Esto incluye cuando fechaInicio == fechaActualizacionOrden

      return {
        message: `Estado Orden servicio luego de la actualizacion ${EstadoOrdenServicio.INICIADO}`
      }

    }

  }

  // ACTUALIZAR UNA ORDEN DE SERVICIO: LO UNICO QUE EL USUARIO PUEDE MODIFICAR EN UNA ORDEN YA CREADA SON LAS FECHAS
  // (fechaInicio/fechaFin), Y ES EL CAMBIO DE FECHAS LO QUE HACE QUE CAMBIE EL PRECIO. SI LAS FECHAS ENVIADAS SON
  // IGUALES A LAS QUE YA TIENE LA ORDEN, NO SE HACE NINGUN CAMBIO
  async updateOrdenServicio(id: number, updateOrdenServicioDto: UpdateOrdenServicioDto) {

    const { fechaInicio, fechaFin, fechaActualizacion } = updateOrdenServicioDto;

    const fechaInicioOrden = this.normalizarFecha(fechaInicio);

    const fechaFinOrden = fechaFin ? this.normalizarFecha(fechaFin) : null;

    if (fechaFinOrden != null && fechaInicioOrden >= fechaFinOrden) {

      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');

    }

    const fechaActualizacionOrden = this.normalizarFecha(fechaActualizacion);

    // OBTENER LA ORDEN CON SU DESGLOSE (detalles) ACTUAL
    const ordenServicio = await this.findOneOrdenRelations(id);

    const fechaInicioOrdenString = this.formatearFecha(new Date(ordenServicio.fechaInicio));
    const fechaFinOrdenString = ordenServicio.fechaFin ? this.formatearFecha(new Date(ordenServicio.fechaFin)) : null;

    const fechaInicioNuevaString = this.formatearFecha(fechaInicioOrden);
    const fechaFinNuevaString = fechaFinOrden ? this.formatearFecha(fechaFinOrden) : null;

    // SI LAS FECHAS NO CAMBIAN, NO SE HACE NADA
    if (fechaInicioNuevaString == fechaInicioOrdenString && fechaFinNuevaString === fechaFinOrdenString) {
      return ordenServicio;
    }

    const descripcionEstadoOrdenServicio = ordenServicio.idEstadoOrdenServicio.nombre;

    // VALIDAR QUE EL CAMBIO DE FECHAS SEA VALIDO SEGUN EL ESTADO ACTUAL DE LA ORDEN
    // (misma validacion de updateValidarFechasOrdenServicio, para que quede garantizada aunque no se haya llamado ese endpoint antes)
    this.validarCambioFechasSegunEstado(
      descripcionEstadoOrdenServicio,
      fechaInicioNuevaString != fechaInicioOrdenString,
      fechaFinNuevaString != fechaFinOrdenString,
      fechaFinOrdenString != null,
      fechaFinNuevaString != null,
    );

    // OBTENER ID ESTADO ORDEN SERVICIO
    //! VALIDAR SEGUN LAS FECHAS DE INICIO Y CREACION DE LA ORDEN DE SERVICIO
    let estadoOrdenServicio: EstadoOrdenEntity;

    if (fechaFinOrden != null && fechaFinOrden < fechaActualizacionOrden) {
      // Caso 1: Ya terminó (fecha fin es anterior a fecha actualizacion)
      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.TERMINADO);

    }

    else if (fechaInicioOrden > fechaActualizacionOrden) {
      // Caso 2: Está programado para el futuro
      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.PROGRAMADO);

    }

    else {
      // Caso 3: Ya inició o debe iniciar (fechaInicio <= fechaActualizacion)
      // Esto incluye cuando fechaInicio == fechaActualizacion
      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.INICIADO);

    }

    const cambioEstadoOrden = ordenServicio.idEstadoOrdenServicio.idEstadoOrdenServicio != estadoOrdenServicio.idEstadoOrdenServicio;

    // Usar QueryRunner para transacción manual
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // actualizar campos de la orden
      ordenServicio.fechaInicio = fechaInicioOrden;
      ordenServicio.fechaFin = fechaFinOrden;
      ordenServicio.fechaActualizacion = fechaActualizacionOrden;
      ordenServicio.idEstadoOrdenServicio = estadoOrdenServicio;

      let precioTotalCalculado = 0;

      if (fechaFinOrden == null) {

        // LA ORDEN QUEDA INDEFINIDA: TODOS LOS VALORES DE PRECIO DE CADA FILA DEL DESGLOSE QUEDAN EN NULL
        // (se cobra mes a mes al liquidar/finalizar)
        for (const detalleExistente of ordenServicio.detalles) {

          detalleExistente.cantidadHoras = null;
          detalleExistente.costosDirectos = null;
          detalleExistente.seguroVida = null;
          detalleExistente.costosDirectosSeguroVida = null;
          detalleExistente.aui = null;
          detalleExistente.precioAntesIva = null;
          detalleExistente.iva = null;
          detalleExistente.precio = null;

          await queryRunner.manager.save(OrdenServicioDetalle, detalleExistente);

        }

      }

      else if (ordenServicio.origenServicio === OrigenServicioEnum.CATALOGO) {

        const itemsDto = updateOrdenServicioDto.servicios;

        if (!itemsDto || itemsDto.length === 0) {
          throw new BadRequestException('Debe enviar el horario (horaInicio, horaFin) de cada servicio de la orden para poder recalcular el precio');
        }

        // EL CATALOGO DE SERVICIOS DE LA ORDEN NO CAMBIA, SOLO SE REENVIA SU HORARIO: VALIDAR QUE SEAN EXACTAMENTE LOS MISMOS idTarifa YA EXISTENTES
        const idsTarifaExistentes = new Set(ordenServicio.detalles.map(detalle => detalle.idTarifa.idTarifa));
        const idsTarifaEnviados = new Set(itemsDto.map(item => item.idTarifa));

        if (idsTarifaExistentes.size !== idsTarifaEnviados.size || [...idsTarifaExistentes].some(idTarifa => !idsTarifaEnviados.has(idTarifa))) {
          throw new BadRequestException('Debe enviar el horario de exactamente los mismos servicios (idTarifa) que ya tiene la orden, no se pueden agregar ni quitar servicios al actualizar');
        }

        // VALIDAR EL HORARIO DE CADA SERVICIO (misma validacion que al crear la orden)
        for (const itemDto of itemsDto) {
          await this.validacionHorarios({
            origenServicio: OrigenServicioEnum.CATALOGO,
            idTarifa: itemDto.idTarifa,
            horaInicio: itemDto.horaInicio,
            horaFin: itemDto.horaFin,
          });
        }

        const detallesCalculados = await this.calcularPrecioCatalogo(itemsDto, fechaInicioOrden, fechaFinOrden);

        // ACTUALIZAR CADA FILA EXISTENTE, SIN BORRAR/RECREAR (para no perder su identidad/referencias)
        for (const detalleCalculado of detallesCalculados) {

          const detalleExistente = ordenServicio.detalles.find(detalle => detalle.idTarifa.idTarifa === detalleCalculado.idTarifa);

          detalleExistente.horaInicio = detalleCalculado.horaInicio;
          detalleExistente.horaFin = detalleCalculado.horaFin;
          detalleExistente.costosDirectos = detalleCalculado.costosDirectos;
          detalleExistente.seguroVida = detalleCalculado.seguroVida;
          detalleExistente.costosDirectosSeguroVida = detalleCalculado.costosDirectosSeguroVida;
          detalleExistente.aui = detalleCalculado.aui;
          detalleExistente.precioAntesIva = detalleCalculado.precioAntesIva;
          detalleExistente.iva = detalleCalculado.iva;
          detalleExistente.precio = detalleCalculado.precio;

          await queryRunner.manager.save(OrdenServicioDetalle, detalleExistente);

          precioTotalCalculado += detalleCalculado.precio;

        }

      }

      else {

        // A LA MEDIDA: EL DESGLOSE SE RECALCULA DESDE CERO (dia por dia), YA QUE LA CANTIDAD DE FILAS CAMBIA CON LAS FECHAS
        if (!updateOrdenServicioDto.horaInicio || !updateOrdenServicioDto.horaFin) {
          throw new BadRequestException('Debe enviar horaInicio y horaFin para poder recalcular el precio de esta orden a la medida');
        }

        await queryRunner.manager.delete(OrdenServicioDetalle, { idOrdenServicio: ordenServicio.idOrdenServicio });

        const detallesCalculados = await this.calcularPrecioAMedida(
          updateOrdenServicioDto.horaInicio,
          fechaInicioOrden,
          updateOrdenServicioDto.horaFin,
          fechaFinOrden,
        );

        for (const detalleCalculado of detallesCalculados) {

          const tarifa = await this.tarifasService.findOne(detalleCalculado.idTarifa);

          const nuevoDetalle = queryRunner.manager.create(OrdenServicioDetalle, {
            idOrdenServicio: ordenServicio,
            idTarifa: tarifa,
            horaInicio: detalleCalculado.horaInicio,
            horaFin: detalleCalculado.horaFin,
            cantidadHoras: detalleCalculado.cantidadHoras,
            fecha: detalleCalculado.fecha,
            costosDirectos: detalleCalculado.costosDirectos,
            seguroVida: detalleCalculado.seguroVida,
            costosDirectosSeguroVida: detalleCalculado.costosDirectosSeguroVida,
            aui: detalleCalculado.aui,
            precioAntesIva: detalleCalculado.precioAntesIva,
            iva: detalleCalculado.iva,
            precio: detalleCalculado.precio,
          });

          await queryRunner.manager.save(OrdenServicioDetalle, nuevoDetalle);

          precioTotalCalculado += detalleCalculado.precio;

        }

      }

      // EL PRECIO TOTAL DE LA ORDEN SE RECALCULA COMO LA SUMA DE LOS PRECIOS DE CADA FILA DEL DESGLOSE
      ordenServicio.precioTotal = fechaFinOrden != null ? Math.round(precioTotalCalculado) : null;

      const savedOrdenServicio = await queryRunner.manager.save(OrdenServicio, ordenServicio);

      await queryRunner.commitTransaction();

      if (cambioEstadoOrden) {

        // envio de correos que se tengan registrados en la locacion
        const nombreResponsable = `${ordenServicio.idLocacion.primerNombreResponsable} ${ordenServicio.idLocacion.primerApellidoResponsable}`;

        const emailsLocacion = await this.locacionService.getEmailsByLocacionAndEstado(
          ordenServicio.idLocacion.idLocacion,
          estadoOrdenServicio.idEstadoOrdenServicio
        )

        const emailsApp = await this.correoDefaultService.findAllByEstadoOrden(estadoOrdenServicio.nombre);

        const emails = [...emailsLocacion, ...emailsApp];

        await this.notificationUpdateEmail(
          savedOrdenServicio.idOrdenServicio,
          nombreResponsable,
          ordenServicio.idLocacion.nombre,
          emails
        );

      }

      return savedOrdenServicio;

    } catch (error) {

      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      throw error;

    } finally {

      await queryRunner.release();

    }

  }

  // ENVIAR CORREO PARA INFORMAR ACTUALIZACION DE ORDEN DE SERVICIO
  private async notificationUpdateEmail(
    idOrdenServicio: number,
    nombreResponsable: string,
    locacion: string,
    emails: string[]
  ) {

    const ordenServicio = await this.findOneOrdenRelations(idOrdenServicio);

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">MODIFICACION ORDEN DE SERVICIO ${ordenServicio.ordenServicioId.descripcionId}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se ha modificado una orden de servicio para el puesto <b>${locacion}</b> el cual tiene como responsable a <b>${nombreResponsable}</b>. <br><br>
              Por favor, revise el <b>PDF adjunto</b> para más detalles de la orden de servicio.
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

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): modificacion orden de servicio ${ordenServicio.ordenServicioId.descripcionId}`;

    const ordenServicioBuffer = await this.reporteOrdenServicioService.getBufferReporteOrdenServicio(ordenServicio);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `Orden-servicio-${ordenServicio.ordenServicioId.descripcionId}.pdf`,
          content: ordenServicioBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend) {
      throw new InternalServerErrorException(`Error al enviar correo de notificacion a los emails ${emails.join(', ')}, revisar correos si estan bien escritos`);
    }

  }

  // ELIMINAR ORDEN DE LA BD
  async removeOrdenServicio(id: number) {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 🔥 Traer orden con su OrdenServicioId
      const ordenServicio = await this.ordenServicioRepository.findOne({
        where: { idOrdenServicio: id },
        relations: ['ordenServicioId'],
      });

      if (!ordenServicio) {
        throw new NotFoundException(`Orden de servicio ${id} no encontrada`);
      }

      const ordenServicioData = await this.findOneOrdenRelations(id);

      const ordenServicioIdAnulada = await this.ordenServicioIdAnuladoRepository.findOne({
        where: {
          consecutivo: ordenServicio.ordenServicioId.consecutivo
        }
      });

      // 🔥 Primero eliminamos la OrdenServicio
      await queryRunner.manager.remove(ordenServicio);

      // 🔥 Luego eliminamos el ID asociado
      // if (ordenServicio.ordenServicioId) {
      //   await queryRunner.manager.remove(ordenServicio.ordenServicioId);
      // }

      if (ordenServicioIdAnulada) {
        await queryRunner.manager.remove(ordenServicioIdAnulada);
      }

      // envio de correos que se tengan registrados en la locacion
      const nombreResponsable = `${ordenServicio.idLocacion?.primerNombreResponsable || ''} ${ordenServicio.idLocacion?.primerApellidoResponsable || ''}`.trim();

      const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.ELIMINACION_ORDEN_SERVICIO);

      if (emails && emails.length > 0) {
        await this.notificationDeleteEmail(
          ordenServicioData,
          nombreResponsable,
          ordenServicio.idLocacion?.nombre || '',
          emails
        );
      }

      await queryRunner.commitTransaction();

      return { message: `Orden de servicio ${id} eliminada correctamente` };

    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error(error);

      if (error.errno == 1451) {
        throw new BadRequestException(
          `La orden de servicio no se puede eliminar porque está siendo usada en el sistema`,
        );
      }

      throw new InternalServerErrorException(`Error eliminando la orden`);
    } finally {
      await queryRunner.release();
    }
  }

  // ENVIAR CORREO PARA INFORMAR ELIMINACION DE ORDEN DE SERVICIO
  private async notificationDeleteEmail(
    ordenServicioData: OrdenServicio,
    nombreResponsable: string,
    locacion: string,
    emails: string[]
  ) {

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">ELIMINACION ORDEN DE SERVICIO ${ordenServicioData.ordenServicioId.descripcionId}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se ha eliminado una orden de servicio para el puesto <b>${locacion}</b> el cual tiene como responsable a <b>${nombreResponsable}</b>. <br><br>
              Por favor, revise el <b>PDF adjunto</b> para más detalles de la orden de servicio eliminada.
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

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): eliminacion orden de servicio ${ordenServicioData.ordenServicioId.descripcionId}`;

    const ordenServicioBuffer = await this.reporteOrdenServicioService.getBufferReporteOrdenServicio(ordenServicioData);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `Orden-servicio-${ordenServicioData.ordenServicioId.descripcionId}.pdf`,
          content: ordenServicioBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend) {
      throw new InternalServerErrorException(`Error al enviar correo de notificacion a los emails ${emails.join(', ')}, revisar correos si estan bien escritos`);
    }

  }

  async cancelarOrdenServicio(id: number) {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const ordenServicio = await this.findOneOrdenRelations(id);

      const estadoCancelada = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.CANCELADA);

      // SOLO SE PUEDE CANCELAR UNA ORDEN QUE YA ESTE EN CURSO (INICIADA O POR TERMINAR)
      // Cancelar antes (programada/por iniciar) no tiene sentido, y despues (terminada) ya no aplica
      const estadosPermitidosParaCancelar = [EstadoOrdenServicio.INICIADO, EstadoOrdenServicio.POR_TERMINAR];

      if (!estadosPermitidosParaCancelar.includes(ordenServicio.idEstadoOrdenServicio.nombre as EstadoOrdenServicio)) {

        throw new BadRequestException(`Solo se puede cancelar una orden de servicio que este en estado "iniciado" o "por terminar", la orden ${id} se encuentra en estado "${ordenServicio.idEstadoOrdenServicio.nombre}"`);

      }

      ordenServicio.idEstadoOrdenServicio = estadoCancelada;
      ordenServicio.fechaActualizacion = new Date();
      ordenServicio.fechaFin = new Date();

      await queryRunner.manager.save(OrdenServicio, ordenServicio);

      // envio de correos que se tengan registrados en la locacion
      const nombreResponsable = `${ordenServicio.idLocacion?.primerNombreResponsable || ''} ${ordenServicio.idLocacion?.primerApellidoResponsable || ''}`.trim();

      const emailsLocacion = await this.locacionService.getEmailsByLocacionAndEstado(
        ordenServicio.idLocacion.idLocacion,
        estadoCancelada.idEstadoOrdenServicio
      )

      const emailsApp = await this.correoDefaultService.findAllByEstadoOrden(estadoCancelada.nombre);

      const emails = [...emailsLocacion, ...emailsApp];

      if (emails && emails.length > 0) {
        await this.notificationCanceladaEmail(
          ordenServicio,
          nombreResponsable,
          ordenServicio.idLocacion?.nombre || '',
          emails
        );
      }

      await queryRunner.commitTransaction();

      return { message: `Orden de servicio ${id} cancelada correctamente` };

    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(error);

      throw new InternalServerErrorException(`Error cancelando la orden`);
    } finally {
      await queryRunner.release();
    }

  }

  // ENVIAR CORREO PARA INFORMAR CANCELACION DE ORDEN DE SERVICIO
  private async notificationCanceladaEmail(
    ordenServicioData: OrdenServicio,
    nombreResponsable: string,
    locacion: string,
    emails: string[]
  ) {

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CANCELACION ORDEN DE SERVICIO ${ordenServicioData.ordenServicioId.descripcionId}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se ha cancelado una orden de servicio para el puesto <b>${locacion}</b> el cual tiene como responsable a <b>${nombreResponsable}</b>. <br><br>
              Por favor, revise el <b>PDF adjunto</b> para más detalles de la orden de servicio cancelada.
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

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): cancelacion orden de servicio ${ordenServicioData.ordenServicioId.descripcionId}`;

    const ordenServicioBuffer = await this.reporteOrdenServicioService.getBufferReporteOrdenServicio(ordenServicioData);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `Orden-servicio-${ordenServicioData.ordenServicioId.descripcionId}.pdf`,
          content: ordenServicioBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend) {
      throw new InternalServerErrorException(`Error al enviar correo de notificacion a los emails ${emails.join(', ')}, revisar correos si estan bien escritos`);
    }

  }

  async anularOrdenServicio(id: number) {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const ordenServicio = await this.findOneOrdenRelations(id);

      const estadoAnulada = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.ANULADA);

      if (ordenServicio.idEstadoOrdenServicio.idEstadoOrdenServicio === estadoAnulada.idEstadoOrdenServicio) {

        throw new BadRequestException(`La orden de servicio ${id} ya se encuentra anulada`);

      }

      // =========================================================
      // CAMBIAR ESTADO ORDEN
      // =========================================================
      ordenServicio.idEstadoOrdenServicio = estadoAnulada;

      await queryRunner.manager.save(OrdenServicio, ordenServicio);

      // =========================================================
      // MARCAR ID COMO ANULADO
      // =========================================================
      ordenServicio.ordenServicioId.anulado = true;

      await queryRunner.manager.save(
        OrdenServicioId,
        ordenServicio.ordenServicioId
      );

      // =========================================================
      // CREAR REGISTRO EN TABLA DE ANULADOS
      // =========================================================
      const ordenServicioIdAnulado =
        this.ordenServicioIdAnuladoRepository.create({
          descripcionId: ordenServicio.ordenServicioId.descripcionId,
          consecutivo: ordenServicio.ordenServicioId.consecutivo,
          motivo: 'Orden anulada manualmente',
        });

      await queryRunner.manager.save(
        OrdenServicioIdAnulado,
        ordenServicioIdAnulado
      );

      // =========================================================
      // EMAILS
      // =========================================================

      // envio de correos que se tengan registrados en la locacion
      const nombreResponsable = `${ordenServicio.idLocacion?.primerNombreResponsable || ''} ${ordenServicio.idLocacion?.primerApellidoResponsable || ''}`.trim();

      const emailsApp = await this.correoDefaultService.findAllByEstadoOrden(estadoAnulada.nombre);

      const emails = [...emailsApp];

      if (emails && emails.length > 0) {
        await this.notificationAnuladaEmail(
          ordenServicio,
          nombreResponsable,
          ordenServicio.idLocacion?.nombre || '',
          emails
        );
      }

      await queryRunner.commitTransaction();

      return { message: `Orden de servicio ${id} anulada correctamente` };

    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(error);

      throw new InternalServerErrorException(`Error anulando la orden`);
    } finally {
      await queryRunner.release();
    }

  }

  // ENVIAR CORREO PARA INFORMAR ANULACION DE ORDEN DE SERVICIO
  private async notificationAnuladaEmail(
    ordenServicioData: OrdenServicio,
    nombreResponsable: string,
    locacion: string,
    emails: string[]
  ) {

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">ANULACION ORDEN DE SERVICIO ${ordenServicioData.ordenServicioId.descripcionId}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se ha anulado una orden de servicio para el puesto <b>${locacion}</b> el cual tiene como responsable a <b>${nombreResponsable}</b>. <br><br>
              Por favor, revise el <b>PDF adjunto</b> para más detalles de la orden de servicio anulada.
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

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): anulacion orden de servicio ${ordenServicioData.ordenServicioId.descripcionId}`;

    const ordenServicioBuffer = await this.reporteOrdenServicioService.getBufferReporteOrdenServicio(ordenServicioData);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `Orden-servicio-${ordenServicioData.ordenServicioId.descripcionId}.pdf`,
          content: ordenServicioBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend) {
      throw new InternalServerErrorException(`Error al enviar correo de notificacion a los emails ${emails.join(', ')}, revisar correos si estan bien escritos`);
    }

  }

  async downloadOrdenServicioPdf(id: number) {

    const ordenServicio = await this.findOneOrdenRelations(id);

    return {
      pdfDoc: this.reporteOrdenServicioService.getReporteOrdenServicio(ordenServicio),
      title: `Orden-servicio-${ordenServicio.idOrdenServicio}`
    };

  }

  async sendOrdenServicioPdf(id: number, enviarCorreoDto: EnviarCorreoDto) {

    const ordenServicio = await this.findOneOrdenRelations(id);

    const ordenServicioBuffer = await this.reporteOrdenServicioService.getBufferReporteOrdenServicio(ordenServicio);

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): PDF orden de servicio ${ordenServicio.ordenServicioId.descripcionId}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">ORDEN DE SERVICIO ${ordenServicio.ordenServicioId.descripcionId}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia PDF adjunto de orden de servicio <b>${ordenServicio.ordenServicioId.descripcionId}</b>. <br><br>
              Por favor, revise el <b>PDF adjunto</b> para más detalles de la orden de servicio.
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
          filename: `Orden-servicio-${ordenServicio.ordenServicioId.descripcionId}.pdf`,
          content: ordenServicioBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend) {
      throw new InternalServerErrorException(`Error al enviar correo con PDF orden de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }

  }

  async reportesInicio(months: number) {

    const now = new Date();
    let from: Date;
    let to: Date = endOfMonth(now);

    if (months === 0) {
      // Mes actual
      from = startOfMonth(now);
    } else {
      from = subMonths(now, months);
    }

    // === 1. TRAER LAS ÓRDENES DEL RANGO ===
    const ordenes = await this.ordenServicioRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.idEstadoOrdenServicio', 'estado')
      .leftJoinAndSelect('o.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .leftJoinAndSelect('o.detalles', 'detalles')
      .leftJoinAndSelect('detalles.idTarifa', 'tarifa')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .where('o.fechaInicio BETWEEN :from AND :to', { from, to })
      .getMany();

    // === 2. CÁLCULOS DE REPORTES ===

    // Total de órdenes
    const totalOrdenes = ordenes.length;

    // Total en estado TERMINADO
    const ordenesTerminadas = ordenes.filter(
      o => o.idEstadoOrdenServicio?.nombre === EstadoOrdenServicio.TERMINADO
    ).length;

    // Distribución por estado
    const distribucionEstados = ordenes.reduce((acc, o) => {
      const estado = o.idEstadoOrdenServicio?.nombre;
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    // Ordenes por mes + distribución por estado
    const mesesMap = {};
    const mesesLabels = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    for (const o of ordenes) {
      const fecha = new Date(o.fechaInicio);
      const mes = mesesLabels[fecha.getMonth()];

      if (!mesesMap[mes]) mesesMap[mes] = {};

      const estado = o.idEstadoOrdenServicio?.nombre;
      mesesMap[mes][estado] = (mesesMap[mes][estado] || 0) + 1;
    }

    // TOP 10 SERVICIOS MÁS UTILIZADOS
    const serviciosCount: Record<string, number> = {};

    for (const o of ordenes) {
      for (const t of o.detalles) {
        const servicio = t.idTarifa.idServicio;
        if (!servicio) continue;

        const key = `${servicio.codigo} - ${servicio.descripcion}`;
        serviciosCount[key] = (serviciosCount[key] || 0) + 1;
      }
    }

    const topServicios = Object.entries(serviciosCount)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // TOP 10 CLIENTES
    const clientesCount: Record<string, number> = {};

    for (const o of ordenes) {
      const cliente = o.idLocacion?.idCliente;
      if (!cliente) continue;

      clientesCount[cliente.nombre] = (clientesCount[cliente.nombre] || 0) + 1;
    }

    const topClientes = Object.entries(clientesCount)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // === 3. RETORNO ===
    return {
      rango: { from, to },

      totales: {
        totalOrdenes,
        ordenesTerminadas,
      },

      distribucionEstados,

      ordenesPorMes: mesesMap,

      topServicios,
      topClientes,
    };

  }

  async imprimirOrdenServicio(id: number) {

    const ordenServicio = await this.findOneOrdenRelations(id);

    const buffer = await this.reporteOrdenServicioService
      .getBufferReporteOrdenServicio(ordenServicio);

    return {
      file: buffer.toString('base64'),
      mimeType: 'application/pdf',
      fileName: `orden-${id}.pdf`
    };

  }

  async actualizarEstadosAutomaticamente() {

    const now = new Date();

    // =========================================================
    // NORMALIZAR FECHA ACTUAL
    // =========================================================

    const hoy = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // =========================================================
    // ESTADOS
    // =========================================================

    const estadoProgramado =
      await this.estadoOrdenService.findOneByName(
        EstadoOrdenServicio.PROGRAMADO
      );

    const estadoPorIniciar =
      await this.estadoOrdenService.findOneByName(
        EstadoOrdenServicio.POR_INICIAR
      );

    const estadoIniciado =
      await this.estadoOrdenService.findOneByName(
        EstadoOrdenServicio.INICIADO
      );

    const estadoPorTerminar =
      await this.estadoOrdenService.findOneByName(
        EstadoOrdenServicio.POR_TERMINAR
      );

    const estadoTerminado =
      await this.estadoOrdenService.findOneByName(
        EstadoOrdenServicio.TERMINADO
      );

    // =========================================================
    // TRAER ORDENES ACTIVAS
    // =========================================================

    const ordenes = await this.ordenServicioRepository.find({
      where: {
        idEstadoOrdenServicio: {
          nombre: Not(
            In([
              EstadoOrdenServicio.CANCELADA,
              EstadoOrdenServicio.ANULADA,
              EstadoOrdenServicio.TERMINADO,
            ])
          ),
        },
      },
      relations: {
        idEstadoOrdenServicio: true,
        idLocacion: true,
        ordenServicioId: true,
      },
    });

    // =========================================================
    // RECORRER ORDENES
    // =========================================================

    for (const orden of ordenes) {

      let nuevoEstado = null;

      try {

        const estadoActual = orden.idEstadoOrdenServicio.nombre;

        // ============================================
        // FECHAS NORMALIZADAS
        // ============================================

        const fechaInicio = new Date(orden.fechaInicio);
        const fechaInicioNormalizada = new Date(
          fechaInicio.getFullYear(),
          fechaInicio.getMonth(),
          fechaInicio.getDate()
        );

        let fechaFinNormalizada = null;

        if (orden.fechaFin) {

          const fechaFin = new Date(orden.fechaFin);

          fechaFinNormalizada = new Date(
            fechaFin.getFullYear(),
            fechaFin.getMonth(),
            fechaFin.getDate()
          );

        }

        // ============================================
        // DIAS RESTANTES
        // ============================================

        const diffInicio =
          Math.ceil(
            (fechaInicioNormalizada.getTime() - hoy.getTime())
            / (1000 * 60 * 60 * 24)
          );

        let diffFin = null;

        if (fechaFinNormalizada) {

          diffFin =
            Math.ceil(
              (fechaFinNormalizada.getTime() - hoy.getTime())
              / (1000 * 60 * 60 * 24)
            );

        }

        // =====================================================
        // PROGRAMADO -> POR INICIAR
        // =====================================================

        if (
          estadoActual === EstadoOrdenServicio.PROGRAMADO &&
          diffInicio <= 2 &&
          diffInicio > 0
        ) {

          nuevoEstado = estadoPorIniciar;

        }

        // =====================================================
        // POR INICIAR -> INICIADO
        // =====================================================

        if (
          estadoActual === EstadoOrdenServicio.POR_INICIAR &&
          diffInicio === 0
        ) {

          nuevoEstado = estadoIniciado;

        }

        // =====================================================
        // INICIADO -> POR TERMINAR
        // =====================================================

        if (
          estadoActual === EstadoOrdenServicio.INICIADO &&
          fechaFinNormalizada &&
          diffFin <= 2 &&
          diffFin > 0
        ) {

          nuevoEstado = estadoPorTerminar;

        }

        // =====================================================
        // POR TERMINAR -> TERMINADO
        // =====================================================

        if (
          estadoActual === EstadoOrdenServicio.POR_TERMINAR &&
          fechaFinNormalizada &&
          diffFin === 0
        ) {

          nuevoEstado = estadoTerminado;

        }

        // =====================================================
        // ACTUALIZAR
        // =====================================================

        if (nuevoEstado) {

          orden.idEstadoOrdenServicio = nuevoEstado;

          await this.ordenServicioRepository.save(orden);

          // =====================================================
          // EMAILS
          // =====================================================

          const emailsApp =
            await this.correoDefaultService.findAllByEstadoOrden(
              nuevoEstado.nombre
            );

          const emailsLocacion = await this.locacionService.getEmailsByLocacionAndEstado(
            orden.idLocacion.idLocacion,
            nuevoEstado.idEstadoOrdenServicio
          )

          const emails = [...emailsApp, ...emailsLocacion];

          if (emails.length > 0) {

            const nombreResponsable =
              `${orden.idLocacion?.primerNombreResponsable || ''} ${orden.idLocacion?.primerApellidoResponsable || ''}`
                .trim();

            try {

              await this.notificationCambioEstadoEmail(
                orden,
                nombreResponsable,
                orden.idLocacion?.nombre || '',
                emails,
                nuevoEstado.nombre
              );

            } catch (error) {

              this.logger.error(`Error enviando correo de notificacion por cambio de estado de orden ${orden.idOrdenServicio} a ${nuevoEstado.nombre}:`, error);

            }

          }

        }

      } catch (error) {

        this.logger.error(`Error actualizando estado de orden ${orden.idOrdenServicio} a ${nuevoEstado.nombre}:`, error);

      }

    }

  }

  // ENVIAR CORREO PARA INFORMAR ANULACION DE ORDEN DE SERVICIO
  private async notificationCambioEstadoEmail(
    ordenServicioData: OrdenServicio,
    nombreResponsable: string,
    locacion: string,
    emails: string[],
    nuevoEstado: string
  ) {

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">ORDEN DE SERVICIO ${ordenServicioData.ordenServicioId.descripcionId} CAMBIO DE ESTADO</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se ha cambiado de estado una orden de servicio para el puesto <b>${locacion}</b> el cual tiene como responsable a <b>${nombreResponsable}</b>. <br><br>
              Por favor, revise el <b>PDF adjunto</b> para más detalles de la orden de servicio.
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

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): orden de servicio ${ordenServicioData.ordenServicioId.descripcionId} CAMBIO DE ESTADO`;

    const ordenServicioBuffer = await this.reporteOrdenServicioService.getBufferReporteOrdenServicio(ordenServicioData);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `Orden-servicio-${ordenServicioData.ordenServicioId.descripcionId}.pdf`,
          content: ordenServicioBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend) {
      throw new InternalServerErrorException(`Error al enviar correo de notificacion a los emails ${emails.join(', ')}, revisar correos si estan bien escritos`);
    }

  }

  private handleDbExceptions(error: any) {

    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

  // ELIMINAR TODOS LAS ORDEN DE SERVICIO
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA ORDEN-SERVICO
  async deleteAllOrdenesServicio() {

    const query = this.ordenServicioRepository.createQueryBuilder('orden-servicio');

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
