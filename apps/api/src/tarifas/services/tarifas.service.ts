import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { ServiciosService } from '../../servicios/services';
import { PeriodosService } from '../../periodos/periodos.service';

import { PaginationDto } from '../../common/dto';

import { Tarifa } from '../entities';

import { CreateTarifaDto, UpdateTarifaDto, SaveTarifaDto } from '../dto';
import { TipoTarifaService } from './tipo-tarifa.service';

@Injectable()
export class TarifasService {

  private readonly logger = new Logger('TarifasService');
        
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Tarifa)
    private readonly tarifaRepository: Repository<Tarifa>,
    private readonly dataSource: DataSource, 
    private readonly tipoTarifaService: TipoTarifaService,
    private readonly servicioService: ServiciosService,
    private readonly periodoService: PeriodosService,
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async bulkCreate(bulkCreateTarifaDto: SaveTarifaDto) {

    const { idPeriodo, tarifas } = bulkCreateTarifaDto;
    
    // Crear QueryRunner para manejar la transacción
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {

        // 1. Verificar que el periodo existe
        const periodo = await this.periodoService.findOne(idPeriodo);

        if (!periodo) {
            throw new NotFoundException(`Periodo con ID ${idPeriodo} no encontrado`);
        }
        
        // 3. Validar y obtener las entidades relacionadas para todas las tarifas
        const tarifasToCreate = [];
        
        for (const tarifaDto of tarifas) {

            // Verificar que el idPeriodo coincida
            if (tarifaDto.idPeriodo !== idPeriodo) {

                throw new BadRequestException(
                    `La tarifa con servicio ${tarifaDto.idServicio} tiene un periodo diferente al especificado`
                );

            }
            
            // Obtener servicio
            const servicio = await this.servicioService.findOne(tarifaDto.idServicio);
            
            // Obtener tipo de tarifa
            const tipoTarifa = await this.tipoTarifaService.findOne(tarifaDto.idTipoTarifa);
            
            // Crear la entidad tarifa
            const tarifa = queryRunner.manager.create('Tarifa', {
                ...tarifaDto,
                idTipoTarifa: tipoTarifa,
                idServicio: servicio,
                idPeriodo: periodo
            });
            
            tarifasToCreate.push(tarifa);
        }
        
        // 4. Guardar todas las tarifas de una vez
        const savedTarifas = await queryRunner.manager.save('Tarifa', tarifasToCreate);
        
        // 5. Confirmar la transacción
        await queryRunner.commitTransaction();
        
        return {
            message: `Se guardaron ${savedTarifas.length} tarifas exitosamente`,
            tarifas: savedTarifas,
            idPeriodo: idPeriodo
        };
        
    } catch (error) {
        // Rollback en caso de error
        await queryRunner.rollbackTransaction();
        
        // Manejar errores específicos
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
            throw error;
        }
        
        // Para otros errores, usar tu método existente
        this.handleDbExceptions(error);
        
    } finally {

        // Liberar el QueryRunner
        await queryRunner.release();

    }

  }

  async create(createTarifaDto: CreateTarifaDto) {

    // OBTENER TIPO DE TARIFA
    const tipoTarifa = await this.tipoTarifaService.findOne(createTarifaDto.idTipoTarifa);
    
    // OBTENER SERVICIO
    const servicio = await this.servicioService.findOne(createTarifaDto.idServicio);

    // OBTENER PERIODO
    const periodo = await this.periodoService.findOne(createTarifaDto.idPeriodo);

    try {

      const tarifa = this.tarifaRepository.create({
        ...createTarifaDto,
        idTipoTarifa: tipoTarifa,
        idServicio: servicio,
        idPeriodo: periodo
      });

      await this.tarifaRepository.save(tarifa);

      return tarifa;
      
    } catch (error) {

      this.handleDbExceptions(error);
      
    }

  }

  async findAllByPeriodo(id: number, paginationDto: PaginationDto, pagination: boolean = true) {
    
    const queryBuilder = this.tarifaRepository.createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.idTipoDuracion', 'tipoDuracion')
      .leftJoinAndSelect('servicio.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      // .leftJoinAndSelect('tipoHorarioDescripcion.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      // .leftJoinAndSelect('tipoHorario.idTipoHorarioDescripcion', 'tipoHorarioDescripcion')
      .where('tarifa.idPeriodo = :id', { id })

    if (pagination) {
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      queryBuilder.take(limit).skip(offset);
    }

    return await queryBuilder.getMany();

  }
  
  async findAllActivesByPeriodo(id: number, paginationDto: PaginationDto, pagination: boolean = true) {
    
    const queryBuilder = this.tarifaRepository.createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .where('tarifa.idPeriodo = :id', { id })
      .andWhere('tarifa.estado = :estado', { estado: true })

    if (pagination) {
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      queryBuilder.take(limit).skip(offset);
    }

    return await queryBuilder.getMany();

  }
  
  async findAllActivesByPeriodoActivo(paginationDto: PaginationDto, pagination: boolean = true) {

    const periodoActivoFacturacion = await this.periodoService.obtenerPeriodoActivo();
    
    const queryBuilder = this.tarifaRepository.createQueryBuilder('tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('servicio.idTipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.idTipoDuracion', 'tipoDuracion')
      .where('tarifa.idPeriodo = :id', { id: periodoActivoFacturacion.idPeriodo })

    if (pagination) {
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      queryBuilder.take(limit).skip(offset);
    }

    return await queryBuilder.getMany();

  }

  async findOne(id: number) {
    
    const tarifa = await this.tarifaRepository.findOne({
      where: {
        idTarifa: id
      },
      relations: {
        idPeriodo: true
      }
    });
        
    if(!tarifa) throw new NotFoundException(`Tarifa con id "${id}" no se ha encontrado`);

    return tarifa;

  }

  async update(id: number, updateTarifaDto: UpdateTarifaDto) {
    
    const { idTipoTarifa, idServicio, idPeriodo, ...tarifaData } = updateTarifaDto;

    const tarifa = await this.tarifaRepository.preload({idTarifa: id, ...tarifaData});

    if(!tarifa) throw new NotFoundException(`Tarifa con id "${id}" no encontrado`);

    if (updateTarifaDto.idTipoTarifa){
      
      // OBTENER TIPO DE TARIFA
      const tipoTarifa = await this.tipoTarifaService.findOne(idTipoTarifa);

      tarifa.idTipoTarifa = tipoTarifa;
      
    }
    
    if (updateTarifaDto.idServicio){
      
      // OBTENER SERVICIO
      const servicio = await this.servicioService.findOne(idServicio);

      tarifa.idServicio = servicio;
      
    }
    

    try {
      
      await this.tarifaRepository.save(tarifa);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {
    
    const tarifa = await this.findOne(id);
    
    try {

      await this.tarifaRepository.remove(tarifa);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`La tarifa no se puede eliminar debido a que se esta usando en el sistema`); 
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

  // ELIMINAR TODOS LAS TARIFAS
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TARIFAS
  async deleteAllTarifas(){
  
    const query = this.tarifaRepository.createQueryBuilder('tarifa');

    try {
      
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }
  
}
