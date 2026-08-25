import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';

import { Servicio, TipoDuracion, TipoHorarioDescripcion, TipoServicio } from '../entities';
import { TipoTarifa } from '../../tarifas/entities';

import { CreateServicioDto, UpdateServicioDto } from '../dto';

import { TipoDuracionInterface } from '../interfaces/tipo-duracion.interface';
import { TipoHorarioInterface } from '../interfaces/tipo-horario.interface';
import { TipoServicioInterface } from '../interfaces/tipo-servicio.interface';
import { TipoTarifaInterface } from '../../tarifas/interfaces/tipo-tarifa.interface';

import { TipoServicioService } from './tipo-servicio.service';
import { TipoTarifaService } from '../../tarifas/services/tipo-tarifa.service';
import { TipoDuracionService } from './tipo-duracion.service';
import { TipoHorarioDescripcionService } from './tipo-horario-descripcion.service';

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
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createServicioDto: CreateServicioDto) {

    // OBTENER TIPO DE SERVICIO
    const tipoServicio = await this.tipoServicioService.findOne(createServicioDto.idTipoServicio);

    const { tipoTarifa, tipoDuracion, tipoHorarioDescripcion, horasFijas, dominical, armado } =
      await this.resolverCamposServicio({
        tipoServicio,
        idTipoTarifaSolicitado: createServicioDto.idTipoTarifa,
        idTipoDuracionSolicitado: createServicioDto.idTipoDuracion,
        idTipoHorarioDescripcionSolicitado: createServicioDto.idTipoHorarioDescripcion,
        dominicalSolicitado: createServicioDto.dominical,
        armadoSolicitado: createServicioDto.armado,
      });

    try {

      const servicio = this.servicioRepository.create({
        codigo: createServicioDto.codigo,
        descripcion: createServicioDto.descripcion,
        idTipoServicio: tipoServicio,
        idTipoTarifa: tipoTarifa,
        idTipoDuracion: tipoDuracion,
        idTipoHorarioDescripcion: tipoHorarioDescripcion,
        horasFijas,
        dominical,
        armado,
      });

      await this.servicioRepository.save(servicio);

      return servicio;

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

  // RESUELVE idTipoTarifa, idTipoDuracion, idTipoHorarioDescripcion, horasFijas, dominical y armado
  // segun la logica de negocio definida para cada tipo de servicio:
  //
  // MONITOREO DE ALARMAS -> tipo tarifa mensual, horario dia completo, 24 horas fijas, dominical=false, armado=false
  //
  // VIGILANCIA Y ESCOLTA:
  //   - tipo tarifa POR SERVICIO -> horario dia completo, 24 horas fijas, dominical=false, armado=false
  //   - tipo tarifa MENSUAL o POR TURNO -> el usuario elige la duracion (8, 12 o 24 horas):
  //       - 24 horas -> horario dia completo (forzado)
  //       - 8 o 12 horas -> el usuario elige el horario (diurno o nocturno)
  //     dominical: mensual siempre false, por turno lo elige el usuario
  //     armado: lo elige el usuario
  private async resolverCamposServicio(params: {
    tipoServicio: TipoServicio,
    idTipoTarifaSolicitado: number,
    idTipoDuracionSolicitado?: number,
    idTipoHorarioDescripcionSolicitado?: number,
    dominicalSolicitado?: boolean,
    armadoSolicitado?: boolean,
  }): Promise<{
    tipoTarifa: TipoTarifa,
    tipoDuracion: TipoDuracion,
    tipoHorarioDescripcion: TipoHorarioDescripcion,
    horasFijas: number,
    dominical: boolean,
    armado: boolean,
  }> {

    const tipoTarifa = await this.tipoTarifaService.findOne(params.idTipoTarifaSolicitado);

    if (params.tipoServicio.nombre == TipoServicioInterface.MONITOREO_ALARMAS) {

      if (tipoTarifa.nombre != TipoTarifaInterface.MES) {
        throw new BadRequestException('Para el tipo de servicio Monitoreo de alarmas, el tipo de tarifa debe ser mensual');
      }

      const tipoDuracion = await this.tipoDuracionService.findOneByName(TipoDuracionInterface.HRS_24);
      const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOneByName(TipoHorarioInterface.DIA_COMPLETO);

      return { tipoTarifa, tipoDuracion, tipoHorarioDescripcion, horasFijas: 24, dominical: false, armado: false };

    }

    // VIGILANCIA Y ESCOLTA

    if (tipoTarifa.nombre == TipoTarifaInterface.SERVICIO) {

      const tipoDuracion = await this.tipoDuracionService.findOneByName(TipoDuracionInterface.HRS_24);
      const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOneByName(TipoHorarioInterface.DIA_COMPLETO);

      return { tipoTarifa, tipoDuracion, tipoHorarioDescripcion, horasFijas: 24, dominical: false, armado: false };

    }

    if (tipoTarifa.nombre == TipoTarifaInterface.MES || tipoTarifa.nombre == TipoTarifaInterface.TURNO) {

      if (!params.idTipoDuracionSolicitado) {
        throw new BadRequestException('El campo tipo duracion es obligatorio para el tipo de tarifa mensual o por turno');
      }

      const tipoDuracion = await this.tipoDuracionService.findOne(params.idTipoDuracionSolicitado);
      const horasFijas = this.obtenerHorasFijasPorTipoDuracion(tipoDuracion);

      let tipoHorarioDescripcion: TipoHorarioDescripcion;

      if (tipoDuracion.descripcion == TipoDuracionInterface.HRS_24) {

        tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOneByName(TipoHorarioInterface.DIA_COMPLETO);

      } else {

        if (!params.idTipoHorarioDescripcionSolicitado) {
          throw new BadRequestException('El campo tipo horario descripcion es obligatorio cuando la duracion es de 8 o 12 horas');
        }

        tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOne(params.idTipoHorarioDescripcionSolicitado);

        if (tipoHorarioDescripcion.nombre != TipoHorarioInterface.DIURNO && tipoHorarioDescripcion.nombre != TipoHorarioInterface.NOCTURNO) {
          throw new BadRequestException('Para una duracion de 8 o 12 horas, el tipo de horario debe ser diurno o nocturno');
        }

      }

      const dominical = tipoTarifa.nombre == TipoTarifaInterface.MES
        ? false
        : (params.dominicalSolicitado ?? false);

      return { tipoTarifa, tipoDuracion, tipoHorarioDescripcion, horasFijas, dominical, armado: params.armadoSolicitado ?? false };

    }

    throw new BadRequestException(`El tipo de tarifa ${tipoTarifa.nombre} no es valido para el tipo de servicio ${params.tipoServicio.nombre}`);

  }

  // TRADUCE EL TIPO DE DURACION (8, 12 o 24 HORAS) AL VALOR NUMERICO DE HORAS FIJAS DEL SERVICIO
  private obtenerHorasFijasPorTipoDuracion(tipoDuracion: TipoDuracion): number {

    switch (tipoDuracion.descripcion) {
      case TipoDuracionInterface.HRS_24: return 24;
      case TipoDuracionInterface.HRS_12: return 12;
      case TipoDuracionInterface.HRS_8: return 8;
      default:
        throw new BadRequestException(`El tipo de duracion "${tipoDuracion.descripcion}" no es valido`);
    }

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

    const { idTipoServicio, idTipoTarifa, idTipoDuracion, idTipoHorarioDescripcion, dominical, armado, horasFijas, ...servicioData } = updateServicioDto;

    const tipoServicio = idTipoServicio
      ? await this.tipoServicioService.findOne(idTipoServicio)
      : servicioExistente.idTipoServicio;

    const camposResueltos = await this.resolverCamposServicio({
      tipoServicio,
      idTipoTarifaSolicitado: idTipoTarifa ?? servicioExistente.idTipoTarifa.idTipoTarifa,
      idTipoDuracionSolicitado: idTipoDuracion ?? servicioExistente.idTipoDuracion.idTipoDuracion,
      idTipoHorarioDescripcionSolicitado: idTipoHorarioDescripcion ?? servicioExistente.idTipoHorarioDescripcion.idTipoHorarioDescripcion,
      dominicalSolicitado: dominical ?? servicioExistente.dominical,
      armadoSolicitado: armado ?? servicioExistente.armado,
    });

    const servicio = await this.servicioRepository.preload({
      idServicio: id,
      ...servicioData,
      idTipoServicio: tipoServicio,
      idTipoTarifa: camposResueltos.tipoTarifa,
      idTipoDuracion: camposResueltos.tipoDuracion,
      idTipoHorarioDescripcion: camposResueltos.tipoHorarioDescripcion,
      horasFijas: camposResueltos.horasFijas,
      dominical: camposResueltos.dominical,
      armado: camposResueltos.armado,
    });

    if(!servicio) throw new NotFoundException(`Servicio con id "${id}" no encontrado`);

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
