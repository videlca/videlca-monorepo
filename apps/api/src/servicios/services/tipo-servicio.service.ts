import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';

import { TipoServicio } from '../entities';
import { CreateTipoServicioDto, UpdateTipoServicioDto, FilterTipoServicioDto, TipoServicioFilterColumn } from '../dto';

@Injectable()
export class TipoServicioService {

  private readonly logger = new Logger('TipoServicioService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoServicio)
    private readonly tipoServicioRepository: Repository<TipoServicio>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO SERVICIO
  async create(createTipoServicioDto: CreateTipoServicioDto){

    const prefijo = createTipoServicioDto.prefijo.trim().toUpperCase();
  
    try {
        
      const tipoServicio = this.tipoServicioRepository.create({
        ...createTipoServicioDto,
        prefijo
      });
      
      await this.tipoServicioRepository.save(tipoServicio);

      return tipoServicio;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO SERVICIO
  async findOne(id: number){
  
    const tipoServicio = await this.tipoServicioRepository.findOneBy({idTipoServicio: id});

    if(!tipoServicio) throw new NotFoundException(`Tipo de servicio con id "${id}" no se ha encontrado`);

    return tipoServicio;

  }
  
  // OBTENER UN TIPO SERVICIO por nombre
  async findOneByName(name: string){
  
    const tipoServicio = await this.tipoServicioRepository.findOneBy({descripcion: name});

    if(!tipoServicio) throw new NotFoundException(`Tipo de servicio con nombre "${name}" no se ha encontrado`);

    return tipoServicio;

  }
  
  // OBTENER TODOS LOS TIPO SERVICIO
  async findAll(paginationDto: PaginationDto) {
    
    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [tiposServicio, total] = await this.tipoServicioRepository.findAndCount({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return {
        data: tiposServicio,
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

    const tiposServicio = await this.tipoServicioRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });

    return {
      data: tiposServicio,
      pagination: {
        total: tiposServicio.length,
        limit: tiposServicio.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };
  
  }
  // OBTENER TODOS LOS PREFIJOS DE LOS TIPO SERVICIO
  async findAllPrefixes(paginationDto: PaginationDto) {
    
    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [tiposServicio, total] = await this.tipoServicioRepository.findAndCount({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      const data = tiposServicio.map(ts => {
        return {
          prefijo: `${ts.prefijo} - ${ts.nombre}`,
          idTipoServicio: ts.idTipoServicio
        }
      });

      return {
        data,
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

    const tiposServicio = await this.tipoServicioRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });

    const data = tiposServicio.map(ts => {
      return {
        prefijo: `${ts.prefijo} - ${ts.nombre}`,
        idTipoServicio: ts.idTipoServicio
      }
    });

    return {
      data: data,
      pagination: {
        total: tiposServicio.length,
        limit: tiposServicio.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };
  
  }
  
  // OBTENER TODOS LOS TIPO SERVICIO ACTIVOS
  async findAllActives(paginationDto: PaginationDto) {

    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [tiposServicio, total] = await this.tipoServicioRepository.findAndCount({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return {
        data: tiposServicio,
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
    
    const tiposServicio = await this.tipoServicioRepository.find({
      order: {
        descripcion: 'ASC'
      },
      where: {
        estado: true
      }
    });

    return {
      data: tiposServicio,
      pagination: {
        total: tiposServicio.length,
        limit: tiposServicio.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  // FILTRAR TIPOS DE SERVICIO
  async findFiltered(filterTipoServicioDto: FilterTipoServicioDto) {
    const {
      column,
      query,
      limit = this.defaultLimit,
      offset = 0,
    } = filterTipoServicioDto;

    const columnMap: Record<TipoServicioFilterColumn, string> = {
      [TipoServicioFilterColumn.NOMBRE]: 'tipoServicio.nombre',
      [TipoServicioFilterColumn.DESCRIPCION]: 'tipoServicio.descripcion',
      [TipoServicioFilterColumn.PREFIJO]: 'tipoServicio.prefijo',
    };

    const dbColumn = columnMap[column];

    if (!dbColumn) {
      throw new BadRequestException('Columna de filtro no permitida');
    }

    const qb = this.tipoServicioRepository
      .createQueryBuilder('tipoServicio')
      .where(`${dbColumn} LIKE :query`, {
        query: `%${query}%`,
      })
      .orderBy('tipoServicio.descripcion', 'ASC');

    if (filterTipoServicioDto.pagination === PaginationOption.TRUE) {
      qb.take(limit).skip(offset);

      const [tiposServicio, total] = await qb.getManyAndCount();

      return {
        data: tiposServicio,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
        },
      };
    }

    const tiposServicio = await qb.getMany();

    return {
      data: tiposServicio,
      pagination: {
        total: tiposServicio.length,
        limit: tiposServicio.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  // EDITAR UN TIPO SERVICIO
  async update(id: number, updateTipoServicioDto: UpdateTipoServicioDto) {
    
    const tipoServicio = await this.tipoServicioRepository.preload({idTipoServicio: id, ...updateTipoServicioDto});

    if (!tipoServicio) throw new NotFoundException(`Tipo de servicio con id "${id}" no se ha encontrado`);

    try {

      const prefijo = updateTipoServicioDto.prefijo?.trim().toUpperCase();

      if(prefijo){
        tipoServicio.prefijo = prefijo;
      }
      
      await this.tipoServicioRepository.save(tipoServicio);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR UN TIPO SERVICIO
  async remove(id: number) {
    
    const tipoServicio = await this.findOne(id);
    
    try {

      await this.tipoServicioRepository.remove(tipoServicio);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El tipo servicio ${tipoServicio.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS TIPOS SERVICIO
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-SERVICIO
  async deleteAllTiposServicio(){
  
    const query = this.tipoServicioRepository.createQueryBuilder('tipo-servicio');

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
