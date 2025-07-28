import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';

import { User } from '../../users/entities/user.entity';

import { EstadoOrdenServicioService } from '../../common/services';
import { LocacionService } from '../../clientes/services';
import { TarifasService } from '../../tarifas/services';

import { EstadoOrdenServicio } from '../../common/interfaces/estado-orden-servicio.interface';

import { OrdenServicio } from '../entities';
import { CreateOrdenServicioDto, TercerPasoDto } from '../dto';

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

    let fechaFinOrden = new Date();

    // Validar que las fechas sean lógicamente correcto
    if (createOrdenServicioDto.fechaFin) {
        
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
    let estadoOrdenServicio;

    if( fechaInicioOrden > fechaCreacionOrden ){
     
      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.PROGRAMADO);
      
    }
    
    if( fechaInicioOrden == fechaCreacionOrden ){
     
      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.INICIADO);
      
    }

    if( fechaInicioOrden < fechaCreacionOrden ){

      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.INICIADO);

    }

    if (createOrdenServicioDto.fechaFin && fechaFinOrden < fechaCreacionOrden) {
     
      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.TERMINADO);
    
    }

    if (createOrdenServicioDto.fechaFin && fechaFinOrden == fechaCreacionOrden) {

      estadoOrdenServicio = await this.estadoOrdenService.findOneByName(EstadoOrdenServicio.TERMINADO);
    
    }


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
