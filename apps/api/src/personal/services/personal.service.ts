import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { TipoIdentificacionService, UbicacionService } from '../../common/services';
import { NovedadService } from '../../novedad/services';

import { PaginationDto } from '../../common/dto';

import { Personal } from '../entities';
import { TipoGeneroService, TipoPersonalService } from '.';

import { CreatePersonalDto, UpdatePersonalDto } from '../dto';

@Injectable()
export class PersonalService {

  private readonly logger = new Logger('PersonalService');
      
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Personal)
    private readonly personalRepository: Repository<Personal>,
    @Inject(forwardRef(() => NovedadService))
    private readonly novedadService: NovedadService,
    private readonly tipoIdentificacionService: TipoIdentificacionService,
    private readonly ubicacionService: UbicacionService,
    @Inject(forwardRef(() => TipoGeneroService))
    private readonly tipoGeneroService: TipoGeneroService,
    @Inject(forwardRef(() => TipoPersonalService))
    private readonly tipoPersonalService: TipoPersonalService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createPersonalDto: CreatePersonalDto) {
    
    const existUser = await this.personalRepository.findOneBy({numeroIdentificacion: createPersonalDto.numeroIdentificacion});

    if(existUser){
      throw new BadRequestException(`Personal con identificacion ${createPersonalDto.numeroIdentificacion} ya existe`);
    }

    // Validar que la fecha de inicio no sea mayor que la de fin
    const fechaInicioContrato = new Date(createPersonalDto.fechaInicioContrato);
    const fechaFinContrato = createPersonalDto.fechaFinContrato ? new Date(createPersonalDto.fechaFinContrato) : null;
    
    if (fechaFinContrato && fechaInicioContrato > fechaFinContrato) {
      throw new BadRequestException('La fecha de inicio del contrato no puede ser mayor que la fecha de fin del contrato');
    }

    // OBTENER TIPO DE ID
    const tipoIdentificacion = await this.tipoIdentificacionService.findOne(createPersonalDto.idTipoIdentificacion);
    
    // OBTENER CIUDAD
    const ciudad = await this.ubicacionService.findOneCiudad(createPersonalDto.idCiudad);
    
    // OBTENER TIPO DE GENERO
    const tipoGenero = await this.tipoGeneroService.findOne(createPersonalDto.idTipoGenero);
    
    // OBTENER TIPO DE PERSONAL
    const tipoPersonal = await this.tipoPersonalService.findOne(createPersonalDto.idTipoPersonal);

    // FECHA DE NACIMIENTO
    const fechaNacimiento = new Date(createPersonalDto.fechaNacimiento);

    const empleado = this.personalRepository.create({
      ...createPersonalDto,
      fechaInicioContrato,
      fechaFinContrato,
      fechaNacimiento,
      idTipoIdentificacion: tipoIdentificacion,
      idCiudad: ciudad,
      idTipoGenero: tipoGenero,
      idTipoPersonal: tipoPersonal
    });

    try {
      
      await this.personalRepository.save(empleado);

      return empleado;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }


  }

  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const empleados = await this.personalRepository.find({
          take: limit,
          skip: offset,
          order: {
              primerApellido: 'ASC'
          },
          relations: {
            idTipoPersonal: true
          }
      });
  
      return empleados;

    }

    return await this.personalRepository.find({
      order: {
        primerApellido: 'ASC'
      },
      relations: {
        idTipoPersonal: true
      }
    });


  }
  
  async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const empleados = await this.personalRepository.find({
          take: limit,
          skip: offset,
          order: {
              primerApellido: 'ASC'
          },
          where: {
            laborando: true
          },
          relations: {
            idTipoPersonal: true
          }
      });
  
      return empleados;

    }
    
    return await this.personalRepository.find({
        order: {
            primerApellido: 'ASC'
        },
        where: {
            laborando: true
        },
        relations: {
          idTipoPersonal: true
        }
    });

  }

  async findOne(id: number) {
   
    const empleado = await this.personalRepository.findOne({
      where: {
        idPersonal: id
      },
      relations: {
        idTipoPersonal: true
      }
    });
    
    if(!empleado) throw new NotFoundException(`Empleado con id "${id}" no se ha encontrado`);

    return empleado;

  }

  async update(id: number, updatePersonalDto: UpdatePersonalDto) {

    const {
      laborando,
      idTipoIdentificacion,
      idTipoGenero,
      idTipoPersonal,
      idCiudad, 
      ...toUpdate} = updatePersonalDto;

    const empleado = await this.personalRepository.preload({idPersonal: id, ...toUpdate});

    if(!empleado) throw new NotFoundException(`Empleado con id "${id}" no encontrado`);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    
    // Validar que la fecha de inicio no sea mayor que la de fin
    const fechaInicioContrato = updatePersonalDto.fechaInicioContrato ? new Date(updatePersonalDto.fechaInicioContrato) : empleado.fechaInicioContrato;
    const fechaFinContrato = updatePersonalDto.fechaFinContrato ? new Date(updatePersonalDto.fechaFinContrato) : empleado.fechaFinContrato;
    
    if (fechaFinContrato && fechaInicioContrato > fechaFinContrato) {
      throw new BadRequestException('La fecha de inicio del contrato no puede ser mayor que la fecha de fin del contrato');
    }
    
    if (updatePersonalDto.idTipoIdentificacion){
      
      // OBTENER TIPO DE ID
      const tipoIdentificacion = await this.tipoIdentificacionService.findOne(updatePersonalDto.idTipoIdentificacion);

      empleado.idTipoIdentificacion = tipoIdentificacion;
      
    }

    if (updatePersonalDto.idCiudad){

      // OBTENER CIUDAD
      const ciudad = await this.ubicacionService.findOneCiudad(updatePersonalDto.idCiudad);
      
      empleado.idCiudad = ciudad;

    }

    if (updatePersonalDto.idTipoGenero){

      // OBTENER TIPO DE GENERO
      const tipoGenero = await this.tipoGeneroService.findOne(updatePersonalDto.idTipoGenero);
      
      empleado.idTipoGenero = tipoGenero;

    }

    if (updatePersonalDto.idTipoPersonal){
      
      // OBTENER TIPO DE PERSONAL
      const tipoPersonal = await this.tipoPersonalService.findOne(updatePersonalDto.idTipoPersonal);
    
      empleado.idTipoPersonal = tipoPersonal;

    }

    if (updatePersonalDto.fechaNacimiento){
      
      // FECHA DE NACIMIENTO
      const fechaNacimiento = new Date(updatePersonalDto.fechaNacimiento);
      
      empleado.fechaNacimiento = fechaNacimiento;

    }

    if (updatePersonalDto.hasOwnProperty('laborando')) {

      empleado.laborando = updatePersonalDto.laborando;
    
    }

    try {

      await queryRunner.manager.save(empleado);

      if(updatePersonalDto.hasOwnProperty('laborando') && updatePersonalDto.laborando === false && updatePersonalDto.laborando != empleado.laborando){

        await this.novedadService.createNovedadRetiro(empleado, queryRunner);

      }
      
      if(updatePersonalDto.hasOwnProperty('laborando') && updatePersonalDto.laborando === true && updatePersonalDto.laborando != empleado.laborando){

        await this.novedadService.removeNovedadRetiro(empleado, queryRunner);

      }
      
      await queryRunner.commitTransaction();

      await queryRunner.release();
      
      return this.findOne(id);

    } catch (error) {

      await queryRunner.rollbackTransaction();
       
      await queryRunner.release();

      this.handleDbExceptions(error);
      
    }

  }

  async remove(id: number) {
    
    const empleado = await this.findOne(id);
    
    try {

      await this.personalRepository.remove(empleado);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Empleado ${empleado.primerApellido} ${empleado.primerNombre} no se puede eliminar debido a que varias ordenes lo tienen asignado`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  async updateState(idPersonal: number, laborando: boolean, queryRunner: QueryRunner){

    const empleado = await this.findOne(idPersonal);

    empleado.laborando = laborando;

    await queryRunner.manager.save(Personal, empleado);

  }

  // ELIMINAR TODOS LOS EMPLEADOS
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA PERSONAL
  async deleteAllPersonal(){
  
    const query = this.personalRepository.createQueryBuilder('personal');

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
