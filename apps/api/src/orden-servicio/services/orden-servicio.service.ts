import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';

import { User } from '../../users/entities/user.entity';
import { EstadoOrdenServicio as EstadoOrdenEntity} from "../../common/entities";
import { SendMailOptions } from '../../common/services/email/email.service';

import { EstadoOrdenServicioService, EmailService } from '../../common/services';
import { LocacionService } from '../../clientes/services';
import { TarifasService } from '../../tarifas/services';
import { ServiciosService, TipoHorarioService } from '../../servicios/services';
import { PersonalService } from '../../personal/services';

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
  ValidarIdOrdenServicioDto,
  ValidarFechasOrdenServicioDto,
  ValidarHorarioServicioDto, 
  PrecioOrdenDto,
  ValidarEmpleadosDisponiblesDto,
  ValidarRangoHorarioPersonalOrdenDto,
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

    // OBTENER NUMERO DE ORDEN O ID DE LA ORDEN DE SERVICIO
    const numeroOrden = await this.ordenServicioIdRepository.findOneBy({
      descripcionId: createOrdenServicioDto.numeroOrdenServicio
    });

    if (numeroOrden){
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

      // Crear la orden sin los servicios primero
      const ordenServicio = queryRunner.manager.create(OrdenServicio, {
        ordenServicioId: numeroOrden,
        idUsuarioCreacion: user,
        idEstadoOrdenServicio: estadoOrdenServicio,
        idLocacion: locacion,
        fechaInicio: fechaInicioOrden,
        fechaFin: createOrdenServicioDto.fechaFin ? fechaFinOrden : null,
        precioTotal: createOrdenServicioDto.precioTotal,
        fechaCreacion: fechaCreacionOrden,
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
        nombreServicios,
        fechaInicioOrden.toISOString().split('T')[0],
        fechaFinOrden != null ? fechaFinOrden.toISOString().split('T')[0] : " ",
        estadoOrdenServicio.descripcion, 
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
    servicios: string[], 
    fechaInicio: string,
    fechaFin: string,
    estadoOrden: string,
    email: string[]
  ) {        
  
      const html = `
      <div style="background-color: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); padding: 20px; max-width: 600px; margin: 20px auto; text-align: center; font-family: 'Poppins', sans-serif;">
          <h2 style="margin-bottom: 20px; color: #333; font-weight: 700;">CORREO INFORMATIVO VIDELCA - GEVID 👮‍♂️</h2>
          <p style="line-height: 1.6; margin: 10px 0; color: #555;">Buen día ${nombreCompleto}, se ha creado una orden de servicio para la locacion ${locacion}</p>
          <p style="line-height: 1.6; margin: 10px 0; color: #555;">los servicios para esta orden de servicio son: ${servicios.join(', ')}</p>
          <p style="line-height: 1.6; margin: 10px 0; color: #555;">Fecha de inicio de la orden: ${fechaInicio}</p>
          <p style="line-height: 1.6; margin: 10px 0; color: #555;">Fecha de fin de la orden: ${fechaFin}</p>
          <p style="line-height: 1.6; margin: 10px 0; color: #555;">Estado de la orden: ${estadoOrden}</p>
          <p style="line-height: 1.6; margin: 10px 0; color: #555;">Si usted no brindo su correo para el sistema de notificaciones, omiste este mensaje.</p>
          <p style="line-height: 1.6; margin: 10px 0; color: #555;">Saludos,</p>
          <p style="line-height: 1.6; margin: 10px 0; color: #555;">El equipo de GEVID</p>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" alt="videlca" style="width: 100%; height: auto; margin-top: 20px; border-radius: 5px;">
      </div>
      `;
      
      const subject = `CORREO INFORMATIVO VIDELCA - GEVID 👮‍♂️`;
  
      // Enviamos correo para notificar al usuario
      const isEmailSend = await this.sendEmail(email, html, subject);
  
      if (!isEmailSend){
          throw new BadGatewayException(`Error al enviar correo de notificacion al email ${email}, revisar correo`);
      }

  }

  // EMAIL PARA NOTIFICAR AL USUARIO
  async sendEmail(email: string[], html: string, subject: string) {
  
      // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
      const options: SendMailOptions = {
          to: email,
          subject: subject,
          htmlBody: html
      }
      
      const isSend = await this.emailService.sendEmail(options);
      
      return isSend; 

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

    console.log(idServicio);

    //! VALIDACION HORARIOS

    // Validar que la tarifa exista
    // const tarifa = await this.tarifasService.findOne(idTarifa);

    const servicio = await this.servicioService.findOne(idServicio);
    

    console.log(servicio.codigo);

    const tipohorarioDescripcion = servicio?.idTipoHorarioDescripcion;

    console.log(tipohorarioDescripcion.nombre);

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

  async obtenerPrecio(validarPrecioOrdenDto: PrecioOrdenDto){

    const { idTarifa, horaInicio, horaFin, fechaInicio, fechaFin } = validarPrecioOrdenDto;

    // Validar que la tarifa exista
    const tarifa = await this.tarifasService.findOne(idTarifa);

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
  
    for (const emp of validarRangoHorarioPersonalOrdenDto.personal) {

      const horaInicioEmpleado = this.parseHour(emp.horaInicio);
      const horaFinEmpleado = this.parseHour(emp.horaFin);
      const duracionEmp = this.getDuration(horaInicioEmpleado, horaFinEmpleado);

      if (horaInicioEmpleado == horaFinEmpleado){
        throw new BadRequestException(`Hora incio y fin de un empleado no puede ser la misma`);
      }
  
      // Validar que esté dentro del rango de la orden
      // Caso simple: orden normal (ej: 6-15)
      if (duracionServicio < 24) {
        if (!(horaInicioEmpleado >= horaInicio && horaFinEmpleado <= horaFin)) {
          throw new BadRequestException(`La duracion del horario de los empleados debe estar en el rango de la orden`);
          //return false; // fuera de rango
        }
      }
      // Caso nocturno o 24h → permitimos más flexibilidad
      // (se puede refinar según tu necesidad)
  
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
      .innerJoin(OrdenServicio, "os", "ost.idOrdenServicio = os.idOrdenServicio");

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

  // update(id: number, updateOrdenServicioDto: UpdateOrdenServicioDto) {
  //   return `This action updates a #${id} ordenServicio`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} ordenServicio`;
  // }

  async anularId(anularIdDto: AnularIdOrdenServicioDto){

    try {

      const idExistente = await this.ordenServicioIdRepository.findOne({
        where: {
          descripcionId: anularIdDto.descripcionId
        },
        relations: {
          ordenServicio: true
        }
      });

      if (idExistente) {
        
        // Si existe y tiene orden asociada, error
        if (idExistente.ordenServicio) {
          throw new BadRequestException(`No se puede anular el ID "${anularIdDto.descripcionId}" porque tiene una orden asociada`);
        }

        // Si existe pero no tiene orden, también es error (ya está anulado)
        throw new BadRequestException(`El ID "${anularIdDto.descripcionId}" ya existe`);
      }

      const idAnulado = this.ordenServicioIdRepository.create({
        ...anularIdDto,
        anulado: true
      });

      await this.ordenServicioIdRepository.save(idAnulado);
      
    } catch (error) {

      this.handleDbExceptions(error);
      
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
