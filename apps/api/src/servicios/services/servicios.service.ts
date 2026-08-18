import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';

import { Servicio, TipoDuracion, TipoHorarioDescripcion } from '../entities';
import { TipoTarifa } from '../../tarifas/entities';

import { CreateServicioDto, UpdateServicioDto } from '../dto';

import { TipoDuracionInterface } from '../interfaces/tipo-duracion.interface';
import { TipoHorarioInterface } from '../interfaces/tipo-horario.interface';
import { TipoTarifaInterface } from '../../tarifas/interfaces/tipo-tarifa.interface';

import { TipoServicioService } from './tipo-servicio.service';
import { TipoTarifaService } from '../../tarifas/services/tipo-tarifa.service';
import { TipoDuracionService } from './tipo-duracion.service';
import { TipoHorarioDescripcionService } from './tipo-horario-descripcion.service';
import { TipoHorarioService } from './tipo-horario.service';

@Injectable()
export class ServiciosService {

  private readonly logger = new Logger('ServiciosService');

  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta

  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
    private readonly tipoServicioService: TipoServicioService,
    private readonly tipoTarifaService: TipoTarifaService,
    private readonly tipoDuracionService: TipoDuracionService,
    private readonly tipoHorarioDescripcionService: TipoHorarioDescripcionService,
    private readonly tipoHorarioService: TipoHorarioService,
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createServicioDto: CreateServicioDto) {

    // OBTENER TIPO HORARIO DESCRIPCION
    const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOne(createServicioDto.idTipoHorarioDescripcion);

    // EL CAMPO DOMINICAL SOLO APLICA PARA HORARIO DIURNO O NOCTURNO, YA QUE SOLO TENEMOS TARIFAS POR HORA PARA ESOS CASOS
    this.validarDominical(createServicioDto.dominical, tipoHorarioDescripcion);

    if(tipoHorarioDescripcion.nombre == TipoHorarioInterface.DIA_COMPLETO){

      return await this.createServicioDiaCompleto(createServicioDto, tipoHorarioDescripcion);

    }

    // OBTENER TIPO DE SERVICIO
    const tipoServicio = await this.tipoServicioService.findOne(createServicioDto.idTipoServicio);

    // OBTENER TIPO DE DURACION
    const tipoDuracion = await this.tipoDuracionService.findOne(createServicioDto.idTipoDuracion);

    // OBTENER TIPO TARIFA
    const tipoTarifa = await this.tipoTarifaService.findOne(createServicioDto.idTipoTarifa);

    if (tipoHorarioDescripcion.nombre == TipoHorarioInterface.MIXTO) {

      if (tipoDuracion.descripcion != TipoDuracionInterface.FLEXIBLE) {
        throw new BadRequestException('El tipo de horario mixto solo puede tener una duracion flexible');
      }

      // PARA HORARIO MIXTO, EL TIPO DE TARIFA SOLO PUEDE SER POR HORA O POR SERVICIO
      this.validarTipoTarifaMixto(tipoTarifa);

      // Para mixto, la duracion flexible siempre es entre 1 y 24 horas (no dependen de un horario configurado)
      createServicioDto.horasMinimas = 1;
      createServicioDto.horasMaximas = 24;
      createServicioDto.horasFijas = null as any;

    } else {

      // Validaciones y normalizaciones según tipo de duración
      if (tipoDuracion.descripcion == TipoDuracionInterface.FIJA) {
        if (createServicioDto.horasFijas == null)
          throw new BadRequestException('El tipo de duracion requiere que se ingresen las horas fijas del servicio');

        if (createServicioDto.horasFijas < 1)
          throw new BadRequestException('El campo horas fijas debe ser mayor a 0');

        // Cuando es fija, limpiar las horas mínimas/máximas
        createServicioDto.horasMinimas = null as any;
        createServicioDto.horasMaximas = null as any;

      } else if (tipoDuracion.descripcion == TipoDuracionInterface.FLEXIBLE) {
        if (createServicioDto.horasMinimas == null)
          throw new BadRequestException('El tipo de duracion requiere que se ingresen las horas minimas');

        if (createServicioDto.horasMaximas == null)
          throw new BadRequestException('El tipo de duracion requiere que se ingresen las horas maximas');

        if (createServicioDto.horasMinimas < 1)
          throw new BadRequestException('El campo horas minimas debe ser mayor a 0');

        if (createServicioDto.horasMaximas < 1)
          throw new BadRequestException('El campo horas maximas debe ser mayor a 0');

        if (createServicioDto.horasMaximas < createServicioDto.horasMinimas)
          throw new BadRequestException('El campo horas maximas no puede ser menor que el campo horas minimas');

        // Cuando es flexible, limpiar la hora fija
        createServicioDto.horasFijas = null as any;

      }

      // VALIDAR REGLAS DE HORARIO DIURNO/NOCTURNO: limite de horas segun el horario vigente y tipo de tarifa permitido
      await this.validarReglasDiurnoNocturno(
        tipoHorarioDescripcion,
        tipoDuracion,
        tipoTarifa,
        createServicioDto.horasFijas,
        createServicioDto.horasMaximas,
      );

    }

    try {

      const servicio = this.servicioRepository.create({
        ...createServicioDto,
        idTipoServicio: tipoServicio,
        idTipoTarifa: tipoTarifa,
        idTipoDuracion: tipoDuracion,
        idTipoHorarioDescripcion: tipoHorarioDescripcion,
      });

      await this.servicioRepository.save(servicio);

      return servicio;

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

  private async createServicioDiaCompleto(createServicioDto: CreateServicioDto, tipoHorarioDescripcion: TipoHorarioDescripcion) {

    // OBTENER TIPO DE SERVICIO
    const tipoServicio = await this.tipoServicioService.findOne(createServicioDto.idTipoServicio);

    // OBTENER TIPO DE DURACION
    const tipoDuracion = await this.tipoDuracionService.findOneByName(TipoDuracionInterface.FIJA);

    // OBTENER TIPO TARIFA
    const tipoTarifa = await this.tipoTarifaService.findOne(createServicioDto.idTipoTarifa);

    // PARA DIA COMPLETO (24 HORAS), EL TIPO DE TARIFA SOLO PUEDE SER MENSUAL O POR TURNO
    this.validarTipoTarifaDiaCompleto(tipoTarifa);

    const horasFijas = 24;

    try {

      const servicio = this.servicioRepository.create({
        ...createServicioDto,
        idTipoServicio: tipoServicio,
        idTipoDuracion: tipoDuracion,
        idTipoHorarioDescripcion: tipoHorarioDescripcion,
        idTipoTarifa: tipoTarifa,
        horasFijas: horasFijas,
        horasMinimas: null as any,
        horasMaximas: null as any,
      });

      await this.servicioRepository.save(servicio);

      return servicio;

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

  // EL CAMPO DOMINICAL SOLO PUEDE SER VERDADERO CUANDO EL HORARIO ES DIURNO O NOCTURNO
  // (SON LOS UNICOS TIPOS DE HORARIO CON TARIFA POR HORA DIFERENCIADA DOMINICAL/FESTIVA)
  private validarDominical(dominical: boolean | undefined, tipoHorarioDescripcion: TipoHorarioDescripcion) {

    if (
      dominical &&
      tipoHorarioDescripcion.nombre != TipoHorarioInterface.DIURNO &&
      tipoHorarioDescripcion.nombre != TipoHorarioInterface.NOCTURNO
    ) {
      throw new BadRequestException('El campo dominical solo puede ser verdadero cuando el tipo de horario es diurno o nocturno');
    }

  }

  // PARA HORARIO MIXTO, EL TIPO DE TARIFA SOLO PUEDE SER POR HORA (el precio se calcula al crear la orden de servicio) O POR SERVICIO (precio manual)
  private validarTipoTarifaMixto(tipoTarifa: TipoTarifa) {

    if (tipoTarifa.nombre != TipoTarifaInterface.HORA && tipoTarifa.nombre != TipoTarifaInterface.SERVICIO) {
      throw new BadRequestException('Para el tipo de horario mixto, el tipo de tarifa debe ser por hora o por servicio');
    }

  }

  // PARA DIA COMPLETO (24 HORAS), EL TIPO DE TARIFA SOLO PUEDE SER MENSUAL O POR TURNO (el precio no se calcula, se ingresa manual)
  private validarTipoTarifaDiaCompleto(tipoTarifa: TipoTarifa) {

    if (tipoTarifa.nombre != TipoTarifaInterface.MES && tipoTarifa.nombre != TipoTarifaInterface.TURNO) {
      throw new BadRequestException('Para el tipo de horario dia completo (24 horas), el tipo de tarifa debe ser mensual o por turno');
    }

  }

  // PARA HORARIO DIURNO/NOCTURNO: VALIDA EL TIPO DE TARIFA PERMITIDO SEGUN LA DURACION Y EL LIMITE DE HORAS
  // SEGUN EL RANGO DEL HORARIO ACTUALMENTE VIGENTE (idTipoHorario SIN fechaVigenciaFin)
  private async validarReglasDiurnoNocturno(
    tipoHorarioDescripcion: TipoHorarioDescripcion,
    tipoDuracion: TipoDuracion,
    tipoTarifa: TipoTarifa,
    horasFijas?: number,
    horasMaximas?: number,
  ) {

    // OBTENER EL HORARIO VIGENTE (SIN FECHA DE FIN) PARA CONOCER SU RANGO MAXIMO DE HORAS
    const tipoHorarioVigente = await this.tipoHorarioService.findOneVigenteByName(tipoHorarioDescripcion.nombre);

    const horasMaximasHorario = this.calcularHorasEntre(tipoHorarioVigente.horaInicio, tipoHorarioVigente.horaFin);

    if (tipoDuracion.descripcion == TipoDuracionInterface.FIJA) {

      if (tipoTarifa.nombre != TipoTarifaInterface.MES && tipoTarifa.nombre != TipoTarifaInterface.TURNO) {
        throw new BadRequestException(`Para una duracion fija en el horario ${tipoHorarioDescripcion.nombre}, el tipo de tarifa debe ser mensual o por turno`);
      }

      if (horasFijas > horasMaximasHorario) {
        throw new BadRequestException(`El horario ${tipoHorarioDescripcion.nombre} vigente (${tipoHorarioVigente.horaInicio} - ${tipoHorarioVigente.horaFin}) permite maximo ${horasMaximasHorario} horas fijas`);
      }

    } else if (tipoDuracion.descripcion == TipoDuracionInterface.FLEXIBLE) {

      if (tipoTarifa.nombre != TipoTarifaInterface.HORA) {
        throw new BadRequestException(`Para una duracion flexible en el horario ${tipoHorarioDescripcion.nombre}, el tipo de tarifa debe ser por hora`);
      }

      if (horasMaximas > horasMaximasHorario) {
        throw new BadRequestException(`El horario ${tipoHorarioDescripcion.nombre} vigente (${tipoHorarioVigente.horaInicio} - ${tipoHorarioVigente.horaFin}) permite maximo ${horasMaximasHorario} horas, revise el campo horas maximas`);
      }

    }

  }

  // CALCULA LA CANTIDAD DE HORAS ENTRE DOS HORAS EN FORMATO 'HH:mm:ss', SOPORTANDO HORARIOS QUE CRUZAN LA MEDIANOCHE (NOCTURNO)
  private calcularHorasEntre(horaInicio: string, horaFin: string): number {

    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);

    const minutosInicio = (horaInicioH * 60) + horaInicioM;
    const minutosFin = (horaFinH * 60) + horaFinM;

    const diferenciaMinutos = minutosFin > minutosInicio
      ? minutosFin - minutosInicio
      : (1440 - minutosInicio) + minutosFin;

    return diferenciaMinutos / 60;

  }

  async findAll(paginationDto: PaginationDto) {
    
    const { limit = this.defaultLimit, offset = 0, pagination } = paginationDto;
    

    if (!pagination) {
      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      
      // Se hace la consulta de manera paginada
      const servicios = await this.servicioRepository.find({
        take: limit,
        skip: offset,
      });

      // Agrupar por tipo de servicio
      const serviciosAgrupados = servicios.reduce((acc, servicio) => {
        
        const tipo = servicio.idTipoServicio.nombre
    
        if (!acc[tipo]) {
          acc[tipo] = [];
        }
    
        acc[tipo].push(servicio);
    
        return acc;

      }, {} as Record<string, Servicio[]>);
    
  
      return serviciosAgrupados;

    }

    const servicios = await this.servicioRepository.find({});

    // Agrupar por tipo de servicio
    const serviciosAgrupados = servicios.reduce((acc, servicio) => {
      
      const tipo = servicio.idTipoServicio.nombre
  
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
  
      acc[tipo].push(servicio);
  
      return acc;

    }, {} as Record<string, Servicio[]>);

    return serviciosAgrupados;

  }
  
  async findAllActives(paginationDto: PaginationDto) {
    
    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [servicios, total] = await this.servicioRepository.findAndCount({
        take: limit,
        skip: offset,
        where: {
          estado: true
        }
      });
  
      return {
        data: servicios,
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
    
    const servicios = await this.servicioRepository.find({
      where: {
          estado: true
      }
    });

    return {
      data: servicios,
      pagination: {
        total: servicios.length,
        limit: servicios.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  async findAllByPeriodo(idPeriodo: number, paginationDto: PaginationDto){

    const queryBuilder = this.servicioRepository.createQueryBuilder('servicio')
      .leftJoin('servicio.tarifas', 'tarifa', 'tarifa.idPeriodo = :idPeriodo', { idPeriodo })
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.idTipoDuracion', 'tipoDuracion')
      .leftJoinAndSelect('servicio.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      .leftJoinAndSelect('servicio.idTipoTarifa', 'tipoTarifa')
      .where('tarifa.idTarifa IS NULL')
      .andWhere('servicio.estado = :estado', { estado: true })
      // LOS SERVICIOS DE HORARIO MIXTO CON TARIFA POR HORA NUNCA SE GUARDAN EN LA TABLA TARIFA
      // (su precio depende del valor hora y se calcula al crear la orden de servicio), por eso no se muestran aca.
      // COALESCE es necesario porque tipoTarifa.nombre puede ser NULL (servicios sin idTipoTarifa asignado, ej.
      // creados antes de PARTE 1): "NULL AND x" evalua a NULL, y "NOT NULL" tambien es NULL, lo que un WHERE
      // trata como falso y excluia por error servicios mixtos que ni siquiera son confirmados "por hora".
      .andWhere('NOT (tipoHorarioDescripcion.nombre = :nombreMixto AND COALESCE(tipoTarifa.nombre, \'\') = :nombreHora)', {
        nombreMixto: TipoHorarioInterface.MIXTO,
        nombreHora: TipoTarifaInterface.HORA,
      })
      .orderBy('servicio.codigo', 'ASC')

      if (paginationDto.pagination === PaginationOption.TRUE) {
        const { limit = this.defaultLimit, offset = 0 } = paginationDto;
        queryBuilder.take(limit).skip(offset);

        const [servicios, total] = await queryBuilder.getManyAndCount();

        return {
          data: servicios,
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

    const servicios = await queryBuilder.getMany();

    return {
      data: servicios,
      pagination: {
        total: servicios.length,
        limit: servicios.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  // OBTENER SERVICIOS DE HORARIO MIXTO CON TARIFA POR HORA PARA UN TIPO DE SERVICIO
  // Estos servicios nunca se guardan en la tabla tarifa (su precio se calcula al crear la orden de servicio, ya que
  // depende de cuantas horas del turno son diurnas y cuantas nocturnas), por eso hay que mostrarlos aparte cuando se
  // seleccionan los servicios disponibles para una orden en un periodo activo de facturacion
  async findAllMixtoPorHora(idTipoServicio: number) {

    return await this.servicioRepository.createQueryBuilder('servicio')
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.idTipoDuracion', 'tipoDuracion')
      .leftJoinAndSelect('servicio.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      .leftJoinAndSelect('servicio.idTipoTarifa', 'tipoTarifa')
      .where('tipoServicio.idTipoServicio = :idTipoServicio', { idTipoServicio })
      .andWhere('tipoHorarioDescripcion.nombre = :nombreMixto', { nombreMixto: TipoHorarioInterface.MIXTO })
      .andWhere('tipoTarifa.nombre = :nombreHora', { nombreHora: TipoTarifaInterface.HORA })
      .andWhere('servicio.estado = :estado', { estado: true })
      .getMany();

  }

  async findOne(id: number) {

    const servicio = await this.servicioRepository.findOne({
      where: {
        idServicio: id
      }
    });
        
    if(!servicio) throw new NotFoundException(`Servicio con id "${id}" no se ha encontrado`);

    return servicio;

  }

  async update(id: number, updateServicioDto: UpdateServicioDto) {

    const servicioExistente = await this.servicioRepository.findOne({
      where: { idServicio: id },
      relations: ['tarifas'],
    });

    if (!servicioExistente) throw new NotFoundException(`Servicio con id "${id}" no encontrado`);

    if (servicioExistente.tarifas && servicioExistente.tarifas.length > 0) {
      throw new BadRequestException(`El Servicio ${servicioExistente.descripcion} ya se encuentra asociado a una tarifa y no puede ser editado`);
    }

    const { idTipoServicio, idTipoTarifa, idTipoDuracion, idTipoHorarioDescripcion, ...servicioData } = updateServicioDto;

    const servicio = await this.servicioRepository.preload({idServicio: id, ...servicioData});

    if(!servicio) throw new NotFoundException(`Servicio con id "${id}" no encontrado`);

    if (updateServicioDto.idTipoTarifa){

      // OBTENER TIPO TARIFA
      const tipoTarifa = await this.tipoTarifaService.findOne(idTipoTarifa);

      servicio.idTipoTarifa = tipoTarifa;

    }

    if (updateServicioDto.idTipoServicio){
      
      // OBTENER TIPO DE SERVICIO
      const tipoServicio = await this.tipoServicioService.findOne(idTipoServicio);

      servicio.idTipoServicio = tipoServicio;
      
    }

    if (updateServicioDto.idTipoHorarioDescripcion){

      // OBTENER TIPO HORARIO DESCRIPCION
      const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOne(idTipoHorarioDescripcion);

      servicio.idTipoHorarioDescripcion = tipoHorarioDescripcion;

    }

    // EL CAMPO DOMINICAL SOLO APLICA PARA HORARIO DIURNO O NOCTURNO, YA QUE SOLO TENEMOS TARIFAS POR HORA PARA ESOS CASOS
    this.validarDominical(servicio.dominical, servicio.idTipoHorarioDescripcion);

    if (servicio.idTipoHorarioDescripcion.nombre == TipoHorarioInterface.DIA_COMPLETO) {

      // OBTENER TIPO DE DURACION
      const tipoDuracion = await this.tipoDuracionService.findOneByName(TipoDuracionInterface.FIJA);

      servicio.idTipoDuracion = tipoDuracion;
      servicio.horasFijas = 24;
      servicio.horasMinimas = null;
      servicio.horasMaximas = null;

      // PARA DIA COMPLETO (24 HORAS), EL TIPO DE TARIFA SOLO PUEDE SER MENSUAL O POR TURNO
      this.validarTipoTarifaDiaCompleto(servicio.idTipoTarifa);

    } else if (servicio.idTipoHorarioDescripcion.nombre == TipoHorarioInterface.MIXTO) {

      // OBTENER TIPO DE DURACION
      const tipoDuracion = await this.tipoDuracionService.findOneByName(TipoDuracionInterface.FLEXIBLE);

      servicio.idTipoDuracion = tipoDuracion;
      servicio.horasMinimas = 1;
      servicio.horasMaximas = 24;
      servicio.horasFijas = null;

      // PARA HORARIO MIXTO, EL TIPO DE TARIFA SOLO PUEDE SER POR HORA O POR SERVICIO
      this.validarTipoTarifaMixto(servicio.idTipoTarifa);

    } else {

      // DIURNO O NOCTURNO
      if (updateServicioDto.idTipoDuracion) {

        // OBTENER TIPO DE DURACION
        const tipoDuracion = await this.tipoDuracionService.findOne(idTipoDuracion);

        if (tipoDuracion.descripcion == TipoDuracionInterface.FIJA) {
          if (updateServicioDto.horasFijas == null)
            throw new BadRequestException('El tipo de duracion requiere que se ingresen las horas fijas del servicio');

          if (updateServicioDto.horasFijas < 1)
            throw new BadRequestException('El campo horas fijas debe ser mayor a 0');

          servicio.idTipoDuracion = tipoDuracion;
          servicio.horasFijas = updateServicioDto.horasFijas;
          servicio.horasMinimas = null;
          servicio.horasMaximas = null;

        } else if (tipoDuracion.descripcion == TipoDuracionInterface.FLEXIBLE) {
          if (updateServicioDto.horasMinimas == null)
            throw new BadRequestException('El tipo de duracion requiere que se ingresen las horas minimas');

          if (updateServicioDto.horasMaximas == null)
            throw new BadRequestException('El tipo de duracion requiere que se ingresen las horas maximas');

          if (updateServicioDto.horasMinimas < 1)
            throw new BadRequestException('El campo horas minimas debe ser mayor a 0');

          if (updateServicioDto.horasMaximas < 1)
            throw new BadRequestException('El campo horas maximas debe ser mayor a 0');

          if (updateServicioDto.horasMaximas < updateServicioDto.horasMinimas)
            throw new BadRequestException('El campo horas maximas no puede ser menor que el campo horas minimas');

          servicio.idTipoDuracion = tipoDuracion;
          servicio.horasMinimas = updateServicioDto.horasMinimas;
          servicio.horasMaximas = updateServicioDto.horasMaximas;
          servicio.horasFijas = null;

        }

      }

      // VALIDAR REGLAS DE HORARIO DIURNO/NOCTURNO: limite de horas segun el horario vigente y tipo de tarifa permitido
      await this.validarReglasDiurnoNocturno(
        servicio.idTipoHorarioDescripcion,
        servicio.idTipoDuracion,
        servicio.idTipoTarifa,
        servicio.horasFijas,
        servicio.horasMaximas,
      );

    }

    try {

      await this.servicioRepository.save(servicio);

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {
    
    const servicio = await this.findOne(id);
    
    try {

      await this.servicioRepository.remove(servicio);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Servicio ${servicio.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  private handleDbExceptions(error: any){
      
    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

  // ELIMINAR TODOS LOS SERVICIOS 
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA SERVICIOS
  async deleteAllServicios(){
  
    const query = this.servicioRepository.createQueryBuilder('servicio');

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
