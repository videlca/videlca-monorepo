import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';

import { TipoUnidadTiempo } from '../entities';
import { CreateTipoUnidadTiempoDto, UpdateTipoUnidadTiempoDto } from '../dto';

@Injectable()
export class TipoUnidadTiempoService {

  private readonly logger = new Logger('TipoUnidadTiempoService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoUnidadTiempo)
    private readonly tipoUnidadTiempoRepository: Repository<TipoUnidadTiempo>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO UNIDAD TIEMPO
  async create(createTipoUnidadTiempoDto: CreateTipoUnidadTiempoDto){
  
    try {
        
      const tipoUnidadTiempo = this.tipoUnidadTiempoRepository.create(createTipoUnidadTiempoDto);
      
      await this.tipoUnidadTiempoRepository.save(tipoUnidadTiempo);

      return tipoUnidadTiempo;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO UNIDAD TIEMPO
  async findOne(id: number){
  
    const tipoUnidadTiempo = await this.tipoUnidadTiempoRepository.findOneBy({idTipoUnidadTiempo: id});

    if(!tipoUnidadTiempo) throw new NotFoundException(`Tipo de unidad tiempo con id "${id}" no se ha encontrado`);

    return tipoUnidadTiempo;

  }
  
  // OBTENER UN TIPO UNIDAD TIEMPO por nombre
  async findOneByName(name: string){
  
    const tipoUnidadTiempo = await this.tipoUnidadTiempoRepository.findOneBy({descripcion: name});

    if(!tipoUnidadTiempo) throw new NotFoundException(`Tipo de unidad tiempo con nombre "${name}" no se ha encontrado`);

    return tipoUnidadTiempo;

  }
  
  // OBTENER TODOS LOS TIPO UNIDAD TIEMPO
  async findAll(paginationDto: PaginationDto) {
    
    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [tiposUnidadTiempo, total] = await this.tipoUnidadTiempoRepository.findAndCount({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return {
        data: tiposUnidadTiempo,
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

    const tiposUnidadTiempo = await this.tipoUnidadTiempoRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });

    return {
      data: tiposUnidadTiempo,
      pagination: {
        total: tiposUnidadTiempo.length,
        limit: tiposUnidadTiempo.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };
  
  }
  

  // EDITAR UN TIPO UNIDAD TIEMPO
  async update(id: number, updateTipoUnidadTiempoDto: UpdateTipoUnidadTiempoDto) {
    
    const tipoUnidadTiempo = await this.tipoUnidadTiempoRepository.preload({idTipoUnidadTiempo: id, ...updateTipoUnidadTiempoDto});

    if (!tipoUnidadTiempo) throw new NotFoundException(`Tipo de unidad tiempo con id "${id}" no se ha encontrado`);

    try {
      
      await this.tipoUnidadTiempoRepository.save(tipoUnidadTiempo);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR UN TIPO UNIDAD TIEMPO
  async remove(id: number) {
    
    const tipoUnidadTiempo = await this.findOne(id);
    
    try {

      await this.tipoUnidadTiempoRepository.remove(tipoUnidadTiempo);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El tipo unidad tiempo ${tipoUnidadTiempo.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS TIPOS UNIDAD TIEMPO
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-UNIDAD-TIEMPO
  async deleteAllTiposUnidadTiempo(){
  
    const query = this.tipoUnidadTiempoRepository.createQueryBuilder('tipo-unidad-tiempo');

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
