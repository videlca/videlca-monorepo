import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';

import { User } from '../../users/entities/user.entity';
import { EstadoOrdenServicio as EstadoOrdenEntity} from "../../common/entities";

import { EstadoOrdenServicioService } from '../../common/services';
import { LocacionService } from '../../clientes/services';
import { TarifasService } from '../../tarifas/services';
import { TipoHorarioService } from '../../servicios/services';
import { PersonalService } from '../../personal/services';

import { EstadoOrdenServicio } from '../../common/interfaces/estado-orden-servicio.interface';
import { TipoDuracionInterface } from '../../servicios/interfaces/tipo-duracion.interface';
import { TipoHorarioInterface } from 'src/servicios/interfaces/tipo-horario.interface';
import { TipoTarifaInterface } from '../../tarifas/interfaces/tipo-tarifa.interface';
import { AnularIdOrdenServicioDto } from '../dto/orden-servicio/anular-id-orden-servicio.dto';

import { 
  OrdenServicio,
  OrdenServicioId,
  OrdenServicioTarifa,
  ProgramacionPersonal
} from '../entities';

import { 
  CreateOrdenServicioDto, 
  TercerPasoDto, 
  PrecioOrdenDto 
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
      private readonly personalService: PersonalService,
      private readonly estadoOrdenService: EstadoOrdenServicioService,
      private readonly locacionService: LocacionService,
      private readonly tarifasService: TarifasService,
      private readonly tipoHorarioService: TipoHorarioService,
              private readonly dataSource: DataSource,
      private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
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

      for (const servicio of servicios) {
              
        // OBTENER TARIFA
        const tarifa = await this.tarifasService.findOne(servicio.idTarifa);
        
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
      
      await queryRunner.commitTransaction();
      
      return savedOrdenServicio;
      
    } catch (error) {

      await queryRunner.rollbackTransaction();

      throw error;
      
    } finally {

      await queryRunner.release();

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

    const { idTarifa, horaInicio, horaFin, fechaInicio, fechaFin } = tercerPasoDto;

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
