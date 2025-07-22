import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { TipoDuracion } from '../entities';
import { CreateTipoDto, UpdatetipoDto, PaginationDto } from '../../common/dto';

@Injectable()
export class TipoDuracionService {

  private readonly logger = new Logger('TipoDuracionService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoDuracion)
    private readonly tipoDuracionRepository: Repository<TipoDuracion>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO DURACION
  async create(createTipoDuracionDto: CreateTipoDto){
  
    try {
        
      const tipoDuracion = this.tipoDuracionRepository.create({
        descripcion: createTipoDuracionDto.descripcion,
      });
      
      await this.tipoDuracionRepository.save(tipoDuracion);

      return tipoDuracion;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO DURACION
  async findOne(id: number){
  
    const tipoDuracion = await this.tipoDuracionRepository.findOneBy({idTipoDuracion: id});

    if(!tipoDuracion) throw new NotFoundException(`Tipo de duracion con id "${id}" no se ha encontrado`);

    return tipoDuracion;

  }
  
  // OBTENER UN TIPO DURACIONS por nombre
  async findOneByName(name: string){
  
    const tipoDuracion = await this.tipoDuracionRepository.findOneBy({descripcion: name});

    if(!tipoDuracion) throw new NotFoundException(`Tipo de duracion con nombre "${name}" no se ha encontrado`);

    return tipoDuracion;

  }
  
  // OBTENER TODOS LOS TIPO DURACION
  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposDuracion = await this.tipoDuracionRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return tiposDuracion;

    }

    return await this.tipoDuracionRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });
  
  }
  

  // EDITAR UN TIPO DURACION
  async update(id: number, updateTipoDuracionDto: UpdatetipoDto) {
    
    const tipoDuracion = await this.tipoDuracionRepository.preload({idTipoDuracion: id, ...updateTipoDuracionDto});

    if (!tipoDuracion) throw new NotFoundException(`Tipo de duracion con id "${id}" no se ha encontrado`);

    try {
      
      await this.tipoDuracionRepository.save(tipoDuracion);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR UN TIPO DURACION
  async remove(id: number) {
    
    const tipoDuracion = await this.findOne(id);
    
    try {

      await this.tipoDuracionRepository.remove(tipoDuracion);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El tipo duracion ${tipoDuracion.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS TIPOS DURACION
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-DURACION
  async deleteAllTiposDuracion(){
  
    const query = this.tipoDuracionRepository.createQueryBuilder('tipo-duracion');

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
