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
import { ServiciosService, TipoHorarioService } from '../../servicios/services';
import { PersonalService } from '../../personal/services';
import { ReporteOrdenServicioService } from '../../reportes/services';
import { PeriodosService } from '../../periodos/periodos.service';

import { EstadoOrdenServicio } from '../../common/interfaces/estado-orden-servicio.interface';
import { TipoDuracionInterface } from '../../servicios/interfaces/tipo-duracion.interface';
import { TipoHorarioInterface } from 'src/servicios/interfaces/tipo-horario.interface';
import { TipoTarifaInterface } from '../../tarifas/interfaces/tipo-tarifa.interface';

import { Personal } from '../../personal/entities';
import { Servicio } from '../../servicios/entities';
import { Tarifa, TarifaHora } from '../../tarifas/entities';

import {
  OrdenServicio,
  OrdenServicioId,
  OrdenServicioIdAnulado,
  OrdenServicioTarifa,
  CostoHoraOrdenServicioTarifa,
  ProgramacionPersonal
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
    @InjectRepository(OrdenServicioTarifa)
    private readonly ordenServicioTarifaRepository: Repository<OrdenServicioTarifa>,
    @InjectRepository(ProgramacionPersonal)
    private readonly programacionPersonalRepository: Repository<ProgramacionPersonal>,
    @InjectRepository(Personal)
    private readonly personalRepository: Repository<Personal>,
    private readonly personalService: PersonalService,
    private readonly estadoOrdenService: EstadoOrdenServicioService,
    private readonly locacionService: LocacionService,
    private readonly tarifasService: TarifasService,
    private readonly tarifaHoraService: TarifaHoraService,
    private readonly tarifaHoraDescripcionService: TarifaHoraDescripcionService,
    private readonly tipoHorarioService: TipoHorarioService,
    private readonly servicioService: ServiciosService,
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

      if (fechaInicioOrden >= fechaFinOrden) {

        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');

      }

      if (createOrdenServicioDto.precioTotal == null || createOrdenServicioDto.precioTotal == 0) {

        throw new BadRequestException('se debe enviar el precio total al ser una orden definida');

      }

    }

    // FECHA CREACION ORDEN SERVICIO

    const fechaCreacionSplit = createOrdenServicioDto.fechaCreacion.toISOString().split('T')[0];

    const [añoCreacion, mesCreacion, diaCreacion] = fechaCreacionSplit.split('-').map(Number);

    const fechaCreacionOrden = new Date(añoCreacion, mesCreacion - 1, diaCreacion);

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
        fechaInicio: fechaInicioOrden,
        fechaInicioOrden: fechaInicioOrden,
        fechaFin: createOrdenServicioDto.fechaFin ? fechaFinOrden : null,
        fechaFinOrden: createOrdenServicioDto.fechaFin ? fechaFinOrden : null,
        precioTotal: createOrdenServicioDto.precioTotal,
        fechaCreacion: fechaCreacionOrden,
        fechaActualizacion: fechaCreacionOrden
      });

      const savedOrdenServicio = await queryRunner.manager.save(OrdenServicio, ordenServicio);

      const servicios = createOrdenServicioDto.servicios;

      const nombreServicios = []

      let precioTotalCalculado = 0;

      for (const servicio of servicios) {

        // OBTENER TARIFA (si aplica) Y SERVICIO
        // Los servicios de horario mixto por hora no tienen tarifa guardada, en ese caso solo se envia idServicio
        let tarifa: Tarifa | null = null;

        if (servicio.idTarifa) {
          tarifa = await this.tarifasService.findOne(servicio.idTarifa);
        }

        const servicioEntidad = tarifa ? tarifa.idServicio : await this.servicioService.findOne(servicio.idServicio);

        nombreServicios.push(servicioEntidad.descripcion);

        let calculoPrecio: Awaited<ReturnType<OrdenServicioService['calcularPrecioServicioOrden']>> | null = null;

        // Validar si se debe enviar el precio del servicio, y calcular el desglose real (costos directos, seguro vida, aui, iva, etc)
        // usando la misma logica de obtenerPrecio, en lugar de confiar unicamente en el precio que envia el front
        if (createOrdenServicioDto.fechaFin != null) {

          if (servicio.precio == null || servicio.precio == 0) {

            throw new BadRequestException(`se debe enviar el precio del servicio ${servicioEntidad.descripcion} al ser una orden definida`);

          }

          calculoPrecio = await this.calcularPrecioServicioOrden(
            {
              idTarifa: servicio.idTarifa,
              idServicio: servicioEntidad.idServicio,
              horaInicio: servicio.horaInicio,
              horaFin: servicio.horaFin,
            },
            fechaInicioOrden,
            fechaFinOrden,
          );

          precioTotalCalculado += calculoPrecio.precio;

        }

        // TODO!: FEATURE PERSONAL
        // Validar si el servicio requiere personal
        // if (tarifa.idServicio.idTipoServicio.requierePersonal && servicio.personal.length <= 0){

        //   throw new BadRequestException(`El servicio ${tarifa.idServicio.descripcion} requiere personal, por favor asignar`);

        // }

        // Crear el servicio para la orden
        // Si la orden es indefinida (sin fecha fin) todos los valores de precio quedan en null, ya que se cobra mes a mes al liquidar/finalizar
        const servicioOrden = queryRunner.manager.create(OrdenServicioTarifa, {
          idOrdenServicio: savedOrdenServicio,
          idTarifa: tarifa,
          idServicio: servicioEntidad,
          cantidadPersonal: servicio.cantidadPersonal ? servicio.cantidadPersonal : 0,
          horaInicio: servicio.horaInicio,
          horaFin: servicio.horaFin,
          costosDirectos: calculoPrecio ? calculoPrecio.costosDirectos : null,
          seguroVida: calculoPrecio ? calculoPrecio.seguroVida : null,
          aui: calculoPrecio ? calculoPrecio.aui : null,
          precioAntesIva: calculoPrecio ? calculoPrecio.precioAntesIva : null,
          iva: calculoPrecio ? calculoPrecio.iva : null,
          precio: calculoPrecio ? calculoPrecio.precio : null,
        });

        const savedServicio = await queryRunner.manager.save(OrdenServicioTarifa, servicioOrden);

        // GUARDAR EL DESGLOSE HORA A HORA (solo trae datos cuando el servicio es de horario mixto por hora)
        if (calculoPrecio && calculoPrecio.costos_horas.length > 0) {

          for (const segmento of calculoPrecio.costos_horas) {

            const costoHora = queryRunner.manager.create(CostoHoraOrdenServicioTarifa, {
              idOrdenServicioTarifa: savedServicio,
              fecha: segmento.fecha,
              horaInicio: segmento.horaInicio,
              horaFin: segmento.horaFin,
              tipoHorario: segmento.tipoHorario,
              dominical: segmento.dominical,
              horas: segmento.horas,
              costosDirectos: segmento.costosDirectos,
              seguroVida: segmento.seguroVida,
              aui: segmento.aui,
            });

            await queryRunner.manager.save(CostoHoraOrdenServicioTarifa, costoHora);

          }

        }

        // agregar el personal si es necesario
        const personalServicio = servicio.personal;

        for (const personalAsignado of personalServicio) {

          // OBTENER PERSONAL
          const personal = await this.personalService.findOne(personalAsignado.idPersonal);

          // asignar personal para el servicio
          const asignarPersonal = queryRunner.manager.create(ProgramacionPersonal, {
            idOrdenServicioTarifa: savedServicio,
            idPersonal: personal,
            horaInicio: personalAsignado.horaInicio,
            horaFin: personalAsignado.horaFin
          });

          const savedPersonal = await queryRunner.manager.save(ProgramacionPersonal, asignarPersonal);

        }

      }

      // SI LA ORDEN ES DEFINIDA, EL PRECIO TOTAL DE LA ORDEN SE RECALCULA COMO LA SUMA DE LOS PRECIOS YA CALCULADOS DE CADA SERVICIO
      // (en vez de confiar en el precioTotal que envia el front)
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
      .leftJoinAndSelect('orden.tarifas', 'tarifas')
      .leftJoinAndSelect('tarifas.idTarifa', 'tarifa')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifas.idServicio', 'tarifaServicioDirecto')
      .leftJoinAndSelect('tarifas.costosHoras', 'tarifaCostosHoras')
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
        tarifas: {
          idTarifa: {
            idServicio: true
          },
          idServicio: true,
          costosHoras: true,
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

      if (fechaInicioOrden >= fechaFinOrden) {

        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');

      }

    }

  }

  async validacionHorarios(validarHorarioServicioDto: ValidarHorarioServicioDto) {

    const { idTarifa, idServicio, horaInicio, horaFin } = validarHorarioServicioDto;

    //! VALIDACION HORARIOS

    // Validar que la tarifa exista
    // const tarifa = await this.tarifasService.findOne(idTarifa);

    const servicio = await this.servicioService.findOne(idServicio);

    const tipohorarioDescripcion = servicio?.idTipoHorarioDescripcion;

    if (tipohorarioDescripcion.nombre === TipoHorarioInterface.DIA_COMPLETO) {

      // Si el tipo de horario es 24 horas no se valida horario ya que son 24 hrs fijas

      return;

    }

    if (tipohorarioDescripcion.nombre === TipoHorarioInterface.MIXTO && horaInicio > horaFin) {

      throw new BadRequestException(`El horario ${tipohorarioDescripcion.nombre} debe estar en un rango valido`);

    }

    if (tipohorarioDescripcion.nombre === TipoHorarioInterface.DIURNO || tipohorarioDescripcion.nombre === TipoHorarioInterface.NOCTURNO) {

      const tipoHorario = await this.tipoHorarioService.findOneVigenteByName(tipohorarioDescripcion.nombre);

      const { horaInicio: tipoHorariohoraInicio, horaFin: tipoHorarioHoraFin } = tipoHorario;

      if (horaInicio < tipoHorariohoraInicio || horaFin > tipoHorarioHoraFin) {

        throw new BadRequestException(`El horario ${tipohorarioDescripcion.nombre} debe estar dentro del rango de ${tipoHorariohoraInicio} a ${tipoHorarioHoraFin}`);

      }

    }

    let duracionServicio = await this.calcularDuracionServicio(horaInicio, horaFin);

    if (!Number.isInteger(duracionServicio)) {

      throw new BadRequestException(`La duracion del servicio debe ser horas exactas`);

    }

    const tipoDuracion = servicio.idTipoDuracion;

    // Validar que la duracion del servicio sea correcta
    if (tipoDuracion.descripcion === TipoDuracionInterface.FIJA) {

      const horasFijas = servicio.horasFijas;

      if (duracionServicio !== horasFijas) {

        throw new BadRequestException(`La duracion del servicio debe ser de ${horasFijas} horas`);

      }

    }

    // Validar que la duracion del servicio sea correcta
    if (tipoDuracion.descripcion === TipoDuracionInterface.FLEXIBLE) {

      const horasMinimas = servicio.horasMinimas;
      const horasMaximas = servicio.horasMaximas;

      if (duracionServicio < horasMinimas) {

        throw new BadRequestException(`La duracion del servicio debe ser de al menos ${horasMinimas} horas`);

      }

      if (duracionServicio > horasMaximas) {

        throw new BadRequestException(`La duracion del servicio no puede ser mayor a ${horasMaximas} horas`);

      }

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

  // CALCULA EL PRECIO DE UNA ORDEN DE SERVICIO CON UNO O VARIOS SERVICIOS.
  // Retorna los totales de la orden (mismos campos de siempre) y ademas, en "servicios", el desglose individual de cada servicio
  async obtenerPrecio(validarPrecioOrdenDto: PrecioOrdenDto) {

    const { servicios, fechaInicio, fechaFin } = validarPrecioOrdenDto;

    if (!fechaFin) {

      return {
        "message": "La orden de servicio es indefinida, el precio se calculara al momento de hacer la liquidacion o al finalizar el servicio",
        "precio": null,
        "costosDirectos": null,
        "seguroVida": null,
        "costosDirectosSeguroVida": null,
        "aui": null,
        "precioAntesIva": null,
        "iva": null,
        "servicios": servicios.map(item => ({
          idServicio: item.idServicio,
          idTarifa: item.idTarifa ?? null,
          "message": "La orden de servicio es indefinida, el precio se calculara al momento de hacer la liquidacion o al finalizar el servicio",
          "precio": null,
          "costosDirectos": null,
          "seguroVida": null,
          "costosDirectosSeguroVida": null,
          "aui": null,
          "precioAntesIva": null,
          "iva": null,
          "costos_horas": []
        }))
      }

    }

    // FECHAS NORMALIZADAS (sin horas, para poder operar solo con dias)
    const fechaInicioOrden = this.normalizarFecha(fechaInicio);
    const fechaFinOrden = this.normalizarFecha(fechaFin);

    const resultadosServicios = [];

    for (const item of servicios) {

      resultadosServicios.push(
        await this.calcularPrecioServicioOrden(item, fechaInicioOrden, fechaFinOrden)
      );

    }

    // TOTALES DE LA ORDEN: se suman los valores base (costosDirectos, seguroVida, aui) de cada servicio
    // y se calcula el iva/precioTotal una sola vez sobre el total, para no arrastrar errores de redondeo por servicio
    const baseTotales = resultadosServicios.reduce((acumulado, resultado) => ({
      costosDirectos: acumulado.costosDirectos + (resultado.costosDirectos ?? 0),
      seguroVida: acumulado.seguroVida + (resultado.seguroVida ?? 0),
      aui: acumulado.aui + (resultado.aui ?? 0),
    }), { costosDirectos: 0, seguroVida: 0, aui: 0 });

    const totales = this.calcularTotalesTarifa(baseTotales.costosDirectos, baseTotales.seguroVida, baseTotales.aui);

    return {
      ...this.armarRespuestaPrecio(`Precio calculado para ${resultadosServicios.length} servicio(s)`, totales),
      servicios: resultadosServicios,
    };

  }

  // CALCULA EL PRECIO DE UN SOLO SERVICIO DENTRO DE LA ORDEN
  private async calcularPrecioServicioOrden(
    item: PrecioOrdenServicioItemDto,
    fechaInicioOrden: Date,
    fechaFinOrden: Date,
  ) {

    const { idTarifa, idServicio, horaInicio, horaFin } = item;

    // OBTENER TARIFA (si aplica) Y SERVICIO
    // Los servicios de horario mixto con tarifa por hora no tienen tarifa guardada (su precio depende
    // del valor hora del periodo activo de facturacion), en ese caso solo se envia idServicio
    let tarifa: Tarifa | null = null;
    let servicio: Servicio;

    if (idTarifa) {

      tarifa = await this.tarifasService.findOne(idTarifa);
      servicio = tarifa.idServicio;

    } else {

      servicio = await this.servicioService.findOne(idServicio);

    }

    const tipoHorarioNombre = servicio.idTipoHorarioDescripcion.nombre;
    const tipoDuracionDescripcion = servicio.idTipoDuracion.descripcion;
    const tipoTarifaNombre = servicio.idTipoTarifa.nombre;

    const esMixtoPorHora = tipoHorarioNombre === TipoHorarioInterface.MIXTO && tipoTarifaNombre === TipoTarifaInterface.HORA;

    if (!tarifa && !esMixtoPorHora) {
      throw new BadRequestException(`Debe enviar el campo idTarifa para calcular el precio del servicio ${idServicio}`);
    }

    let resultado: ReturnType<OrdenServicioService['armarRespuestaPrecio']> & { costos_horas?: any[] };

    // ================= HORARIO DIA COMPLETO (24 HORAS) =================
    // Precio ya estipulado en la tarifa (mensual o por turno), no aplica festivos ni dominicales
    if (tipoHorarioNombre === TipoHorarioInterface.DIA_COMPLETO) {

      resultado = this.calcularPrecioMensualOTurnoFijo(tarifa, fechaInicioOrden, fechaFinOrden);

    }

    // ================= HORARIO MIXTO =================
    else if (tipoHorarioNombre === TipoHorarioInterface.MIXTO) {

      // POR SERVICIO: se cobra el valor total del servicio por cada dia, no aplica festivos ni dominicales
      if (tipoTarifaNombre === TipoTarifaInterface.SERVICIO) {

        const dias = this.calcularDuracionServicioDias(new Date(fechaInicioOrden), new Date(fechaFinOrden));

        const costosDirectos = Number(tarifa.costosDirectos) * dias;
        const seguroVida = Number(tarifa.seguroVida) * dias;
        const aui = Number(tarifa.aui) * dias;

        resultado = this.armarRespuestaPrecio(
          `El servicio se cobra por servicio, tiene una duracion de ${dias} dia(s)`,
          this.calcularTotalesTarifa(costosDirectos, seguroVida, aui)
        );

      } else {

        // POR HORA: no hay tarifa guardada, se calcula tomando la tarifa hora del periodo activo de facturacion,
        // separando por horas diurnas/nocturnas y ordinarias/dominicales-festivas segun corresponda.
        // Este es el unico caso que devuelve el desglose en "costos_horas"
        resultado = await this.calcularPrecioMixtoPorHora(fechaInicioOrden, horaInicio, fechaFinOrden, horaFin);

      }

    }

    // ================= HORARIO DIURNO / NOCTURNO =================

    // FIJA + MENSUAL O POR TURNO: precio ya estipulado en la tarifa, no aplica festivos ni dominicales
    else if (tipoDuracionDescripcion === TipoDuracionInterface.FIJA) {

      resultado = this.calcularPrecioMensualOTurnoFijo(tarifa, fechaInicioOrden, fechaFinOrden);

    }

    // FLEXIBLE + POR HORA: se calcula dia a dia con la tarifa hora ordinaria o dominical/festiva del periodo de la tarifa
    else if (tipoDuracionDescripcion === TipoDuracionInterface.FLEXIBLE && tipoTarifaNombre === TipoTarifaInterface.HORA) {

      const horasPorDia = await this.calcularDuracionServicio(horaInicio, horaFin);

      resultado = await this.calcularPrecioDiurnoNocturnoPorDia(
        servicio,
        tarifa.idPeriodo.idPeriodo,
        fechaInicioOrden,
        fechaFinOrden,
        horasPorDia,
        `El servicio tiene una duracion de ${horasPorDia} hora(s) por dia`
      );

    }

    else {

      throw new BadRequestException(`No se pudo determinar la forma de calculo del precio para el servicio ${idServicio}`);

    }

    return {
      idServicio: servicio.idServicio,
      idTarifa: tarifa ? tarifa.idTarifa : null,
      ...resultado,
      // "costos_horas" solo trae datos para el servicio mixto por hora, para los demas siempre es un arreglo vacio
      costos_horas: resultado.costos_horas ?? [],
    };

  }

  // A PARTIR DE COSTOS DIRECTOS, SEGURO VIDA Y AUI CALCULA EL RESTO DE CAMPOS DE UN PRECIO
  // costosDirectosSeguroVida = costosDirectos + seguroVida
  // precioAntesIva = costosDirectosSeguroVida + aui
  // iva = precioAntesIva * 19%
  // precioTotal = precioAntesIva + iva
  private calcularTotalesTarifa(costosDirectos: number, seguroVida: number, aui: number) {

    const costosDirectosSeguroVida = costosDirectos + seguroVida;
    const precioAntesIva = costosDirectosSeguroVida + aui;
    const iva = Math.round(precioAntesIva * 0.19); // IVA del 19%
    const precioTotal = Math.round(precioAntesIva + iva);

    return { costosDirectos, seguroVida, costosDirectosSeguroVida, aui, precioAntesIva, iva, precioTotal };

  }

  // ARMA LA RESPUESTA DE obtenerPrecio MANTENIENDO SIEMPRE LA MISMA FORMA DEL OBJETO
  private armarRespuestaPrecio(
    mensaje: string,
    totales: { costosDirectos: number, seguroVida: number, costosDirectosSeguroVida: number, aui: number, precioAntesIva: number, iva: number, precioTotal: number }
  ) {

    return {
      "message": mensaje,
      "precio": totales.precioTotal,
      "costosDirectos": totales.costosDirectos,
      "seguroVida": totales.seguroVida,
      "costosDirectosSeguroVida": totales.costosDirectosSeguroVida,
      "aui": totales.aui,
      "precioAntesIva": totales.precioAntesIva,
      "iva": totales.iva
    };

  }

  // CALCULA EL PRECIO DE UN SERVICIO DE DURACION FIJA (DIURNO/NOCTURNO/DIA COMPLETO) CUYO TIPO DE TARIFA ES MENSUAL O POR TURNO.
  // No aplica festivos ni dominicales, ya que el valor es una tarifa fija (mensual o por turno) previamente estipulada.
  private calcularPrecioMensualOTurnoFijo(tarifa: Tarifa, fechaInicioOrden: Date, fechaFinOrden: Date) {

    const esMensual = tarifa.idServicio.idTipoTarifa.nombre === TipoTarifaInterface.MES;

    // POR TURNO: se multiplica el valor del turno por el numero de dias solicitados
    if (!esMensual) {

      const dias = this.calcularDuracionServicioDias(new Date(fechaInicioOrden), new Date(fechaFinOrden));

      const costosDirectos = Number(tarifa.costosDirectos) * dias;
      const seguroVida = Number(tarifa.seguroVida) * dias;
      const aui = Number(tarifa.aui) * dias;

      return this.armarRespuestaPrecio(
        `El servicio se cobra por turno, tiene una duracion de ${dias} dia(s)`,
        this.calcularTotalesTarifa(costosDirectos, seguroVida, aui)
      );

    }

    // MENSUAL: si el rango de fechas es un mes exacto se cobra la tarifa mensual completa
    if (this.esMesExacto(fechaInicioOrden, fechaFinOrden)) {

      return this.armarRespuestaPrecio(
        'El servicio es por un mes exacto, se cobra la tarifa mensual completa',
        {
          costosDirectos: Number(tarifa.costosDirectos),
          seguroVida: Number(tarifa.seguroVida),
          costosDirectosSeguroVida: Number(tarifa.costosDirectosSeguroVida),
          aui: Number(tarifa.aui),
          precioAntesIva: Number(tarifa.precioAntesIva),
          iva: Number(tarifa.iva),
          precioTotal: Number(tarifa.precioTotal),
        }
      );

    }

    // MENSUAL PERO NO ES UN MES EXACTO: se divide el precio mensual entre 30 y se multiplica por los dias solicitados
    // (matematicamente equivalente a cobrar meses completos + el proporcional de los dias restantes)
    const dias = this.calcularDuracionServicioDias(new Date(fechaInicioOrden), new Date(fechaFinOrden));

    const costosDirectos = (Number(tarifa.costosDirectos) / 30) * dias;
    const seguroVida = (Number(tarifa.seguroVida) / 30) * dias;
    const aui = (Number(tarifa.aui) / 30) * dias;

    return this.armarRespuestaPrecio(
      `El servicio tiene una duracion de ${dias} dia(s), se cobra proporcional al mes (tarifa mensual / 30)`,
      this.calcularTotalesTarifa(costosDirectos, seguroVida, aui)
    );

  }

  // CALCULA EL PRECIO DIA A DIA PARA UN SERVICIO DIURNO O NOCTURNO (POR TURNO O POR HORA), APLICANDO LA TARIFA HORA
  // DOMINICAL/FESTIVA EN LUGAR DE LA ORDINARIA EN LOS DIAS QUE SEAN DOMINGO O FESTIVO
  private async calcularPrecioDiurnoNocturnoPorDia(
    servicio: Servicio,
    idPeriodo: number,
    fechaInicioOrden: Date,
    fechaFinOrden: Date,
    horasPorDia: number,
    mensajePrefijo: string,
  ) {

    const diurno = servicio.idTipoHorarioDescripcion.nombre === TipoHorarioInterface.DIURNO;

    const valorHoraOrdinaria = await this.obtenerValorHoraPeriodo(idPeriodo, diurno, false);
    const valorHoraDominical = await this.obtenerValorHoraPeriodo(idPeriodo, diurno, true);

    let costosDirectos = 0;
    let seguroVida = 0;
    let aui = 0;
    let dias = 0;
    let diasDominicales = 0;

    const fechaIter = new Date(fechaInicioOrden);

    while (fechaIter <= fechaFinOrden) {

      const esDominicalDia = await this.esDiaDominicalOFestivo(fechaIter);

      const valorHora = esDominicalDia ? valorHoraDominical : valorHoraOrdinaria;

      costosDirectos += Number(valorHora.costosDirectos) * horasPorDia;
      seguroVida += Number(valorHora.seguroVida ?? 0) * horasPorDia;
      aui += Number(valorHora.aui) * horasPorDia;

      if (esDominicalDia) diasDominicales++;
      dias++;

      fechaIter.setDate(fechaIter.getDate() + 1);

    }

    return this.armarRespuestaPrecio(
      `${mensajePrefijo}, ${dias} dia(s) en total (${diasDominicales} dominical/festivo)`,
      this.calcularTotalesTarifa(costosDirectos, seguroVida, aui)
    );

  }

  // CALCULA EL PRECIO HORA A HORA PARA UN SERVICIO DE HORARIO MIXTO POR HORA (no tiene tarifa guardada).
  // Recorre el rango completo (fechaInicioOrden+horaInicio -> fechaFinOrden+horaFin) partiendolo en segmentos
  // segun los limites vigentes de diurno/nocturno y segun si cada dia es domingo/festivo (dominical) u ordinario
  private async calcularPrecioMixtoPorHora(fechaInicioOrden: Date, horaInicio: string, fechaFinOrden: Date, horaFin: string) {

    const periodoActivo = await this.periodosService.obtenerPeriodoActivo();

    if (!periodoActivo) {
      throw new BadRequestException('No hay un periodo activo de facturacion configurado para calcular el precio de este servicio');
    }

    const tipoHorarioDiurnoVigente = await this.tipoHorarioService.findOneVigenteByName(TipoHorarioInterface.DIURNO);

    const minutosInicioDiurno = this.horaAMinutos(tipoHorarioDiurnoVigente.horaInicio);
    const minutosFinDiurno = this.horaAMinutos(tipoHorarioDiurnoVigente.horaFin);

    // RESOLVER LOS 4 VALORES DE TARIFA HORA DEL PERIODO ACTIVO (diurna/nocturna x ordinaria/dominical)
    const valoresHora = {
      diurnoOrdinario: await this.obtenerValorHoraPeriodo(periodoActivo.idPeriodo, true, false),
      diurnoDominical: await this.obtenerValorHoraPeriodo(periodoActivo.idPeriodo, true, true),
      nocturnoOrdinario: await this.obtenerValorHoraPeriodo(periodoActivo.idPeriodo, false, false),
      nocturnoDominical: await this.obtenerValorHoraPeriodo(periodoActivo.idPeriodo, false, true),
    };

    let costosDirectos = 0;
    let seguroVida = 0;
    let aui = 0;

    // DESGLOSE HORA A HORA DEL SERVICIO MIXTO POR HORA (unico caso que llena este arreglo)
    const costosHoras: {
      fecha: string;
      horaInicio: string;
      horaFin: string;
      tipoHorario: 'diurno' | 'nocturno';
      dominical: boolean;
      horas: number;
      costosDirectos: number;
      seguroVida: number;
      aui: number;
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

        for (let i = 0; i < puntos.length - 1; i++) {

          const inicioSegmento = puntos[i];
          const finSegmento = puntos[i + 1];
          const horasSegmento = (finSegmento - inicioSegmento) / 60;

          if (horasSegmento <= 0) continue;

          // EL PUNTO MEDIO DEL SEGMENTO DETERMINA SI ES DIURNO O NOCTURNO
          const puntoMedio = (inicioSegmento + finSegmento) / 2;
          const esDiurno = puntoMedio >= minutosInicioDiurno && puntoMedio < minutosFinDiurno;

          const valorHora = esDiurno
            ? (esDominicalDia ? valoresHora.diurnoDominical : valoresHora.diurnoOrdinario)
            : (esDominicalDia ? valoresHora.nocturnoDominical : valoresHora.nocturnoOrdinario);

          const costosDirectosSegmento = Number(valorHora.costosDirectos) * horasSegmento;
          const seguroVidaSegmento = Number(valorHora.seguroVida ?? 0) * horasSegmento;
          const auiSegmento = Number(valorHora.aui) * horasSegmento;

          costosDirectos += costosDirectosSegmento;
          seguroVida += seguroVidaSegmento;
          aui += auiSegmento;

          costosHoras.push({
            fecha: this.formatearFecha(fechaIter),
            horaInicio: this.minutosAHora(inicioSegmento),
            horaFin: this.minutosAHora(finSegmento),
            tipoHorario: esDiurno ? 'diurno' : 'nocturno',
            dominical: esDominicalDia,
            horas: horasSegmento,
            costosDirectos: costosDirectosSegmento,
            seguroVida: seguroVidaSegmento,
            aui: auiSegmento,
          });

        }

      }

      fechaIter.setDate(fechaIter.getDate() + 1);

    }

    const respuesta = this.armarRespuestaPrecio(
      'Calculado por horas con la tarifa hora del periodo activo de facturacion (diurna/nocturna y ordinaria/dominical-festiva)',
      this.calcularTotalesTarifa(costosDirectos, seguroVida, aui)
    );

    return { ...respuesta, costos_horas: costosHoras };

  }

  // OBTENER EL VALOR DE LA TARIFA HORA (diurna/nocturna, ordinaria/dominical) PARA UN PERIODO
  private async obtenerValorHoraPeriodo(idPeriodo: number, diurno: boolean, dominical: boolean): Promise<TarifaHora> {

    const tarifaHoraDescripcion = await this.tarifaHoraDescripcionService.findOneByTipo(diurno, dominical);

    const valorHora = await this.tarifaHoraService.findOneByPeriodoYDescripcion(idPeriodo, tarifaHoraDescripcion.idTarifaHoraDescripcion);

    if (!valorHora) {
      throw new BadRequestException(`No se ha configurado el valor de la tarifa hora "${tarifaHoraDescripcion.nombre}" para este periodo`);
    }

    return valorHora;

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

  /** Empleados disponibles según tu regla:
   *  - Si fechaFin: filtra programaciones cuya ORDEN se superpone a [fechaInicio, fechaFin]
   *  - Si fechaFin=null: filtra programaciones cuya ORDEN tenga fechaFin NULL o >= fechaInicio
   *  - Luego marca ocupados si se SOLAPAN las horas
   *  - Devuelve personal.laborando = true que NO estén ocupados
   */
  async getEmpleadosDisponibles(
    validarEmpleadosDisponiblesDto: ValidarEmpleadosDisponiblesDto,      // "HH:mm:ss"
  ): Promise<Personal[]> {

    const { fechaInicio, fechaFin, horaInicio, horaFin } = validarEmpleadosDisponiblesDto;

    // 1) Traer programaciones relevantes por FECHA (sin validar horas aquí)
    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        "pp.idPersonal AS idPersonal",
        "pp.horaInicio AS horaInicio",
        "pp.horaFin AS horaFin",
      ])
      .from(ProgramacionPersonal, "pp")
      .innerJoin(OrdenServicioTarifa, "ost", "pp.idOrdenServicioTarifa = ost.idOrdenServicioTarifa")
      .innerJoin(OrdenServicio, "os", "ost.idOrdenServicio = os.idOrdenServicio")
      .innerJoin(EstadoOrdenEntity, "eos", "os.idEstadoOrdenServicio = eos.idEstadoOrdenServicio")
      .where("eos.nombre NOT IN (:...estadosIgnorados)", {
        estadosIgnorados: [EstadoOrdenServicio.CANCELADA, EstadoOrdenServicio.ANULADA, EstadoOrdenServicio.TERMINADO]
      });

    if (fechaFin) {
      // Overlap entre [fechaInicio, fechaFin] y [os.fechaInicio, os.fechaFin (o +∞)]
      qb.where("os.fechaInicio <= :fFin", { fFin: fechaFin })
        .andWhere(
          new Brackets((w) => {
            w.where("os.fechaFin IS NULL").orWhere("os.fechaFin >= :fIni", { fIni: fechaInicio });
          })
        );
    } else {
      // Indefinido hacia adelante: órdenes con fechaFin NULL o que no han terminado antes de fechaInicio
      qb.where("os.fechaFin IS NULL OR os.fechaFin >= :fIni", { fIni: fechaInicio });
    }

    const programaciones = await qb.getRawMany<{ idPersonal: number; horaInicio: string; horaFin: string }>();

    // 2) Marcar OCUPADOS solo si las HORAS se solapan (incluye nocturnos/24h)
    const idsOcupados = new Set<number>();
    for (const p of programaciones) {
      if (this.horasSeSolapan(horaInicio, horaFin, p.horaInicio, p.horaFin)) {
        idsOcupados.add(p.idPersonal);
      }
    }

    // 3) Disponibles = personal laborando y NO en ocupados
    const disponiblesQB = this.personalRepository
      .createQueryBuilder("p")
      .where("p.laborando = true");

    if (idsOcupados.size > 0) {
      disponiblesQB.andWhere("p.idPersonal NOT IN (:...ids)", { ids: Array.from(idsOcupados) });
    }

    return await disponiblesQB.getMany();
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

  async updateOrdenServicio(id: number, updateOrdenServicioDto: UpdateOrdenServicioDto) {

    const { fechaInicio, fechaFin, fechaActualizacion } = updateOrdenServicioDto;

    const fechaInicioOrden = this.normalizarFecha(fechaInicio);

    const fechaFinOrden = fechaFin ? this.normalizarFecha(fechaFin) : null;

    if (fechaFinOrden != null && fechaInicioOrden >= fechaFinOrden) {

      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');

    }

    if (fechaFinOrden != null && (updateOrdenServicioDto.precioTotal == null || updateOrdenServicioDto.precioTotal == 0)) {

      throw new BadRequestException('se debe enviar el precio total al ser una orden definida');

    }

    const fechaActualizacionOrden = this.normalizarFecha(fechaActualizacion);

    // OBTENER LA ORDEN CON SUS SERVICIOS (tarifas) ACTUALES
    const ordenServicio = await this.findOneOrdenRelations(id);

    const fechaInicioOrdenString = this.formatearFecha(new Date(ordenServicio.fechaInicio));
    const fechaFinOrdenString = ordenServicio.fechaFin ? this.formatearFecha(new Date(ordenServicio.fechaFin)) : null;

    const fechaInicioNuevaString = this.formatearFecha(fechaInicioOrden);
    const fechaFinNuevaString = fechaFinOrden ? this.formatearFecha(fechaFinOrden) : null;

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

      // ACTUALIZAR EL PRECIO DE CADA SERVICIO YA EXISTENTE, SIN BORRAR/RECREAR LAS FILAS DE OrdenServicioTarifa
      // (borrar y recrear eliminaba en cascada el personal ya asignado en ProgramacionPersonal)
      for (const servicioOrden of ordenServicio.tarifas) {

        let calculoPrecio: Awaited<ReturnType<OrdenServicioService['calcularPrecioServicioOrden']>> | null = null;

        // Si la orden queda definida, recalcular el precio real del servicio con las nuevas fechas,
        // usando la misma logica de obtenerPrecio (en lugar de confiar en un precio que ya no aplica)
        if (fechaFinOrden != null) {

          calculoPrecio = await this.calcularPrecioServicioOrden(
            {
              idTarifa: servicioOrden.idTarifa ? servicioOrden.idTarifa.idTarifa : undefined,
              idServicio: servicioOrden.idServicio.idServicio,
              horaInicio: servicioOrden.horaInicio,
              horaFin: servicioOrden.horaFin,
            },
            fechaInicioOrden,
            fechaFinOrden,
          );

          precioTotalCalculado += calculoPrecio.precio;

        }

        // Si la orden es indefinida, todos los valores de precio quedan en null (se cobra mes a mes al liquidar/finalizar)
        servicioOrden.costosDirectos = calculoPrecio ? calculoPrecio.costosDirectos : null;
        servicioOrden.seguroVida = calculoPrecio ? calculoPrecio.seguroVida : null;
        servicioOrden.aui = calculoPrecio ? calculoPrecio.aui : null;
        servicioOrden.precioAntesIva = calculoPrecio ? calculoPrecio.precioAntesIva : null;
        servicioOrden.iva = calculoPrecio ? calculoPrecio.iva : null;
        servicioOrden.precio = calculoPrecio ? calculoPrecio.precio : null;

        const savedServicioOrden = await queryRunner.manager.save(OrdenServicioTarifa, servicioOrden);

        // REEMPLAZAR EL DESGLOSE HORA A HORA: a diferencia del personal, estos tramos no tienen identidad propia,
        // dependen enteramente de las fechas/horas, asi que se recalculan desde cero en cada actualizacion
        await queryRunner.manager.delete(CostoHoraOrdenServicioTarifa, { idOrdenServicioTarifa: savedServicioOrden.idOrdenServicioTarifa });

        if (calculoPrecio && calculoPrecio.costos_horas.length > 0) {

          for (const segmento of calculoPrecio.costos_horas) {

            const costoHora = queryRunner.manager.create(CostoHoraOrdenServicioTarifa, {
              idOrdenServicioTarifa: savedServicioOrden,
              fecha: segmento.fecha,
              horaInicio: segmento.horaInicio,
              horaFin: segmento.horaFin,
              tipoHorario: segmento.tipoHorario,
              dominical: segmento.dominical,
              horas: segmento.horas,
              costosDirectos: segmento.costosDirectos,
              seguroVida: segmento.seguroVida,
              aui: segmento.aui,
            });

            await queryRunner.manager.save(CostoHoraOrdenServicioTarifa, costoHora);

          }

        }

      }

      // EL PRECIO TOTAL DE LA ORDEN SE RECALCULA COMO LA SUMA DE LOS PRECIOS YA CALCULADOS DE CADA SERVICIO
      // (en vez de confiar en el precioTotal que envia el front)
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
      .leftJoinAndSelect('o.tarifas', 'tarifas')
      .leftJoinAndSelect('tarifas.idTarifa', 'tarifa')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifas.idServicio', 'tarifaServicioDirecto')
      .leftJoinAndSelect('tarifas.costosHoras', 'tarifaCostosHoras')
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
      for (const t of o.tarifas) {
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
