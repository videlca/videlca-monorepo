import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PersonalService } from '../../personal/services';
import { TipoNovedadService } from '../services';

import { Personal } from '../../personal/entities';
import { PaginationDto } from '../../common/dto';

import { Novedad, TipoNovedad } from '../entities';
import { TipoEstadoPersonal } from '../interfaces/tipo-estado.interface';
import { CreateNovedadDto, UpdateNovedadDto } from '../dto';


@Injectable()
export class NovedadService {

  private readonly logger = new Logger('NovedadService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Novedad)
    private readonly novedadRepository: Repository<Novedad>,
    @Inject(forwardRef(() => PersonalService))
    private readonly personalService: PersonalService,   
    @Inject(forwardRef(() => TipoNovedadService))
    private readonly tipoNovedadService: TipoNovedadService,         
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR NOVEDAD
  async create(createNovedadDto: CreateNovedadDto, personalId: number){

    const novedadesPersonal = await this.findAllByPersonal(personalId);

    // Verificar si tiene alguna novedad de tipo retirado
    const tieneNovedadRetirado = novedadesPersonal.some(novedad => 
        novedad.idTipoNovedad?.retirado === true
    );
    
    if (tieneNovedadRetirado) {
        throw new BadRequestException('No se le pueden añadir mas novedades al personal ya que se encuentra retirado');
    }

    // OBTENER TIPO DE NOVEDAD
    const tipoNovedad = await this.tipoNovedadService.findOne(createNovedadDto.idTipoNovedad);
    
    // OBTENER PERSONAL
    const personal = await this.personalService.findOne(personalId);

    if(!tipoNovedad.retirado && !createNovedadDto.fechaFin && !createNovedadDto.horaFin){
    
      throw new BadRequestException(`Fecha fin y Hora fin son requeridos para este tipo de novedad`);

    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    
    try {
        
      const novedad = this.novedadRepository.create({
        ...createNovedadDto,
        idTipoNovedad: tipoNovedad,
        idPersonal: personal
      });
      
      await queryRunner.manager.save(novedad);

      if(tipoNovedad.retirado){

        // cambiar estado personal
        await this.personalService.updateState(personal.idPersonal, false, queryRunner)

      }

      await queryRunner.commitTransaction();

      await queryRunner.release();
      
      return novedad;
      

    } catch (error) {
        
      await queryRunner.rollbackTransaction();
       
      await queryRunner.release();

      this.handleDbExceptions(error);

    }

  }

  async findAllByPersonal(personalId: number){

    return await this.novedadRepository.find({
      where: { 
        idPersonal: { 
          idPersonal: personalId
        } 
      },
      order: { 
        fechaInicio: 'DESC', 
        horaInicio: 'DESC' 
      } // Más reciente primero
    });

  }
  
  // OBTENER UNA NOVEDAD
  async findOne(id: number){
  
    const novedad = await this.novedadRepository.findOneBy({idNovedad: id});

    if(!novedad) throw new NotFoundException(`Novedad con id "${id}" no se ha encontrado`);

    return novedad;

  }
  
  // OBTENER TODAS LAS NOVEDADES
  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const novedades = await this.novedadRepository.find({
          take: limit,
          skip: offset,
          order: {
            fechaInicio: 'DESC', 
            horaInicio: 'DESC'
          }
      });

      return this.groupByEmployee(novedades);

    }

    const novedades = await this.novedadRepository.find({
      order: {
        fechaInicio: 'DESC', 
        horaInicio: 'DESC'
      }
    });

    return this.groupByEmployee(novedades);
  
  }

  private groupByEmployee(novedades: Novedad[]) {
    const grouped = {};
    novedades.forEach(novedad => {
      const personalId = novedad.idPersonal.idPersonal;
      if (!grouped[personalId]) {
        grouped[personalId] = {
          personal: novedad.idPersonal,
          novedades: []
        };
      }
      grouped[personalId].novedades.push(novedad);
    });
    return Object.values(grouped);
  }
  

