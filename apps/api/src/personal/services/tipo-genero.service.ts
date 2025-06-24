import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';

import { TipoGenero } from '../entities';
import { CreateTipoDto, UpdatetipoDto } from '../../common/dto';

@Injectable()
export class TipoGeneroService {

  private readonly logger = new Logger('TipoGeneroService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoGenero)
    private readonly tipoGeneroRepository: Repository<TipoGenero>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO GENERO
  async create(createTipoGenero: CreateTipoDto){
  
    try {
        
      const tipoGenero = this.tipoGeneroRepository.create({
        descripcion: createTipoGenero.descripcion,
      });
      
      await this.tipoGeneroRepository.save(tipoGenero);

      return tipoGenero;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO GENERO
  async findOne(id: number){
  
    const tipoGenero = await this.tipoGeneroRepository.findOneBy({idTipoGenero: id});

    if(!tipoGenero) throw new NotFoundException(`Tipo de Genero con id "${id}" no se ha encontrado`);

    return tipoGenero;

  }
  
  // OBTENER UN TIPO GENERO por nombre
  async findOneByName(name: string){
  
    const tipoGenero = await this.tipoGeneroRepository.findOneBy({descripcion: name});

    if(!tipoGenero) throw new NotFoundException(`Tipo de Genero con nombre "${name}" no se ha encontrado`);

    return tipoGenero;

  }
  
  // OBTENER TODOS LOS TIPO GENERO
  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposGenero = await this.tipoGeneroRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return tiposGenero;

    }

    return await this.tipoGeneroRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });
  
  }
  
  // OBTENER TODOS LOS TIPO GENERO ACTIVOS
  async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {

    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposGenero = await this.tipoGeneroRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return tiposGenero;

    }
    
    return await this.tipoGeneroRepository.find({
        order: {
            descripcion: 'ASC'
        },
        where: {
            estado: true
        }
    });

  }

  // EDITAR UN TIPO GENERO
  async update(id: number, updateTipoGeneroDto: UpdatetipoDto) {
    
    const tipoGenero = await this.tipoGeneroRepository.preload({idTipoGenero: id, ...updateTipoGeneroDto});

    if (!tipoGenero) throw new NotFoundException(`Tipo de Genero con id "${id}" no se ha encontrado`);

    try {
      
      await this.tipoGeneroRepository.save(tipoGenero);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {
    
    const tipoGenero = await this.findOne(id);
    
    try {

      await this.tipoGeneroRepository.remove(tipoGenero);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Tipo genero ${tipoGenero.descripcion} no se puede eliminar debido a que varios usuarios lo tienen asignado`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS TIPOS GENERO
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-GENERO
  async deleteAllTiposId(){
  
    const query = this.tipoGeneroRepository.createQueryBuilder('tipo-genero');

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
