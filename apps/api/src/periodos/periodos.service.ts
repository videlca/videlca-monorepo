import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    
    try {
     
      // Validacion si el periodo a crear sera el que estara activo para facturacion
      if (createPeriodoDto.periodoActivoFacturacion == true){
  
      }

    } catch (error) {
      
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

  findAll() {
    return `This action returns all periodos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} periodo`;
  }

  update(id: number, updatePeriodoDto: UpdatePeriodoDto) {
    return `This action updates a #${id} periodo`;
  }

  remove(id: number) {
    return `This action removes a #${id} periodo`;
  }
}
