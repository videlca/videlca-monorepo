import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';

import { TipoTarifa } from '../entities';

import { TipoUnidadTiempoService } from './tipo-unidad-tiempo.service';
import { CreateTipoTarifaDto, UpdateTipoTarifaDto } from '../dto';
import { TipoUnidadTiempoInterface } from '../interfaces/tipo-unidad-tiempo.interface';

@Injectable()
export class TipoTarifaService {

  private readonly logger = new Logger('TipoTarifaService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoTarifa)
    private readonly tipoTarifaRepository: Repository<TipoTarifa>,
    private readonly tipoUnidadTiempoService: TipoUnidadTiempoService,      
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO TARIFA
  async create(createTipoTarifaDto: CreateTipoTarifaDto){

    // OBTENER TIPO DE TIPO UNIDAD TIEMPO
    const tipoUnidadTiempo = await this.tipoUnidadTiempoService.findOne(createTipoTarifaDto.idTipoUnidadTiempo);

    if (tipoUnidadTiempo.descripcion == TipoUnidadTiempoInterface.DIAS && createTipoTarifaDto.cantidadTiempo > 31){

      throw new BadRequestException(`No se puede seleccionar esta cantidad de tiempo para un mes`);

    }
  
    try {
        
        const tipoTarifa = this.tipoTarifaRepository.create({
            ...createTipoTarifaDto,
            idTipoUnidadTiempo: tipoUnidadTiempo
        });
      
        await this.tipoTarifaRepository.save(tipoTarifa);

        return tipoTarifa;

    } catch (error) {
        
        this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO TARIFA
  async findOne(id: number){
  
    const tipoTarifa = await this.tipoTarifaRepository.findOneBy({idTipoTarifa: id});

    if(!tipoTarifa) throw new NotFoundException(`Tipo de tarifa con id "${id}" no se ha encontrado`);

    return tipoTarifa;

  }
  
  // OBTENER UN TIPO TARIFA por nombre
  async findOneByName(name: string){
  
    const tipoTarifa = await this.tipoTarifaRepository.findOneBy({descripcion: name});

    if(!tipoTarifa) throw new NotFoundException(`Tipo de tarifa con nombre "${name}" no se ha encontrado`);

    return tipoTarifa;

  }
  
  // OBTENER TODOS LOS TIPO TARIFA
  async findAll(paginationDto: PaginationDto) {
    
    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [tiposTarifa, total] = await this.tipoTarifaRepository.findAndCount({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return {
        data: tiposTarifa,
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

    const tiposTarifa = await this.tipoTarifaRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });

    return {
      data: tiposTarifa,
      pagination: {
        total: tiposTarifa.length,
        limit: tiposTarifa.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };
  
  }
  

  // EDITAR UN TIPO TARIFA
  async update(id: number, updateTipoTarifaDto: UpdateTipoTarifaDto) {
    
    const tipoTarifa = await this.tipoTarifaRepository.preload({idTipoTarifa: id, ...updateTipoTarifaDto});

    if (!tipoTarifa) throw new NotFoundException(`Tipo de tarifa con id "${id}" no se ha encontrado`);

    try {

      if (tipoTarifa.idTipoUnidadTiempo.descripcion == TipoUnidadTiempoInterface.DIAS && updateTipoTarifaDto.cantidadTiempo > 31){

        throw new BadRequestException(`No se puede seleccionar esta cantidad de tiempo para un mes`);

      }
      
      await this.tipoTarifaRepository.save(tipoTarifa);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR UN TIPO TARIFA
  async remove(id: number) {
    
    const tipoTarifa = await this.findOne(id);
    
    try {

      await this.tipoTarifaRepository.remove(tipoTarifa);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El tipo tarifa ${tipoTarifa.nombre} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

    // CREAR TIPOS TARIFA
    async createTipoTarifaSeed(
    createTipoTarifaDto: {
        nombre: string,
        descripcion: string,
        tipoUnidadTiempo: string,
        cantidadTiempo?: number,
    }
    ){
        
        // OBTENER TIPO DE UNIDAD TIEMPO
        const tipoUnidadTiempo = await this.tipoUnidadTiempoService.findOneByName(createTipoTarifaDto.tipoUnidadTiempo);
        
        try {
        
            const tipoTarifa = this.tipoTarifaRepository.create({
                ...createTipoTarifaDto,
                idTipoUnidadTiempo: tipoUnidadTiempo
            });
        
            await this.tipoTarifaRepository.save(tipoTarifa);
        
            return tipoTarifa;
        
        } catch (error) {
            
            this.handleDbExceptions(error);
        
        }
    
    }
  
  // ELIMINAR TODOS LOS TIPOS TARIFA
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-TARIFA
  async deleteAllTiposTarifa(){
  
    const query = this.tipoTarifaRepository.createQueryBuilder('tipo-tarifa');

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
