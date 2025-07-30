import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';

import { TipoHorarioDescripcion } from '../entities';
import { CreateTipoHorarioDescripcionDto, UpdatetipoHorarioDescripcionDto } from '../dto';
import { TipoHorarioInterface } from '../interfaces/tipo-horario.interface';

@Injectable()
export class TipoHorarioDescripcionService {

  private readonly logger = new Logger('TipoHorarioDescripcionService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoHorarioDescripcion)
    private readonly tipoHorarioRepository: Repository<TipoHorarioDescripcion>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO HORARIO DESCRIPCION
  async create(createTipoHorarioDescripcionDto: CreateTipoHorarioDescripcionDto){
  
    try {
        
      const tipoHorarioDescripcion = this.tipoHorarioRepository.create(createTipoHorarioDescripcionDto);
      
      await this.tipoHorarioRepository.save(tipoHorarioDescripcion);

      return tipoHorarioDescripcion;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO HORARIO DESCRIPCION
  async findOne(id: number){
  
    const tipoHorarioDescripcion = await this.tipoHorarioRepository.findOneBy({idTipoHorarioDescripcion: id});

    if(!tipoHorarioDescripcion) throw new NotFoundException(`Tipo de horario descripcion con id "${id}" no se ha encontrado`);

    return tipoHorarioDescripcion;

  }
  
  // OBTENER UN TIPO HORARIO DESCRIPCION por nombre
  async findOneByName(name: string){
  
    const tipoHorarioDescripcion = await this.tipoHorarioRepository.findOneBy({nombre: name});

    if(!tipoHorarioDescripcion) throw new NotFoundException(`Tipo de horario descripcion con nombre "${name}" no se ha encontrado`);

    return tipoHorarioDescripcion;

  }
  
  // OBTENER TODOS LOS TIPO HORARIO DESCRIPCION
  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposHorarioDescripcion = await this.tipoHorarioRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return tiposHorarioDescripcion;

    }

    return await this.tipoHorarioRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });
  
  }
  
  // OBTENER HORARIO DIRUNO Y NOCTURNO
  async findAllHorarioDirunoNocturno(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposHorarioDescripcion = await this.tipoHorarioRepository.find({
          where: [
            {nombre: TipoHorarioInterface.DIURNO},
            {nombre: TipoHorarioInterface.NOCTURNO},
          ],
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return tiposHorarioDescripcion;

    }

    return await this.tipoHorarioRepository.find({
      where: [
        {nombre: TipoHorarioInterface.DIURNO},
        {nombre: TipoHorarioInterface.NOCTURNO},
      ],
      order: {
        descripcion: 'ASC'
      }
    });
  
  }

  // EDITAR UN TIPO HORARIO DESCRIPCION
  async update(id: number, updateTipoDuracionDto: UpdatetipoHorarioDescripcionDto) {
    
    const tipoHorarioDescripcion = await this.tipoHorarioRepository.preload({idTipoHorarioDescripcion: id, ...updateTipoDuracionDto});

    if (!tipoHorarioDescripcion) throw new NotFoundException(`Tipo de horario descripcion con id "${id}" no se ha encontrado`);

    try {
      
      await this.tipoHorarioRepository.save(tipoHorarioDescripcion);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR UN TIPO HORARIO DESCRIPCION
  async remove(id: number) {
    
    const tipoHorarioDescripcion = await this.findOne(id);
    
    try {

      await this.tipoHorarioRepository.remove(tipoHorarioDescripcion);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El tipo horario descripcion ${tipoHorarioDescripcion.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS TIPOS HORARIO DESCRIPCION
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-HORARIO-DESCRIPCION
  async deleteAllTiposHorariosDescripcion(){
  
    const query = this.tipoHorarioRepository.createQueryBuilder('tipo-horario-descripcion');

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
