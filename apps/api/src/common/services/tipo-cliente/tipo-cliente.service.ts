import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { TipoCliente } from '../../entities';
import { CreateTipoDto, UpdatetipoDto, PaginationDto } from '../../dto';

@Injectable()
export class TipoClienteService {

  private readonly logger = new Logger('TipoClienteService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoCliente)
    private readonly tipoClienteRepository: Repository<TipoCliente>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO CLIENTE
  async create(createTipoClienteDto: CreateTipoDto){
  
    try {
        
      const tipoCliente = this.tipoClienteRepository.create({
        descripcion: createTipoClienteDto.descripcion,
      });
      
      await this.tipoClienteRepository.save(tipoCliente);

      return tipoCliente;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO CLIENTE
  async findOne(id: number){
  
    const tipoCliente = await this.tipoClienteRepository.findOneBy({idTipoCliente: id});

    if(!tipoCliente) throw new NotFoundException(`Tipo de Cliente con id "${id}" no se ha encontrado`);

    return tipoCliente;

  }
  
  // OBTENER UN TIPO CLIENTE por nombre
  async findOneByName(name: string){
  
    const tipoCliente = await this.tipoClienteRepository.findOneBy({descripcion: name});

    if(!tipoCliente) throw new NotFoundException(`Tipo de Cliente con nombre "${name}" no se ha encontrado`);

    return tipoCliente;

  }
  
  // OBTENER TODOS LOS TIPO CLIENTE
  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposCliente = await this.tipoClienteRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return tiposCliente;

    }

    return await this.tipoClienteRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });
  
  }
  
  // OBTENER TODOS LOS TIPO CLIENTE ACTIVOS
  async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {

    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tiposCliente = await this.tipoClienteRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return tiposCliente;

    }
    
    return await this.tipoClienteRepository.find({
      order: {
        descripcion: 'ASC'
      },
      where: {
        estado: true
      }
    });

  }

  // EDITAR UN TIPO CLIENTE 
  async update(id: number, updateTipoClienteDto: UpdatetipoDto) {
    
    const tipoCliente = await this.tipoClienteRepository.preload({idTipoCliente: id, ...updateTipoClienteDto});

    if (!tipoCliente) throw new NotFoundException(`Tipo de Cliente con id "${id}" no se ha encontrado`);

    try {
      
      await this.tipoClienteRepository.save(tipoCliente);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR UN TIPO CLIENTE
  async remove(id: number) {
    
    const tipoCliente = await this.findOne(id);
    
    try {

      await this.tipoClienteRepository.remove(tipoCliente);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El tipo cliente ${tipoCliente.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS TIPOS CLIENTE
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-CLIENTE
  async deleteAllTiposCliente(){
  
    const query = this.tipoClienteRepository.createQueryBuilder('tipo-cliente');

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
