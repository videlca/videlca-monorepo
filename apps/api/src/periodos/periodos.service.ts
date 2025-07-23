import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../common/dto';

import { Periodo } from './entities/periodo.entity';

import { CreatePeriodoDto, UpdatePeriodoDto } from './dto';

@Injectable()
export class PeriodosService {

  private readonly logger = new Logger('PeriodosService');
          
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Periodo)
    private readonly periodoRepository: Repository<Periodo>,
    private readonly dataSource: DataSource, 
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createPeriodoDto: CreatePeriodoDto) {

    await this.validarPeriodo(createPeriodoDto.fechaInicio, createPeriodoDto.fechaFin);
        
    // Extraer componentes de la fecha de inicio
    const diaInicio = createPeriodoDto.fechaInicio.getDate();
    
    const mesInicio = createPeriodoDto.fechaInicio.getMonth(); // getMonth() retorna 0-11
    const nombreMesInicio = Meses[mesInicio].nombre;

    const añoInicio = createPeriodoDto.fechaInicio.getFullYear();
        
    // Extraer componentes de la fecha de fin
    const diaFin = createPeriodoDto.fechaFin.getDate();

    const mesFin = createPeriodoDto.fechaFin.getMonth(); // getMonth() retorna 0-11
    const nombreMesFin = Meses[mesFin].nombre;

    const añoFin = createPeriodoDto.fechaFin.getFullYear();
    
    // NOMBRE PERIODO
    const nombrePeriodo = `${nombreMesInicio} ${diaInicio} de ${añoInicio} a ${nombreMesFin} ${diaFin} de ${añoFin}`;
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // Crear periodo
      const periodo = queryRunner.manager.create(Periodo, {
          nombre: nombrePeriodo,
          mesInicio: mesInicio + 1,
          anioInicio: añoInicio,
          mesFin: mesFin + 1,
          anioFin: añoFin,
          fechaInicio: createPeriodoDto.fechaInicio,
          fechaFin: createPeriodoDto.fechaFin,
      });

      const savedPeriodo = await queryRunner.manager.save(Periodo, periodo);
     
      // Validacion si el periodo a crear sera el que estara activo para facturacion
      if (createPeriodoDto.periodoActivoFacturacion == true){

        await queryRunner.manager.update(
          Periodo,
          {periodoActivoFacturacion: true},
          {periodoActivoFacturacion: false}
        );

        await queryRunner.manager.update(
          Periodo,
          {idPeriodo: savedPeriodo.idPeriodo},
          {periodoActivoFacturacion: true}
        );
  
      }

      await queryRunner.commitTransaction();

      return await this.periodoRepository.findOne({
        where: {
          idPeriodo: savedPeriodo.idPeriodo
        }
      })

    } catch (error) {
      
      await queryRunner.rollbackTransaction();

      throw error;

    } finally {

      await queryRunner.release();

    }

  }

  private async validarPeriodo(fechaInicio: Date,fechaFin: Date){

    // Validar que el período sea lógicamente correcto
    if (fechaInicio >= fechaFin) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    // Validar solapamientos
    let query = this.periodoRepository
      .createQueryBuilder('periodo')
      .where('periodo.estado = :estado', { estado: true })
      .andWhere(
        `(
          (:fechaInicio BETWEEN periodo.fecha_inicio AND periodo.fecha_fin) OR
          (:fechaFin BETWEEN periodo.fecha_inicio AND periodo.fecha_fin) OR
          (:fechaInicio <= periodo.fecha_inicio AND :fechaFin >= periodo.fecha_fin)
        )`,
        { fechaInicio, fechaFin }
      );

    const periodosSolapados = await query.getMany();

    if (periodosSolapados.length > 0) {
      throw new BadRequestException(`El período se solapa con: ${periodosSolapados.map(p => p.nombre).join(', ')}`);
    }

  }

  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const periodos = await this.periodoRepository.find({
        take: limit,
        skip: offset,
        order: {
            fechaInicio: 'DESC'
        },
      });

      return periodos;

    }    
  
    return await this.periodoRepository.find({
      order: {
          fechaInicio: 'DESC'
      },
    });

  }

  async findOne(id: number) {
    
    const periodo = await this.periodoRepository.findOne({
      where: { 
          idPeriodo: id, 
      },
    });
  
    if (!periodo) {
        throw new NotFoundException(`Periodo con id "${id}" no encontrada`);
    }
    
    return periodo;
  
  }

  async update(id: number, updatePeriodoDto: UpdatePeriodoDto) {

    const periodoExistente = await this.findOne(id);
    
    await this.validarPeriodo(updatePeriodoDto.fechaInicio, updatePeriodoDto.fechaFin);
        
    // Extraer componentes de la fecha de inicio
    const diaInicio = updatePeriodoDto.fechaInicio.getDate();
    
    const mesInicio = updatePeriodoDto.fechaInicio.getMonth(); // getMonth() retorna 0-11
    const nombreMesInicio = Meses[mesInicio].nombre;

    const añoInicio = updatePeriodoDto.fechaInicio.getFullYear();
        
    // Extraer componentes de la fecha de fin
    const diaFin = updatePeriodoDto.fechaFin.getDate();

    const mesFin = updatePeriodoDto.fechaFin.getMonth(); // getMonth() retorna 0-11
    const nombreMesFin = Meses[mesFin].nombre;

    const añoFin = updatePeriodoDto.fechaFin.getFullYear();
    
    // NOMBRE PERIODO
    const nombrePeriodo = `${nombreMesInicio} ${diaInicio} de ${añoInicio} a ${nombreMesFin} ${diaFin} de ${añoFin}`;
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // Crear periodo
      const periodo = await queryRunner.manager.update(Periodo, 
        {idPeriodo: id},
        {
          nombre: nombrePeriodo,
          mesInicio: mesInicio + 1,
          anioInicio: añoInicio,
          mesFin: mesFin + 1,
          anioFin: añoFin,
          fechaInicio: updatePeriodoDto.fechaInicio,
          fechaFin: updatePeriodoDto.fechaFin,
      });
     
      // Validacion si el periodo a crear sera el que estara activo para facturacion
      if (updatePeriodoDto.periodoActivoFacturacion == true){

        await queryRunner.manager.update(
          Periodo,
          {periodoActivoFacturacion: true},
          {periodoActivoFacturacion: false}
        );

        await queryRunner.manager.update(
          Periodo,
          {idPeriodo: id},
          {periodoActivoFacturacion: true}
        );
  
      }

      await queryRunner.commitTransaction();

      return await this.periodoRepository.findOne({
        where: {
          idPeriodo: id
        }
      })

    } catch (error) {
      
      await queryRunner.rollbackTransaction();

      throw error;

    } finally {

      await queryRunner.release();

    }

  }

  async obtenerPeriodoActivo() {

    return await this.periodoRepository.findOne({
      where: { 
        periodoActivoFacturacion: true,
        estado: true 
      }
    });

  }

  async remove(id: number) {

    const periodo = await this.findOne(id);
        
    try {

      await this.periodoRepository.remove(periodo);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Periodo ${periodo.nombre} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  // ELIMINAR TODOS LOS PERIODO
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA PERIODO
  async deleteAllPeriodo(){
  
    const query = this.periodoRepository.createQueryBuilder('periodo');

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
