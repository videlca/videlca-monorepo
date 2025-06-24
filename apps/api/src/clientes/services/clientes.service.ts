import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { TipoClienteService, TipoIdentificacionService } from '../../common/services';

import { PaginationDto } from '../../common/dto';

import { Cliente } from '../entities';
import { SubSegmentacionService } from './sub-segmentacion.service';

import { CreateClienteDto, UpdateClienteDto } from '../dto';

@Injectable()
export class ClientesService {

  private readonly logger = new Logger('PersonalService');
        
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    private readonly subSegmentacionService: SubSegmentacionService,
    private readonly tipoClienteService: TipoClienteService,
    private readonly tipoIdentificacionService: TipoIdentificacionService,
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createClienteDto: CreateClienteDto) {
    
    const existCliente = await this.clienteRepository.findOneBy({numeroIdentificacion: createClienteDto.numeroIdentificacion});
    
    if(existCliente){
      throw new BadRequestException(`Cliente con identificacion ${createClienteDto.numeroIdentificacion} ya existe`);
    }

    // OBTENER TIPO DE ID
    const tipoIdentificacion = await this.tipoIdentificacionService.findOne(createClienteDto.idTipoIdentificacion);
    
    // OBTENER TIPO DE CLIENTE
    const tipoCliente = await this.tipoClienteService.findOne(createClienteDto.idTipoCliente);

    // OBTENER SUB SEGMENTACION
    const subSegmentacion = await this.subSegmentacionService.findOne(createClienteDto.idSubSegmentacion);

    try {

      const cliente = this.clienteRepository.create({
        ...createClienteDto,
        idTipoIdentificacion: tipoIdentificacion,
        idTipoCliente: tipoCliente,
        idSubSegmentacion: subSegmentacion
      });

      await this.clienteRepository.save(cliente);

      return cliente;
      
    } catch (error) {

      this.handleDbExceptions(error);
      
    }

  }

  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const clientes = await this.clienteRepository.find({
          take: limit,
          skip: offset,
          order: {
              nombre: 'ASC'
          }
      });
  
      return clientes;

    }

    return await this.clienteRepository.find({
      order: {
        nombre: 'ASC'
      }
    });


  }
  
  async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const clientes = await this.clienteRepository.find({
          take: limit,
          skip: offset,
          order: {
              nombre: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return clientes;

    }
    
    return await this.clienteRepository.find({
        order: {
            nombre: 'ASC'
        },
        where: {
            estado: true
        }
    });

  }

  async findOne(id: number) {
    
    const cliente = await this.clienteRepository.findOne({
      where: {
        idCliente: id
      },
      relations: {
        locaciones: {
          correos: {
            estados: true
          },
          idCiudad: true
        }
      }
    });
        
    if(!cliente) throw new NotFoundException(`Cliente con id "${id}" no se ha encontrado`);

    return cliente;

  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    
    const { idTipoIdentificacion, idTipoCliente, idSubSegmentacion, ...clienteData } = updateClienteDto;

    const cliente = await this.clienteRepository.preload({idCliente: id, ...clienteData});

    if(!cliente) throw new NotFoundException(`Cliente con id "${id}" no encontrado`);

    if (updateClienteDto.idTipoIdentificacion){
      
      // OBTENER TIPO DE ID
      const tipoIdentificacion = await this.tipoIdentificacionService.findOne(updateClienteDto.idTipoIdentificacion);

      cliente.idTipoIdentificacion = tipoIdentificacion;
      
    }
    
    if (updateClienteDto.idTipoCliente){
      
      // OBTENER TIPO DE CLIENTE
      const tipoCliente = await this.tipoClienteService.findOne(updateClienteDto.idTipoCliente);

      cliente.idTipoCliente = tipoCliente;
      
    }
    
    if (updateClienteDto.idSubSegmentacion){
      
      // OBTENER SUB SEGMENTACION
      const subSegmentacion = await this.subSegmentacionService.findOne(updateClienteDto.idSubSegmentacion);

      cliente.idSubSegmentacion = subSegmentacion;
      
    }

    try {
      
      await this.clienteRepository.save(cliente);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {
    
    const cliente = await this.findOne(id);
    
    try {

      await this.clienteRepository.remove(cliente);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Cliente ${cliente.nombre} no se puede eliminar debido a que se esta usando en el sistema`); 
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
  
}
