import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';

import { User } from '../../users/entities/user.entity';
import { EstadoOrdenServicio as EstadoOrdenEntity} from "../../common/entities";

import { EstadoOrdenServicioService } from '../../common/services';
import { LocacionService } from '../../clientes/services';
import { TarifasService } from '../../tarifas/services';
import { TipoHorarioService } from '../../servicios/services';

import { EstadoOrdenServicio } from '../../common/interfaces/estado-orden-servicio.interface';
import { TipoDuracionInterface } from '../../servicios/interfaces/tipo-duracion.interface';
import { TipoHorarioInterface } from 'src/servicios/interfaces/tipo-horario.interface';
import { TipoTarifaInterface } from '../../tarifas/interfaces/tipo-tarifa.interface';

import { OrdenServicio } from '../entities';
import { CreateOrdenServicioDto, TercerPasoDto, PrecioOrdenDto } from '../dto';

@Injectable()
export class OrdenServicioService {

  private readonly logger = new Logger('OrdenServicioService');
          
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
      @InjectRepository(OrdenServicio)
      private readonly ordenServicioRepository: Repository<OrdenServicio>,
      private readonly estadoOrdenService: EstadoOrdenServicioService,
      private readonly locacionService: LocacionService,
      private readonly tarifasService: TarifasService,
      private readonly tipoHorarioService: TipoHorarioService,
      private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createOrdenServicioDto: CreateOrdenServicioDto, user: User) {

    // OBTENER LOCACION
    const locacion = await this.locacionService.findOne(createOrdenServicioDto.idLocacion);

    // OBTENER TARIFA
    const tarifa = await this.tarifasService.findOne(createOrdenServicioDto.idTarifa);
    
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

    // envio de correos que se tengan registrados en la locacion

    // validar si la orden requiere personal y agregar el personal si es necesario

    try {

      const ordenServicio = this.ordenServicioRepository.create({
        ...createOrdenServicioDto,
        idUsuarioCreacion: user,
        idEstadoOrdenServicio: estadoOrdenServicio,
        idLocacion: locacion,
        idTarifa: tarifa,
        fechaInicio: fechaInicioOrden,
        fechaFin: createOrdenServicioDto.fechaFin ? fechaFinOrden : null,
        fechaCreacion: fechaCreacionOrden,
      });

      await this.ordenServicioRepository.save(ordenServicio);

      return ordenServicio;
      
    } catch (error) {

      this.handleDbExceptions(error);
      
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

  async validacionHorarios(tercerPasoDto: TercerPasoDto){

    const { idTarifa, horaInicio, horaFin, horasDescanso = 0, fechaInicio, fechaFin } = tercerPasoDto;

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

    //! VALIDACION HORARIOS

    // Validar que la tarifa exista
    const tarifa = await this.tarifasService.findOne(idTarifa);

    const servicio = tarifa.idServicio;

    const tipohorarioDescripcion = servicio.idTipoHorarioDescripcion;

    if (tipohorarioDescripcion.nombre === TipoHorarioInterface.DIA_COMPLETO) {

      // Si el tipo de horario es 24 horas, no se valida el horario
      return;

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

    if (tercerPasoDto.horasDescanso != null && tercerPasoDto.horasDescanso > 0) {

      // Si hay horas de descanso, se resta la duracion del servicio
      duracionServicio -= tercerPasoDto.horasDescanso;

      if (duracionServicio <= 0) {

        throw new BadRequestException(`La duracion del servicio no puede ser menor o igual a 0 horas`);

      }

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

    const { idTarifa, horaInicio, horaFin, horasDescanso = 0, fechaInicio, fechaFin, cantidadPersonal } = validarPrecioOrdenDto;

    // Validar que la tarifa exista
    const tarifa = await this.tarifasService.findOne(idTarifa);

    if (!fechaFin) {
  
      return {
        "message": "La orden de servicio es indefinida, el precio se calculara al momento de hacer la liquidacion o al finalizar el servicio",
        "precio": tarifa.precioTotal
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


    let duracionServicio = await this.calcularDuracionServicio(horaInicio, horaFin) - horasDescanso;

    let precioTotal: number;  

    // VALIDAR SI SE ESTA PIDIENDO SERVICIO POR UN MES EXACTO, ES DECIR TODO ENERO, TODO FEBRERO, ...
    if (this.esMesCompleto(fechaInicioOrden, fechaFinOrden)) {

      // SI EL TIPO DE TARIFA ES POR MES
      if (tarifa.idTipoTarifa.nombre === TipoTarifaInterface.MES){

        precioTotal = tarifa.precioTotal;

      }

       // SI ES SERVICIO UNICO
       else if (tarifa.idTipoTarifa.nombre === TipoTarifaInterface.SERVICIO_UNICO){

        precioTotal = tarifa.precioTotal * diaFin;

       }

      // SI ES TIPO TURNO
      else {

        const precioTurnoHora = tarifa.precioTotal / tarifa.idTipoTarifa.cantidadTiempo;

        const precioTurnoTotalDia = precioTurnoHora * duracionServicio;

        precioTotal = precioTurnoTotalDia * diaFin;

      }


      return {
        "message": "El servicio es por un mes completo exacto",
        "precio": precioTotal
      }

    }

    // VALIDACIONES POR DIA
    const duracionServicioDias = this.calcularDuracionServicioDias(fechaInicioOrden, fechaFinOrden);

    // SI EL TIPO DE TARIFA ES POR MES
    if (tarifa.idTipoTarifa.nombre === TipoTarifaInterface.MES){

      const precioServicioDia = tarifa.precioTotal / tarifa.idTipoTarifa.cantidadTiempo;

      precioTotal = precioServicioDia * duracionServicioDias;

    }
    
    // SI ES SERVICIO UNICO
    else if (tarifa.idTipoTarifa.nombre === TipoTarifaInterface.SERVICIO_UNICO){

      precioTotal = tarifa.precioTotal * duracionServicioDias;

    }
    
    // SI ES TIPO TURNO
    else {

      const precioTurnoHora = tarifa.precioTotal / tarifa.idTipoTarifa.cantidadTiempo;

      const precioTurnoTotalDia = precioTurnoHora * duracionServicio;

      precioTotal = precioTurnoTotalDia * duracionServicioDias;

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

  // update(id: number, updateOrdenServicioDto: UpdateOrdenServicioDto) {
  //   return `This action updates a #${id} ordenServicio`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} ordenServicio`;
  // }

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
