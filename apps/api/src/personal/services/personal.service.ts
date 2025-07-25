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

    // FECHA INICIO
        
    const fechaInicioContratoSplit = createPersonalDto.fechaInicioContrato.toISOString().split('T')[0];

    const [añoInicio, mesInicio, diaInicio] = fechaInicioContratoSplit.split('-').map(Number);
    
    const fechaInicioContrato = new Date(añoInicio, mesInicio - 1, diaInicio);

    // FECHA VIGENCIA FIN CONTRATO

    let fechaFinContrato = new Date();

    // Validar que el período del contrato sea lógicamente correcto
    if (createPersonalDto.fechaFinContrato) {
        
        // FECHA VIGENCIA FIN CONTRATO

        const fechaFinContratoSplit = createPersonalDto.fechaFinContrato.toISOString().split('T')[0];
    
        const [añoFin, mesFin, diaFin] = fechaFinContratoSplit.split('-').map(Number);
                
        fechaFinContrato = new Date(añoFin, mesFin - 1, diaFin);

        if (fechaInicioContrato >= fechaFinContrato){

            throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
        
        }

    }

    // FECHA NACIMIENTO
    const fechaNacimientoSplit = createPersonalDto.fechaNacimiento.toISOString().split('T')[0];

    const [añoNacimiento, mesNacimiento, diaNacimiento] = fechaNacimientoSplit.split('-').map(Number);
    
    const fechaNacimiento = new Date(añoNacimiento, mesNacimiento - 1, diaNacimiento);

    // OBTENER TIPO DE ID
    const tipoIdentificacion = await this.tipoIdentificacionService.findOne(createPersonalDto.idTipoIdentificacion);
    
    // OBTENER CIUDAD
    const ciudad = await this.ubicacionService.findOneCiudad(createPersonalDto.idCiudad);
    
    // OBTENER TIPO DE GENERO
    const tipoGenero = await this.tipoGeneroService.findOne(createPersonalDto.idTipoGenero);
    
    // OBTENER TIPO DE PERSONAL
    const tipoPersonal = await this.tipoPersonalService.findOne(createPersonalDto.idTipoPersonal);

    const empleado = this.personalRepository.create({
      ...createPersonalDto,
      fechaInicioContrato,
      fechaFinContrato: createPersonalDto.fechaFinContrato ? fechaFinContrato : null,
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
            idTipoPersonal: true,
            novedades: true
          }
      });
  
      return empleados;

    }

    return await this.personalRepository.find({
      order: {
        primerApellido: 'ASC'
      },
      relations: {
        idTipoPersonal: true,
        novedades: true
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
            idTipoPersonal: true,
            novedades: true
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
          idTipoPersonal: true,
          novedades: true
        }
    });

  }

  async findOne(id: number) {
   
    const empleado = await this.personalRepository.findOne({
      where: {
        idPersonal: id
      },
      relations: {
        idTipoPersonal: true,
        novedades: true
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
      fechaInicioContrato,
      fechaFinContrato,
      fechaNacimiento,
      ...toUpdate} = updatePersonalDto;

    const empleado = await this.personalRepository.preload({idPersonal: id, ...toUpdate});

    if(!empleado) throw new NotFoundException(`Empleado con id "${id}" no encontrado`);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    // FECHA INICIO

    let fechaInicioContratoUpdate = new Date();

    if (updatePersonalDto.fechaInicioContrato){
    
      const fechaInicioContratoSplit = updatePersonalDto.fechaInicioContrato.toISOString().split('T')[0];

      const [añoInicio, mesInicio, diaInicio] = fechaInicioContratoSplit.split('-').map(Number);

      fechaInicioContratoUpdate = new Date(añoInicio, mesInicio - 1, diaInicio);
      
      empleado.fechaInicioContrato = fechaInicioContratoUpdate;

    }

    // FECHA VIGENCIA FIN CONTRATO

    let fechaFinContratoUpdate = new Date();

    // Validar que el período del contrato sea lógicamente correcto
    if (updatePersonalDto.fechaFinContrato) {
        
        // FECHA VIGENCIA FIN CONTRATO

        const fechaFinContratoSplit = updatePersonalDto.fechaFinContrato.toISOString().split('T')[0];
    
        const [añoFin, mesFin, diaFin] = fechaFinContratoSplit.split('-').map(Number);
                
        fechaFinContratoUpdate = new Date(añoFin, mesFin - 1, diaFin);

        if (empleado.fechaInicioContrato >= fechaFinContratoUpdate){

            throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
        
        }

        empleado.fechaFinContrato = fechaFinContratoUpdate;

    }

    // FECHA NACIMIENTO

    if (updatePersonalDto.fechaNacimiento){

      const fechaNacimientoSplit = updatePersonalDto.fechaNacimiento.toISOString().split('T')[0];
  
      const [añoNacimiento, mesNacimiento, diaNacimiento] = fechaNacimientoSplit.split('-').map(Number);
      
      empleado.fechaNacimiento = new Date(añoNacimiento, mesNacimiento - 1, diaNacimiento);

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
