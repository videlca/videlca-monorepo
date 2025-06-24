import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { TipoIdentificacion } from '../../entities';
import { CreateTipoDto, UpdatetipoDto, PaginationDto } from '../../dto';

@Injectable()
export class TipoIdentificacionService {

  private readonly logger = new Logger('TipoIdentificacionService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoIdentificacion)
    private readonly tipoIdRepository: Repository<TipoIdentificacion>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO ID
  async create(createTipoIdDto: CreateTipoDto){
  
    try {
        
      const tipoId = this.tipoIdRepository.create({
        descripcion: createTipoIdDto.descripcion,
      });
      
      await this.tipoIdRepository.save(tipoId);

      return tipoId;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO ID
  async findOne(id: number){
  
    const tipoId = await this.tipoIdRepository.findOneBy({idTipoIdentificacion: id});

    if(!tipoId) throw new NotFoundException(`Tipo de Identificacion con id "${id}" no se ha encontrado`);

    return tipoId;

  }
  
  // OBTENER UN TIPO ID por nombre
  async findOneByName(name: string){
  
    const tipoId = await this.tipoIdRepository.findOneBy({descripcion: name});

    if(!tipoId) throw new NotFoundException(`Tipo de Identificacion con nombre "${name}" no se ha encontrado`);

    return tipoId;

  }
  
  // OBTENER TODOS LOS TIPO ID
  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposId = await this.tipoIdRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return tiposId;

    }

    return await this.tipoIdRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });
  
  }
  
  // OBTENER TODOS LOS TIPO ID ACTIVOS
  async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {

    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposId = await this.tipoIdRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return tiposId;

    }
    
    return await this.tipoIdRepository.find({
      order: {
        descripcion: 'ASC'
      },
      where: {
        estado: true
      }
    });

  }

  // EDITAR UN TIPO ID 
  async update(id: number, updateTipoIdDto: UpdatetipoDto) {
    
    const tipoId = await this.tipoIdRepository.preload({idTipoIdentificacion: id, ...updateTipoIdDto});

    if (!tipoId) throw new NotFoundException(`Tipo de Identificacion con id "${id}" no se ha encontrado`);

    try {
      
      await this.tipoIdRepository.save(tipoId);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR UN TIPO ID
  async remove(id: number) {
    
    const tipoId = await this.findOne(id);
    
    try {

      await this.tipoIdRepository.remove(tipoId);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El tipo id ${tipoId.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS TIPOS ID
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-ID
  async deleteAllTiposId(){
  
    const query = this.tipoIdRepository.createQueryBuilder('tipo-id');

    try {
      
      return await query
        .delete()
        .where({})
        .execute();

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
