import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto, EnviarCorreoDto } from '../../common/dto';

import { User } from '../../users/entities/user.entity';
import { EstadoOrdenServicio as EstadoOrdenEntity} from "../../common/entities";
import { SendMailOptions } from '../../common/services/email/email.service';

import { EstadoOrdenServicioService, EmailService } from '../../common/services';
import { LocacionService } from '../../clientes/services';
import { TarifasService } from '../../tarifas/services';
import { ServiciosService, TipoHorarioService } from '../../servicios/services';
import { PersonalService } from '../../personal/services';
import { ReporteOrdenServicioService } from '../../reportes/services';

import { EstadoOrdenServicio } from '../../common/interfaces/estado-orden-servicio.interface';
import { TipoDuracionInterface } from '../../servicios/interfaces/tipo-duracion.interface';
import { TipoHorarioInterface } from 'src/servicios/interfaces/tipo-horario.interface';
import { TipoTarifaInterface } from '../../tarifas/interfaces/tipo-tarifa.interface';

import { Personal } from '../../personal/entities';

import { 
  OrdenServicio,
  OrdenServicioId,
  OrdenServicioTarifa,
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
  ValidarEmpleadosDisponiblesDto,
  ValidarRangoHorarioPersonalOrdenDto,

  // VALIDACIONES ACTUALIZACION
  UpdateValidarFechaOrdenServicioDto,

  // ANULAR ORDEN
  AnularIdOrdenServicioDto 
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
      private readonly tipoHorarioService: TipoHorarioService,
      private readonly servicioService: ServiciosService,
      private readonly emailService: EmailService, // Servicio de email para envio de correos
      private readonly reporteOrdenServicioService: ReporteOrdenServicioService, // Servicio para generar reportes
      private readonly dataSource: DataSource,
      private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async validarOrdenServicioId(validarIdOrdenServicioDto: ValidarIdOrdenServicioDto){

    const ordenServicioId = await this.ordenServicioIdRepository.findOneBy({
      descripcionId: validarIdOrdenServicioDto.descripcionId
    });

    if (ordenServicioId){
      throw new BadRequestException(`El ID "${validarIdOrdenServicioDto.descripcionId}" ya existe`);
    }

    return

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

    if (existeNumeroOrden){
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

        if (createOrdenServicioDto.precioTotal == null || createOrdenServicioDto.precioTotal == 0){

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

      for (const servicio of servicios) {
              
        // OBTENER TARIFA
        const tarifa = await this.tarifasService.findOne(servicio.idTarifa);

        nombreServicios.push(tarifa.idServicio.descripcion);
        
        // Validar si se debe enviar el precio del servicio
        if (createOrdenServicioDto.fechaFin != null) {
  
          if (servicio.precio == null || servicio.precio == 0){
  
            throw new BadRequestException(`se debe enviar el precio del servicio ${tarifa.idServicio.descripcion} al ser una orden definida`);          
  
          }

        }

        // Validar si el servicio requiere personal
        if (tarifa.idServicio.idTipoServicio.requierePersonal && servicio.personal.length <= 0){
          
          throw new BadRequestException(`El servicio ${tarifa.idServicio.descripcion} requiere personal, por favor asignar`);          

        }

        // Crear el servicio para la orden
        const servicioOrden = queryRunner.manager.create(OrdenServicioTarifa, {
            idOrdenServicio: savedOrdenServicio,
            idTarifa: tarifa,
            cantidadPersonal: servicio.cantidadPersonal ? servicio.cantidadPersonal : 0,
            horaInicio: servicio.horaInicio,
            horaFin: servicio.horaFin,
            precio: servicio.precio ? servicio.precio : 0
        });

        const savedServicio = await queryRunner.manager.save(OrdenServicioTarifa, servicioOrden);

        // agregar el personal si es necesario
        const personalServicio = servicio.personal;

        for (const personalAsignado of personalServicio){

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

      // envio de correos que se tengan registrados en la locacion
      const nombreResponsable = `${locacion.primerNombreResponsable} ${locacion.primerApellidoResponsable}`;

      const emails = await this.locacionService.getEmailsByLocacionAndEstado(
        createOrdenServicioDto.idLocacion, 
        estadoOrdenServicio.idEstadoOrdenServicio
      )

      await this.notificationEmail(
        nombreResponsable, 
        locacion.nombre,
        emails
      );
      
      await queryRunner.commitTransaction();
      
      return savedOrdenServicio;
      
    } catch (error) {

      await queryRunner.rollbackTransaction();

      throw error;
      
    } finally {

      await queryRunner.release();

    }
    

  }

  // ENVIAR CORREO PARA INFORMAR CREACION DE ORDEN DE SERVICIO
  private async notificationEmail(
    nombreCompleto: string, 
    locacion: string,
    email: string[]
  ) {        

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CREACION ORDEN DE SERVICIO</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día <strong>${nombreCompleto}</strong>, se ha creado una orden de servicio para el puesto <b>${locacion}</b>. <br><br>
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

      const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): creacion orden de servicio`;

      // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
      const options: SendMailOptions = {
          to: email,
          subject: subject,
          htmlBody: html
      }
  
      // Enviamos correo para notificar al usuario
      const isEmailSend = await this.emailService.sendEmail(options);
  
      if (!isEmailSend){
          throw new InternalServerErrorException(`Error al enviar correo de notificacion al email ${email}, revisar correo si esta bien escrito`);
      }

  }

  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const ordenesServicio = await this.ordenServicioRepository.find({
          take: limit,
          skip: offset,
          order: {
              fechaInicio: 'DESC'
          }
      });
  
      return ordenesServicio;

    }

    return await this.ordenServicioRepository.find({
      order: {
        fechaInicio: 'DESC'
      }
    });

  }

  async findOne(id: number) {
    
    const ordenServicio = await this.ordenServicioRepository.findOneBy({idOrdenServicio: id});
    
    if(!ordenServicio) throw new NotFoundException(`Orden de servicio con id "${id}" no se ha encontrado`);

    return ordenServicio;

  }

  async validacionFechas(validarFechasOrdenDto: ValidarFechasOrdenServicioDto){

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

  async validacionHorarios(validarHorarioServicioDto: ValidarHorarioServicioDto){

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

    if (tipohorarioDescripcion.nombre === TipoHorarioInterface.MIXTO && horaInicio > horaFin){

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

    if (!Number.isInteger(duracionServicio)){

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

  // TODO: REVISAR LOGICA DE CALCULO DE PRECIO, PARA QUE FUNCIONE POR SERVICIO Y NO POR TARIFA
  async obtenerPrecio(validarPrecioOrdenDto: PrecioOrdenDto){

    const { idTarifa, horaInicio, horaFin, fechaInicio, fechaFin } = validarPrecioOrdenDto;

    // Validar que la tarifa exista
    const tarifa = await this.tarifasService.findOne(idTarifa);
    // const servicio = await this.servicioService.findOne(idServicio);

    if (!fechaFin) {
  
      return {
        "message": "La orden de servicio es indefinida, el precio se calculara al momento de hacer la liquidacion o al finalizar el servicio",
        "precio": null
      }
        
    }
    
    //! DESESTRUCTURAR FECHAS PARA EL MANEJO CORRECTO

    // FECHA INICIO ORDEN SERVICIO
                
    const fechaInicioSplit = fechaInicio.toISOString().split('T')[0];

    const [añoInicio, mesInicio, diaInicio] = fechaInicioSplit.split('-').map(Number);
    
    const fechaInicioOrden = new Date(añoInicio, mesInicio - 1, diaInicio);
    
    // FECHA FIN ORDEN SERVICIO
                
    const fechaFinSplit = fechaFin.toISOString().split('T')[0];

    const [añoFin, mesFin, diaFin] = fechaFinSplit.split('-').map(Number);
    
    const fechaFinOrden = new Date(añoFin, mesFin - 1, diaFin);


    let duracionServicio = await this.calcularDuracionServicio(horaInicio, horaFin);

    let precioTotal: number;  

    // VALIDAR SI SE ESTA PIDIENDO SERVICIO POR UN MES EXACTO, ES DECIR TODO ENERO, TODO FEBRERO, ...
    if (this.esMesCompleto(fechaInicioOrden, fechaFinOrden)) {
      
      let diaFinMes: number = diaFin;

      if (tarifa.idServicio.idTipoHorarioDescripcion.descripcion == TipoHorarioInterface.NOCTURNO){

        diaFinMes = diaFin - 1;

      } 

      // SI EL TIPO DE TARIFA ES POR MES
      if (tarifa.idTipoTarifa.nombre === TipoTarifaInterface.MES){

        precioTotal = tarifa.precioTotal;

      }

       // SI ES UNIDAD O DIA
       else if (tarifa.idTipoTarifa.nombre === TipoTarifaInterface.UNIDAD || tarifa.idTipoTarifa.nombre === TipoTarifaInterface.DIA){

        precioTotal = tarifa.precioTotal * diaFinMes;

       }

      // SI ES TIPO HORA
      else {

        const precioHora = tarifa.precioTotal;

        const precioTotalDia = precioHora * duracionServicio;

        precioTotal = precioTotalDia * diaFinMes;

      }


      return {
        "message": "El servicio es por un mes completo exacto",
        "precio": precioTotal
      }

    }

    // VALIDACIONES POR DIA
    let duracionServicioDias = this.calcularDuracionServicioDias(fechaInicioOrden, fechaFinOrden);

    if (tarifa.idServicio.idTipoHorarioDescripcion.descripcion == TipoHorarioInterface.NOCTURNO){

      duracionServicioDias -= 1

      duracionServicioDias = duracionServicioDias != 0 ? duracionServicioDias : 1;

    }

    // SI EL TIPO DE TARIFA ES POR MES
    if (tarifa.idTipoTarifa.nombre === TipoTarifaInterface.MES){

      const precioServicioDia = tarifa.precioTotal / tarifa.idTipoTarifa.cantidadTiempo;

      precioTotal = precioServicioDia * duracionServicioDias;

    }
    
    // SI ES UNIDAD O DIA
    else if (tarifa.idTipoTarifa.nombre === TipoTarifaInterface.UNIDAD || tarifa.idTipoTarifa.nombre === TipoTarifaInterface.DIA){

      precioTotal = tarifa.precioTotal * duracionServicioDias;

    }
    
    // SI ES TIPO HORA
    else {

      const precioHora = tarifa.precioTotal;

      const precioTotalDia = precioHora * duracionServicio;

      precioTotal = precioTotalDia * duracionServicioDias;

    }


    return {
      "message": `El servicio tiene una duracion de ${duracionServicioDias} dia(s)`,
      "precio": precioTotal
    }
    
  }

  async obtenerPrecioServicio(validarPrecioOrdenDto: PrecioOrdenDto){

    const { idTarifa, idServicio, horaInicio, horaFin, fechaInicio, fechaFin } = validarPrecioOrdenDto;

    // Validar que la tarifa exista
    // const tarifa = await this.tarifasService.findOne(idTarifa);
    const servicio = await this.servicioService.findOne(idServicio);

    const tarifa = await this.tarifasService.findTarifaByServicio(idServicio);

    if (!fechaFin) {
  
      return {
        "message": "La orden de servicio es indefinida, el precio se calculara al momento de hacer la liquidacion o al finalizar el servicio",
        "precio": null
      }
        
    }
    
    //! DESESTRUCTURAR FECHAS PARA EL MANEJO CORRECTO

    // FECHA INICIO ORDEN SERVICIO
                
    const fechaInicioSplit = fechaInicio.toISOString().split('T')[0];

    const [añoInicio, mesInicio, diaInicio] = fechaInicioSplit.split('-').map(Number);
    
    const fechaInicioOrden = new Date(añoInicio, mesInicio - 1, diaInicio);
    
    // FECHA FIN ORDEN SERVICIO
                
    const fechaFinSplit = fechaFin.toISOString().split('T')[0];

    const [añoFin, mesFin, diaFin] = fechaFinSplit.split('-').map(Number);
    
    const fechaFinOrden = new Date(añoFin, mesFin - 1, diaFin);


    let duracionServicio = await this.calcularDuracionServicio(horaInicio, horaFin);

    let precioTotal: number;  

    // VALIDAR SI SE ESTA PIDIENDO SERVICIO POR UN MES EXACTO, ES DECIR TODO ENERO, TODO FEBRERO, ...
    if (this.esMesCompleto(fechaInicioOrden, fechaFinOrden)) {
      
      let diaFinMes: number = diaFin;
      if (tarifa[0].idServicio.idTipoHorarioDescripcion.nombre == TipoHorarioInterface.NOCTURNO){

        diaFinMes = diaFin - 1;

      } 

      // SI EL TIPO DE TARIFA ES POR MES
      if (tarifa[0].idTipoTarifa.nombre === TipoTarifaInterface.MES){

        precioTotal = tarifa[0].precioTotal;

      }

       // SI ES UNIDAD O DIA
       else if (tarifa[0].idTipoTarifa.nombre === TipoTarifaInterface.UNIDAD || tarifa[0].idTipoTarifa.nombre === TipoTarifaInterface.DIA){

        precioTotal = tarifa[0].precioTotal * diaFinMes;

       }

      // SI ES TIPO HORA
      else {

        const precioHora = tarifa[0].precioTotal;

        const precioTotalDia = precioHora * duracionServicio;

        precioTotal = precioTotalDia * diaFinMes;

      }


      return {
        "message": "El servicio es por un mes completo exacto",
        "precio": precioTotal
      }

    }

    // VALIDACIONES POR DIA
    let duracionServicioDias = this.calcularDuracionServicioDias(fechaInicioOrden, fechaFinOrden);

    if (servicio.idTipoHorarioDescripcion.descripcion == TipoHorarioInterface.NOCTURNO){

      duracionServicioDias -= 1

      duracionServicioDias = duracionServicioDias != 0 ? duracionServicioDias : 1;

    }

    // SI EL TIPO DE TARIFA ES POR MES
    if (tarifa[0].idTipoTarifa.nombre === TipoTarifaInterface.MES){

      const precioServicioDia = tarifa[0].precioTotal / tarifa[0].idTipoTarifa.cantidadTiempo;

      precioTotal = precioServicioDia * duracionServicioDias;

    }
    
    // SI ES UNIDAD O DIA
    else if (tarifa[0].idTipoTarifa.nombre === TipoTarifaInterface.UNIDAD || tarifa[0].idTipoTarifa.nombre === TipoTarifaInterface.DIA){

      precioTotal = tarifa[0].precioTotal * duracionServicioDias;

    }
    
    // SI ES TIPO HORA
    else {

      const precioHora = tarifa[0].precioTotal;

      const precioTotalDia = precioHora * duracionServicio;

      precioTotal = precioTotalDia * duracionServicioDias;

    }



    return {
      "message": `El servicio tiene una duracion de ${duracionServicioDias} dia(s)`,
      "precio": precioTotal
    }
    
  }

  private esMesCompleto(fechaInicio: Date, fechaFin: Date): boolean {
    
    // Verificar que sean del mismo mes y año
    if (fechaInicio.getFullYear() !== fechaFin.getFullYear() || 
        fechaInicio.getMonth() !== fechaFin.getMonth()) {
      return false;
    }
    
    // Verificar que la fecha de inicio sea el día 1
    if (fechaInicio.getDate() !== 1) {
      return false;
    }
    
    // Obtener el último día del mes
    const ultimoDiaDelMes = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0).getDate();
    
    // Verificar que la fecha fin sea el último día del mes
    return fechaFin.getDate() === ultimoDiaDelMes;

  }

  private calcularDuracionServicioDias(fechaInicio: Date, fechaFin: Date){

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

    if (validarRangoHorarioPersonalOrdenDto.personal.length === 0){
      return {
        message: "No se asigno personal, no es necesario validar horarios"
      }
    }
  
    for (const emp of validarRangoHorarioPersonalOrdenDto.personal) {

      const horaInicioEmpleado = this.parseHour(emp.horaInicio);
      const horaFinEmpleado = this.parseHour(emp.horaFin);
      const duracionEmp = this.getDuration(horaInicioEmpleado, horaFinEmpleado);

      if (duracionServicio < 24){

        if (horaInicioEmpleado == horaFinEmpleado){
          throw new BadRequestException(`Hora inicio y fin de un empleado no puede ser la misma`);
        }

        // Validar que horario sea durante las horas del dia: hora inicio mayor a hora fin
        if(horaInicio < horaFin){

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
    if (!(totalEmpleadoHoras === duracionServicio)){
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

    const {fechaInicio, fechaFin, horaInicio, horaFin} = validarEmpleadosDisponiblesDto;

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

  async updateValidarFechasOrdenServicio(id: number, updateValidarFechaOrdenServicioDto: UpdateValidarFechaOrdenServicioDto) {
    
    const { fechaInicio, fechaFin, fechaActualizacion } = updateValidarFechaOrdenServicioDto;
    
    // validar orden logico de las fechas

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
    
    // Obtener orden de servicio
    const ordenServicio = await this.findOne(id);

    // Convert ordenServicio.fechaInicio to Date if it's a string
    const fechaInicioOrdenString = new Date(ordenServicio.fechaInicio).toISOString().split('T')[0];
    const fechaFinOrdenString = new Date(ordenServicio.fechaFin).toISOString().split('T')[0];


    if(fechaInicioOrden.toISOString().split('T')[0] == fechaInicioOrdenString && fechaFinOrden.toISOString().split('T')[0] == fechaFinOrdenString){
      return {
        message: 'Las fechas son iguales a las que ya tiene la orden de servicio, no se realizo ningun cambio'
      }
    }

    const descripcionEstadoOrdenServicio = ordenServicio.idEstadoOrdenServicio.nombre;

    // validar si es diferente a la que se coloco
    // si es diferente validar que el estado de la orden sea programado o por iniciar
    if(fechaInicioOrden.toISOString().split('T')[0] != fechaInicioOrdenString){
    
      if(descripcionEstadoOrdenServicio != EstadoOrdenServicio.PROGRAMADO && descripcionEstadoOrdenServicio != EstadoOrdenServicio.POR_INICIAR){

          throw new BadRequestException('La fecha de inicio solo se puede modificar si la orden aun no ha iniciado');

      }

    }
    
    // validar fecha fin de la orden y si es diferente a la que se coloco
    // si es diferente validar - que el estado de la orden sea PROGRAMADO , POR INICIAR , INICIADO , POR TERMINAR 

    if(fechaFinOrden != null && fechaFinOrden.toISOString().split('T')[0] != fechaFinOrdenString){

      if(
        descripcionEstadoOrdenServicio != EstadoOrdenServicio.PROGRAMADO && 
        descripcionEstadoOrdenServicio != EstadoOrdenServicio.POR_INICIAR &&
        descripcionEstadoOrdenServicio != EstadoOrdenServicio.INICIADO &&
        descripcionEstadoOrdenServicio != EstadoOrdenServicio.POR_TERMINAR
      ){

        throw new BadRequestException('La fecha de fin solo se puede modificar si la orden aun no ha sido cancelada, terminada o anulada');

      }

    }

    // VALIDAR ESTADO DE LA ORDEN, TENER EN CUENTA SI LAS FECHAS SON IGUALES QUEDA COMO ESTA, SI CAMBIARON ENTONCES VALIDAR EN QUE ESTADO QUEDA
    
    // FECHA ACTUALIZACION ORDEN SERVICIO
                
    const fechaActualizacionSplit = fechaActualizacion.toISOString().split('T')[0];

    const [añoActualizacion, mesActualizacion, diaActualizacion] = fechaActualizacionSplit.split('-').map(Number);
    
    const fechaActualizacionOrden = new Date(añoActualizacion, mesActualizacion - 1, diaActualizacion);

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

  async updateOrdenServicio(id: number, updateOrdenServicioDto: UpdateOrdenServicioDto){

    const { fechaInicio, fechaFin, fechaActualizacion, servicios } = updateOrdenServicioDto;

    // Usar QueryRunner para transacción manual
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

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

        if (updateOrdenServicioDto.precioTotal == null || updateOrdenServicioDto.precioTotal == 0){

            throw new BadRequestException('se debe enviar el precio total al ser una orden definida');          

        }

    }

    // FECHA ACTUALIZACION ORDEN SERVICIO
                
    const fechaActualizacionSplit = fechaActualizacion.toISOString().split('T')[0];

    const [añoActualizacion, mesActualizacion, diaActualizacion] = fechaActualizacionSplit.split('-').map(Number);
    
    const fechaActualizacionOrden = new Date(añoActualizacion, mesActualizacion - 1, diaActualizacion);

    // OBTENER ID ESTADO ORDEN SERVICIO
    //! VALIDAR SEGUN LAS FECHAS DE INICIO Y CREACION DE LA ORDEN DE SERVICIO
    let estadoOrdenServicio: EstadoOrdenEntity;

    if (fechaFin != null && fechaFinOrden < fechaActualizacionOrden) {
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

    try {

      const ordenServicio = await this.findOne(id);
      
      // actualizar campos
      ordenServicio.fechaInicio = fechaInicioOrden;
      ordenServicio.fechaFin = fechaFinOrden;
      ordenServicio.fechaActualizacion = fechaActualizacionOrden;
      ordenServicio.precioTotal = updateOrdenServicioDto.precioTotal;
      ordenServicio.idEstadoOrdenServicio = estadoOrdenServicio;

      const savedOrdenServicio = await queryRunner.manager.save(OrdenServicio, ordenServicio);

      const nombreServicios = []

      if (servicios.length != ordenServicio.tarifas.length){

        throw new BadRequestException(`No se puede actualizar la cantidad de servicios existentes para esta orden`);          

      }

      // eliminar tarifas asociadas a la orden
      await queryRunner.manager.delete(OrdenServicioTarifa, { idOrdenServicio: id });

      for (const servicio of servicios) {
              
        // OBTENER TARIFA
        const tarifa = await this.tarifasService.findOne(servicio.idTarifa);

        nombreServicios.push(tarifa.idServicio.descripcion);
        
        // Validar si se debe enviar el precio del servicio
        if (fechaFinOrden != null) {
  
          if (servicio.precio == null || servicio.precio == 0){
  
            throw new BadRequestException(`se debe enviar el precio del servicio ${tarifa.idServicio.descripcion} al ser una orden definida`);          
  
          }

        }

        // Validar si el servicio requiere personal
        if (tarifa.idServicio.idTipoServicio.requierePersonal && servicio.personal.length <= 0){
          
          throw new BadRequestException(`El servicio ${tarifa.idServicio.descripcion} requiere personal, por favor asignar`);          

        }

        // Crear el servicio para la orden
        const servicioOrden = queryRunner.manager.create(OrdenServicioTarifa, {
            idOrdenServicio: savedOrdenServicio,
            idTarifa: tarifa,
            cantidadPersonal: servicio.cantidadPersonal ? servicio.cantidadPersonal : 0,
            horaInicio: servicio.horaInicio,
            horaFin: servicio.horaFin,
            precio: servicio.precio ? servicio.precio : 0
        });

        const savedServicio = await queryRunner.manager.save(OrdenServicioTarifa, servicioOrden);

        // agregar el personal si es necesario
        const personalServicio = servicio.personal;

        for (const personalAsignado of personalServicio){

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

      // envio de correos que se tengan registrados en la locacion
      const nombreResponsable = `${ordenServicio.idLocacion.primerNombreResponsable} ${ordenServicio.idLocacion.primerApellidoResponsable}`;

      const emails = await this.locacionService.getEmailsByLocacionAndEstado(
        ordenServicio.idLocacion.idLocacion, 
        estadoOrdenServicio.idEstadoOrdenServicio
      )

      await this.notificationUpdateEmail(
        nombreResponsable, 
        ordenServicio.idLocacion.nombre,
        emails
      );
      
      await queryRunner.commitTransaction();
      
      return savedOrdenServicio;
      
    } catch (error) {

      await queryRunner.rollbackTransaction();

      throw error;
      
    } finally {

      await queryRunner.release();

    }

  }

  // ENVIAR CORREO PARA INFORMAR ACTUALIZACION DE ORDEN DE SERVICIO
  private async notificationUpdateEmail(
    nombreCompleto: string, 
    locacion: string, 
    email: string[]
  ) {        

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">MODIFICACION ORDEN DE SERVICIO</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día <strong>${nombreCompleto}</strong>, se ha modificado una orden de servicio para el puesto <b>${locacion}</b>. <br><br>
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

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): modificacion en orden de servicio`;

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: email,
      subject: subject,
      htmlBody: html
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
        throw new InternalServerErrorException(`Error al enviar correo de notificacion al email ${email}, revisar correo si esta bien escrito`);
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
  
      // 🔥 Primero eliminamos la OrdenServicio
      await queryRunner.manager.remove(ordenServicio);
  
      // 🔥 Luego eliminamos el ID asociado
      if (ordenServicio.ordenServicioId) {
        await queryRunner.manager.remove(ordenServicio.ordenServicioId);
      }
  
      await queryRunner.commitTransaction();
      return { message: `Orden de servicio ${id} eliminada correctamente` };
  
    } catch (error) {
      await queryRunner.rollbackTransaction();
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

  async downloadOrdenServicioPdf(id: number){

    const ordenServicio = await this.findOne(id);

    return {
      pdfDoc: this.reporteOrdenServicioService.getReporteOrdenServicio(ordenServicio),
      title: `Orden-servicio-${ordenServicio.idOrdenServicio}`
    };    

  }
  
  async sendOrdenServicioPdf(id: number, enviarCorreoDto: EnviarCorreoDto){

    const ordenServicio = await this.findOne(id);

    const ordenServicioBuffer = await this.reporteOrdenServicioService.getBufferReporteOrdenServicio(ordenServicio);

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): PDF orden de servicio`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">ORDEN DE SERVICIO</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia PDF adjunto de orden de servicio <b>${ordenServicio.idOrdenServicio}</b>. <br><br>
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
          filename: `Orden-servicio-${ordenServicio.idOrdenServicio}.pdf`,
          content: ordenServicioBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
        throw new InternalServerErrorException(`Error al enviar correo con PDF orden de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }

  }

  private handleDbExceptions(error: any){
          
    if (error.errno === 1062)
        throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

  // ELIMINAR TODOS LAS ORDEN DE SERVICIO
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA ORDEN-SERVICO
  async deleteAllOrdenesServicio(){

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
