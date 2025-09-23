import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { EstadoApp } from '../../entities';
import { CreateEstadoAppDto, UpdateEstadoAppDto, PaginationDto } from '../../dto';

@Injectable()
export class EstadoAppService {

  private readonly logger = new Logger('EstadoAppService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(EstadoApp)
    private readonly estadoAppRepository: Repository<EstadoApp>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR ESTADO APP
  async create(createEstadoAppDto: CreateEstadoAppDto){
  
    try {
        
      const estadoApp = this.estadoAppRepository.create({
        nombre: createEstadoAppDto.nombre,
        descripcion: createEstadoAppDto.descripcion,
      });
      
      await this.estadoAppRepository.save(estadoApp);

      return estadoApp;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN ESTADO APP
  async findOne(id: number){
  
    const estadoApp = await this.estadoAppRepository.findOneBy({idEstadoApp: id});

    if(!estadoApp) throw new NotFoundException(`Estado app con id "${id}" no se ha encontrado`);

    return estadoApp;

  }
  
  // OBTENER UN ESTADO APP POR NOMBRE
  async findOneByName(name: string){
  
    const estadoApp = await this.estadoAppRepository.findOneBy({nombre: name});

    if(!estadoApp) throw new NotFoundException(`Estado app con nombre "${name}" no se ha encontrado`);

    return estadoApp;

  }
  
  // OBTENER TODOS LOS ESTADOS APP
  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const estadosOrden = await this.estadoAppRepository.find({
          take: limit,
          skip: offset,
          order: {
              nombre: 'ASC'
          }
      });
  
      return estadosOrden;

    }

    return await this.estadoAppRepository.find({
      order: {
        nombre: 'ASC'
      }
    });
  
  }
  
  // OBTENER TODOS LOS ESTADOS APP ACTIVOS
  async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {

    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const estadosOrden = await this.estadoAppRepository.find({
          take: limit,
          skip: offset,
          order: {
              nombre: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return estadosOrden;

    }
    
    return await this.estadoAppRepository.find({
      order: {
        nombre: 'ASC'
      },
      where: {
        estado: true
      }
    });

  }

  // EDITAR UN ESTADO APP
  async update(id: number, updateEstadoAppDto: UpdateEstadoAppDto) {
    
    const estadoApp = await this.estadoAppRepository.preload({idEstadoApp: id, ...updateEstadoAppDto});

    if (!estadoApp) throw new NotFoundException(`Estado app con id "${id}" no se ha encontrado`);

    try {
      
      await this.estadoAppRepository.save(estadoApp);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR UN ESTADO APP
  async remove(id: number) {
    
    const estadoApp = await this.findOne(id);
    
    try {

      await this.estadoAppRepository.remove(estadoApp);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`Estado app ${estadoApp.nombre} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS ESTADOS APP
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA ESTADO-APP
  async deleteAllTiposEstadosApp(){
  
    const query = this.estadoAppRepository.createQueryBuilder('estado-app');

    try {
      
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // CREAR ESTADO APP
  async createEstadoAppSeed(createEstadoAppDto: {
    nombre: string,
    descripcion: string,
    estado: boolean,
  }){
  
    try {
        
      const estadoApp = this.estadoAppRepository.create({
        nombre: createEstadoAppDto.nombre,
        descripcion: createEstadoAppDto.descripcion,
        estado: createEstadoAppDto.estado,
      });
      
      await this.estadoAppRepository.save(estadoApp);

      return estadoApp;

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

}