  // EDITAR UNA NOVEDAD
  async update(id: number, updateNovedadDto: UpdateNovedadDto) {

    const {idTipoNovedad, ...toUpdate} = updateNovedadDto;
    
    const novedad = await this.novedadRepository.preload({idNovedad: id, ...toUpdate});

    if (!novedad) throw new NotFoundException(`Tipo Novedad con id "${id}" no se ha encontrado`);

    // OBTENER TIPO DE NOVEDAD
    const tipoNovedad = await this.tipoNovedadService.findOne(idTipoNovedad);

    const novedadesPersonal = await this.findAllByPersonal(novedad.idPersonal.idPersonal);

    // Verificar si tiene alguna novedad de tipo retirado
    const tieneNovedadRetirado = novedadesPersonal.some(novedad => 
        novedad.idTipoNovedad?.retirado === true
    );
    
    if (tieneNovedadRetirado && tipoNovedad.retirado) {
        throw new BadRequestException('No puede actualizar esta novedad, no se pueden tener 2 novedades en retirado');
    }

    if(!tipoNovedad.retirado && !updateNovedadDto.fechaFin && !updateNovedadDto.horaFin){
    
      throw new BadRequestException(`Fecha fin y Hora fin son requeridos para este tipo de novedad`);

    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      
      await queryRunner.manager.save(novedad);

      if(tipoNovedad.retirado){

        // cambiar estado personal
        await this.personalService.updateState(novedad.idPersonal.idPersonal, false, queryRunner)

      }

      await queryRunner.commitTransaction();

      await queryRunner.release();
      
      return novedad;

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {
    
    const novedad = await this.findOne(id);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    
    try {

      await queryRunner.manager.remove(novedad);

      if(novedad.idTipoNovedad.retirado){

        // cambiar estado personal
        await this.personalService.updateState(novedad.idPersonal.idPersonal, true, queryRunner)

      }
      
    } catch (error) {
      
      this.logger.error(error);
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  async createNovedadRetiro(idPersonal: Personal, queryRunner: QueryRunner): Promise<Novedad> {

    const novedadesPersonal = await this.findAllByPersonal(idPersonal.idPersonal);

    // Verificar si tiene alguna novedad de tipo retirado
    const tieneNovedadRetirado = novedadesPersonal.some(novedad => 
        novedad.idTipoNovedad?.retirado === true
    );
    
    if (tieneNovedadRetirado) {
        throw new BadRequestException('No se le pueden añadir mas novedades al personal ya que se encuentra retirado');
    }
    
    // Buscar el tipo de novedad RETIRADO usando el queryRunner
    const tipoNovedad = await queryRunner.manager.findOneBy(TipoNovedad, {
      retirado: true
    });

    if (!tipoNovedad) {
      throw new NotFoundException('Tipo de novedad RETIRADO no encontrado');
    }

    // Preparar fechas y hora
    const fechaActual = new Date();
    const soloFecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
    
    const hora = fechaActual.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Crear la novedad
    const nuevaNovedad = queryRunner.manager.create(Novedad, {
      descripcion: `Empleado ${idPersonal.primerNombre} ${idPersonal.primerApellido} marcado como inactivo`,
      fechaInicio: soloFecha,
      horaInicio: hora,
      idPersonal,
      idTipoNovedad: tipoNovedad,
      // Agrega otros campos según tu entidad
      estado: true, // o según tu lógica
      fechaCreacion: fechaActual,
    });

    // Guardar usando el queryRunner
    const novedadGuardada = await queryRunner.manager.save(Novedad, nuevaNovedad);

    return novedadGuardada;
  }
  
  async removeNovedadRetiro(idPersonal: Personal, queryRunner: QueryRunner){

    // Buscar el tipo de novedad RETIRADO usando el queryRunner
    const tipoNovedad = await queryRunner.manager.findOneBy(TipoNovedad, {
      retirado: true
    });

    if (!tipoNovedad) {
      throw new NotFoundException('Tipo de novedad RETIRADO no encontrado');
    }

    const novedad = await this.novedadRepository.findOneBy({
      idPersonal: idPersonal,
      idTipoNovedad: tipoNovedad
    })

    if(novedad){
      await queryRunner.manager.remove(Novedad, novedad);
    }

  }
  
  // ELIMINAR TODOS LOS TIPOS NOVEDAD
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-ESTADO
  async deleteAllTiposEstado(){
  
    const query = this.novedadRepository.createQueryBuilder('novedad');

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
