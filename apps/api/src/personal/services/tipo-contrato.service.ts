import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';

import { TipoContrato } from '../entities';
import { CreateTipoContratoDto, UpdatetipoContratoDto } from '../dto';

@Injectable()
export class TipoContratoService {

  private readonly logger = new Logger('TipoContratoService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoContrato)
    private readonly tipoContratoRepository: Repository<TipoContrato>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO CONTRATO
  async create(createTipoContrato: CreateTipoContratoDto){
  
    try {
        
      const tipoContrato = this.tipoContratoRepository.create({
        ...createTipoContrato
      });
      
      await this.tipoContratoRepository.save(tipoContrato);

      return tipoContrato;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO CONTRATO
  async findOne(id: number){
  
    const tipoContrato = await this.tipoContratoRepository.findOneBy({idTipoContrato: id});

    if(!tipoContrato) throw new NotFoundException(`Tipo de contrato con id "${id}" no se ha encontrado`);

    return tipoContrato;

  }
  
  // OBTENER UN TIPO CONTRATO por nombre
  async findOneByName(name: string){
  
    const tipoContrato = await this.tipoContratoRepository.findOneBy({descripcion: name});

    if(!tipoContrato) throw new NotFoundException(`Tipo de contrato con nombre "${name}" no se ha encontrado`);

    return tipoContrato;

  }
  
  // OBTENER TODOS LOS TIPO CONTRATO
  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposContrato = await this.tipoContratoRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return tiposContrato;

    }

    return await this.tipoContratoRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });
  
  }
  
  // OBTENER TODOS LOS TIPO CONTRATO ACTIVOS
  async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {

    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposContrato = await this.tipoContratoRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return tiposContrato;

    }
    
    return await this.tipoContratoRepository.find({
        order: {
            descripcion: 'ASC'
        },
        where: {
            estado: true
        }
    });

  }

  // EDITAR UN TIPO CONTRATO
  async update(id: number, updateTipoContratoDto: UpdatetipoContratoDto) {
    
    const tipoContrato = await this.tipoContratoRepository.preload({idTipoContrato: id, ...updateTipoContratoDto});

    if (!tipoContrato) throw new NotFoundException(`Tipo de contrato con id "${id}" no se ha encontrado`);

    try {
      
      await this.tipoContratoRepository.save(tipoContrato);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {
    
    const tipoContrato = await this.findOne(id);
    
    try {

      await this.tipoContratoRepository.remove(tipoContrato);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Tipo contrato ${tipoContrato.descripcion} no se puede eliminar debido a que varios usuarios lo tienen asignado`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS TIPOS CONTRATO
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-CONTRATO
  async deleteAllTiposContrato(){
  
    const query = this.tipoContratoRepository.createQueryBuilder('tipo-contrato');

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
