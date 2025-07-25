import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../common/dto';

import { Periodo } from './entities/periodo.entity';

import { CreatePeriodoDto, UpdatePeriodoDto } from './dto';
import { Meses } from './interfaces/meses.interface';

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
    
    // FECHA INICIO
    
    const fechaInicioSplit = createPeriodoDto.fechaInicio.toISOString().split('T')[0];

    const [añoInicio, mesInicio, diaInicio] = fechaInicioSplit.split('-').map(Number);

    const nombreMesInicio = Meses[mesInicio - 1].nombre;
    
    const fechaInicio = new Date(añoInicio, mesInicio - 1, diaInicio);
    
    // FECHA FIN

    const fechaFinSplit = createPeriodoDto.fechaFin.toISOString().split('T')[0];

    const [añoFin, mesFin, diaFin] = fechaFinSplit.split('-').map(Number);

    const nombreMesFin = Meses[mesFin - 1].nombre;
    
    const fechaFin = new Date(añoFin, mesFin - 1, diaFin);
    
    // VALIDAR PERIODOS 

    await this.validarPeriodo(fechaInicio, fechaFin);
    
    // NOMBRE PERIODO
    const nombrePeriodo = `${nombreMesInicio} ${diaInicio} de ${añoInicio} a ${nombreMesFin} ${diaFin} de ${añoFin}`;
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // Crear periodo
      const periodo = queryRunner.manager.create(Periodo, {
          nombre: nombrePeriodo,
          mesInicio: mesInicio,
          anioInicio: añoInicio,
          mesFin: mesFin,
          anioFin: añoFin,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
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

  private async validarPeriodo(fechaInicio: Date, fechaFin: Date, idPeriodoExcluir?: number){

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
          (:fechaInicio BETWEEN periodo.fechaInicio AND periodo.fechaFin) OR
          (:fechaFin BETWEEN periodo.fechaInicio AND periodo.fechaFin) OR
          (:fechaInicio <= periodo.fechaInicio AND :fechaFin >= periodo.fechaFin)
        )`,
        { fechaInicio, fechaFin }
      );

    // Excluir el periodo que se está actualizando
    if (idPeriodoExcluir) {
      query = query.andWhere('periodo.idPeriodo != :idPeriodoExcluir', { idPeriodoExcluir });
    }

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

    // FECHA INICIO
    
    const fechaInicioSplit = updatePeriodoDto.fechaInicio.toISOString().split('T')[0];

    const [añoInicio, mesInicio, diaInicio] = fechaInicioSplit.split('-').map(Number);

    const nombreMesInicio = Meses[mesInicio - 1].nombre;
    
    const fechaInicio = new Date(añoInicio, mesInicio - 1, diaInicio);
    
    // FECHA FIN

    const fechaFinSplit = updatePeriodoDto.fechaFin.toISOString().split('T')[0];

    const [añoFin, mesFin, diaFin] = fechaFinSplit.split('-').map(Number);

    const nombreMesFin = Meses[mesFin - 1].nombre;
    
    const fechaFin = new Date(añoFin, mesFin - 1, diaFin);
    
    // VALIDAR PERIODOS 
    
    await this.validarPeriodo(fechaInicio, fechaFin, id);
        
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
          mesInicio: mesInicio,
          anioInicio: añoInicio,
          mesFin: mesFin,
          anioFin: añoFin,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
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
