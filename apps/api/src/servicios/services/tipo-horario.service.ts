import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';

import { TipoHorario, TipoHorarioDescripcion } from '../entities';
import { TipoHorarioDescripcionService } from './tipo-horario-descripcion.service';
import { TipoHorarioInterface } from '../interfaces/tipo-horario.interface';

import { CreateTipoHorarioDto, UpdateTipoHorarioDto } from '../dto';

@Injectable()
export class TipoHorarioService {

    private readonly logger = new Logger('TipoHorarioService');
        
    private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

    constructor(
        @InjectRepository(TipoHorario)
        private readonly tipoHorarioRepository: Repository<TipoHorario>,
        private readonly tipoHorarioDescripcionService: TipoHorarioDescripcionService,
        private readonly configService: ConfigService,
    ) {
        this.defaultLimit = this.configService.get<number>('defaultLimit');
    }

    async create(createTipoHorarioDto: CreateTipoHorarioDto) {
        
        // OBTENER TIPO DE HORARIO DESCRIPCION
        const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOne(createTipoHorarioDto.idTipoHorarioDescripcion);

        if(tipoHorarioDescripcion.nombre == TipoHorarioInterface.DIA_COMPLETO ||
           tipoHorarioDescripcion.nombre == TipoHorarioInterface.MIXTO){
            
            // Si es DIA COMPLETO o MIXTO, no se requiere hora de inicio y fin
            throw new BadRequestException(`Para el tipo de horario ${tipoHorarioDescripcion.nombre}, no se deben especificar horas de inicio y fin.`);
            

        }
        
        const existTipoHorario = await this.tipoHorarioRepository
        .createQueryBuilder('th')
        .leftJoinAndSelect('th.idTipoHorarioDescripcion', 'thd')
        .where('th.idTipoHorarioDescripcion = :idTipoHorarioDescripcion', { 
            idTipoHorarioDescripcion: tipoHorarioDescripcion.idTipoHorarioDescripcion 
        })
        .andWhere('th.fechaVigenciaFin IS NULL')
        .getOne();

        const existTiposHorario = await this.tipoHorarioRepository
        .createQueryBuilder('th')
        .leftJoinAndSelect('th.idTipoHorarioDescripcion', 'thd')
        .where('th.idTipoHorarioDescripcion = :idTipoHorarioDescripcion', { 
            idTipoHorarioDescripcion: tipoHorarioDescripcion.idTipoHorarioDescripcion 
        })
        .getMany();

        if (existTipoHorario){
            throw new BadRequestException(`Antes de crear un nuevo horario ${tipoHorarioDescripcion.nombre} debes agregar fecha de finalizacion al que aun esta vigente`)
        }

        // FECHA VIGENCIA INICIO
            
        const fechaVigenciaInicioSplit = createTipoHorarioDto.fechaVigenciaInicio.toISOString().split('T')[0];
    
        const [añoInicio, mesInicio, diaInicio] = fechaVigenciaInicioSplit.split('-').map(Number);
        
        const fechaVigenciaInicio = new Date(añoInicio, mesInicio - 1, diaInicio);

        // FECHA VIGENCIA FIN

        let fechaVigenciaFin = createTipoHorarioDto.fechaVigenciaFin != null ? new Date(createTipoHorarioDto.fechaVigenciaFin) : null;

        // Validar que el período sea lógicamente correcto
        if (createTipoHorarioDto.fechaVigenciaFin != null) {
            
            // FECHA VIGENCIA FIN
    
            const fechaVigenciaFinSplit = createTipoHorarioDto.fechaVigenciaFin.toISOString().split('T')[0];
        
            const [añoFin, mesFin, diaFin] = fechaVigenciaFinSplit.split('-').map(Number);
                    
            fechaVigenciaFin = new Date(añoFin, mesFin - 1, diaFin);

            if (fechaVigenciaInicio >= fechaVigenciaFin){

                throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
            
            }

        }

        await this.validarFechasVigencia(fechaVigenciaInicio, tipoHorarioDescripcion);
        
        // VALIDAR QUE CUANDO SE CREE EL PRIMERO TIPO DE HORARIO NO SE PUEDA CREAR CON FECHA DE FIN
        if(existTiposHorario.length == 0 && fechaVigenciaFin != null){
    
            throw new BadRequestException(`No se puede crear un horario ${tipoHorarioDescripcion.nombre} con fecha de fin si no hay uno vigente, por favor, crea un horario sin fecha de fin primero`);
            
        }
    
        if (
            tipoHorarioDescripcion.nombre == TipoHorarioInterface.DIURNO && 
            createTipoHorarioDto.horaInicio >= createTipoHorarioDto.horaFin
        ){
    
            throw new BadRequestException("La hora de fin debe ser mayor que la hora de inicio")
    
        }
        
        if (
            tipoHorarioDescripcion.nombre == TipoHorarioInterface.NOCTURNO && 
            createTipoHorarioDto.horaFin >= createTipoHorarioDto.horaInicio
        ){
    
            throw new BadRequestException("La hora de inicio debe ser mayor que la hora de fin")
    
        }
    
        try {
    
          const tipoHorario = this.tipoHorarioRepository.create({
            ...createTipoHorarioDto,
            idTipoHorarioDescripcion: tipoHorarioDescripcion,
            fechaVigenciaInicio: fechaVigenciaInicio,
            fechaVigenciaFin: createTipoHorarioDto.fechaVigenciaFin ? fechaVigenciaFin : null
          });
    
          await this.tipoHorarioRepository.save(tipoHorario);
    
          return tipoHorario;
          
        } catch (error) {
    
          this.handleDbExceptions(error);
          
        }

    }

    private async validarFechasVigencia(fechaInicio: Date, tipoHorarioDescripcion: TipoHorarioDescripcion){
    
        // Validar solapamientos
        let query = this.tipoHorarioRepository
          .createQueryBuilder('th')
          .where('th.idTipoHorarioDescripcion = :idTipoHorarioDescripcion', { idTipoHorarioDescripcion: tipoHorarioDescripcion.idTipoHorarioDescripcion })
          .andWhere(
            `(
              (:fechaInicio BETWEEN th.fechaVigenciaInicio AND th.fechaVigenciaFin) OR
              (:fechaInicio <= th.fechaVigenciaInicio)
            )`,
            { fechaInicio }
          );
    
        const vigenciasSolapadas = await query.getMany();
    
        if (vigenciasSolapadas.length > 0) {
          throw new BadRequestException(`La vigencia se solapa con un horario: ${vigenciasSolapadas.map(p => p.idTipoHorarioDescripcion).join(', ')}`);
        }

    }

    async findAll(paginationDto: PaginationDto, pagination: boolean = true) {

        const queryBuilder = this.tipoHorarioRepository.createQueryBuilder('th')
            .leftJoinAndSelect('th.idTipoHorarioDescripcion', 'thd')
            .orderBy('th.fechaVigenciaInicio', 'DESC')
        
        if (pagination) {
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            queryBuilder.take(limit).skip(offset);
        }
        
        return await queryBuilder.getMany();

    }


    async findOne(id: number) {
    
        const tipoHorario = await this.tipoHorarioRepository.findOne({
            where: {
                idTipoHorario: id
            },
            relations: {
                idTipoHorarioDescripcion: true
            }
        });
            
        if(!tipoHorario) throw new NotFoundException(`Tipo Horario con id "${id}" no se ha encontrado`);
    
        return tipoHorario;

    }
    
    async findOneVigente(idTipoHorarioDescripcion: number, fecha: Date) {

        // OBTENER TIPO DE HORARIO DESCRIPCION
        const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOne(idTipoHorarioDescripcion);

        if(tipoHorarioDescripcion.nombre == TipoHorarioInterface.DIA_COMPLETO ||
           tipoHorarioDescripcion.nombre == TipoHorarioInterface.MIXTO){
            
            // Si es DIA COMPLETO o MIXTO, no se requiere hora de inicio y fin
            throw new BadRequestException(`Para el tipo de horario ${tipoHorarioDescripcion.nombre}, no se deben especificar horas de inicio y fin.`);
            

        }
    
        const tipoHorario = await this.tipoHorarioRepository
            .createQueryBuilder('th')
            .leftJoinAndSelect('th.idTipoHorarioDescripcion', 'thd')
            .where('th.idTipoHorarioDescripcion = :idTipoHorarioDescripcion', { idTipoHorarioDescripcion })
            .andWhere('th.estado = :estado', { estado: true })
            .andWhere('th.fechaVigenciaInicio <= :fecha', { fecha })
            .andWhere('(th.fechaVigenciaFin IS NULL OR th.fechaVigenciaFin >= :fecha)', { fecha })
            .getOne();
            
        if(!tipoHorario) throw new NotFoundException(`Tipo Horario vigente "${tipoHorarioDescripcion.nombre}" no se ha encontrado`);
    
        return tipoHorario;

    }
    
    async findOneVigenteByName(tipoHorarioDescripcionDescription: string) {

        // OBTENER TIPO DE HORARIO DESCRIPCION
        const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOneByName(tipoHorarioDescripcionDescription);

        if(tipoHorarioDescripcion.nombre == TipoHorarioInterface.DIA_COMPLETO ||
           tipoHorarioDescripcion.nombre == TipoHorarioInterface.MIXTO){
            
            // Si es DIA COMPLETO o MIXTO, no se requiere hora de inicio y fin
            throw new BadRequestException(`Para el tipo de horario ${tipoHorarioDescripcion.nombre}, no se deben especificar horas de inicio y fin.`);
            

        }
    
        const tipoHorario = await this.tipoHorarioRepository
            .createQueryBuilder('th')
            .leftJoinAndSelect('th.idTipoHorarioDescripcion', 'thd')
            .where('th.idTipoHorarioDescripcion = :idTipoHorarioDescripcion', { idTipoHorarioDescripcion: tipoHorarioDescripcion.idTipoHorarioDescripcion })
            .andWhere('th.estado = :estado', { estado: true })
            .andWhere('(th.fechaVigenciaFin IS NULL')
            .getOne();
            
        if(!tipoHorario) throw new NotFoundException(`Tipo Horario vigente "${tipoHorarioDescripcion.nombre}" no se ha encontrado`);
    
        return tipoHorario;

    }

    async update(id: number, updateTipoHorarioDto: UpdateTipoHorarioDto) {
    
        const { idTipoHorarioDescripcion, fechaVigenciaInicio, fechaVigenciaFin, ...tipoHorarioData } = updateTipoHorarioDto;

        // FECHA VIGENCIA INICIO
            
        const fechaVigenciaInicioSplit = updateTipoHorarioDto.fechaVigenciaInicio.toISOString().split('T')[0];
    
        const [añoInicio, mesInicio, diaInicio] = fechaVigenciaInicioSplit.split('-').map(Number);
        
        const fechaInicio = new Date(añoInicio, mesInicio - 1, diaInicio);

        // OBTENER TIPO HORARIO

        const tipoHorario = await this.tipoHorarioRepository.preload({
            idTipoHorario: id,
            fechaVigenciaInicio: fechaInicio, 
            ...tipoHorarioData
        });
    
        if(!tipoHorario) throw new NotFoundException(`Tipo Horario con id "${id}" no encontrado`);
    

        if (updateTipoHorarioDto.idTipoHorarioDescripcion){
            
            // OBTENER TIPO DE HORARIO DESCRIPCION
            const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOne(idTipoHorarioDescripcion);

            if(tipoHorarioDescripcion.nombre == TipoHorarioInterface.DIA_COMPLETO ||
               tipoHorarioDescripcion.nombre == TipoHorarioInterface.MIXTO){
            
                // Si es DIA COMPLETO o MIXTO, no se requiere hora de inicio y fin
                throw new BadRequestException(`Para el tipo de horario ${tipoHorarioDescripcion.nombre}, no se deben especificar horas de inicio y fin.`);

            }
    
            tipoHorario.idTipoHorarioDescripcion = tipoHorarioDescripcion;
            
        }

        // FECHA VIGENCIA FIN

        let fechaFin = updateTipoHorarioDto.fechaVigenciaFin != null ? new Date(updateTipoHorarioDto.fechaVigenciaFin) : null;;

        // Validar que el período sea lógicamente correcto
        if (updateTipoHorarioDto.fechaVigenciaFin != null) {
            
            // FECHA VIGENCIA FIN
    
            const fechaVigenciaFinSplit = updateTipoHorarioDto.fechaVigenciaFin.toISOString().split('T')[0];
        
            const [añoFin, mesFin, diaFin] = fechaVigenciaFinSplit.split('-').map(Number);
                    
            fechaFin = new Date(añoFin, mesFin - 1, diaFin);

            if (fechaInicio >= fechaFin){

                throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
            
            }

            tipoHorario.fechaVigenciaFin = fechaFin;

        }


        // 4. Validar solapamiento con otros registros del mismo tipo de descripción
        const tienesSolapamiento = await this.validarSolapamientoFechasVigencia(
            tipoHorario.idTipoHorarioDescripcion,
            fechaInicio,
            updateTipoHorarioDto.fechaVigenciaFin ? fechaFin : null,
            id // Excluir el registro actual de la validación
        );
    
        if (tienesSolapamiento.haySolapamiento) {
          throw new BadRequestException(
            `Las fechas de vigencia se solapan con otro registro existente. ` +
            `Conflicto: ${tienesSolapamiento.descripcionConflicto}`
          );
        }

        // VALIDAR HORARIOS
        if (
            tipoHorario.idTipoHorarioDescripcion.nombre == TipoHorarioInterface.DIURNO && 
            tipoHorario.horaInicio >= tipoHorario.horaFin
        ){
    
            throw new BadRequestException("La hora de fin debe ser mayor que la hora de inicio")
    
        }
        
        if (
            tipoHorario.idTipoHorarioDescripcion.nombre == TipoHorarioInterface.NOCTURNO && 
            tipoHorario.horaFin >= tipoHorario.horaInicio
        ){
    
            throw new BadRequestException("La hora de inicio debe ser mayor que la hora de fin")
    
        }
    
        try {
            
            await this.tipoHorarioRepository.save(tipoHorario);
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }

    }

    async validarSolapamientoFechasVigencia(
        tipoHorarioDescripcion: TipoHorarioDescripcion,
        fechaInicioNueva: Date,
        fechaFinNueva: Date | null,
        excluirId?: number
    ): Promise<{ haySolapamiento: boolean; descripcionConflicto?: string }> {
    
        const query = this.tipoHorarioRepository
            .createQueryBuilder('th')
            .leftJoinAndSelect('th.idTipoHorarioDescripcion', 'thd')
            .where('th.idTipoHorarioDescripcion = :idTipoHorarioDescripcion', { idTipoHorarioDescripcion: tipoHorarioDescripcion.idTipoHorarioDescripcion })
            .andWhere('th.estado = :estado', { estado: true });
    
        // Excluir el registro actual si se está actualizando
        if (excluirId) {
            query.andWhere('th.idTipoHorario != :excluirId', { excluirId });
        }
    
        // Lógica de solapamiento:
        // Hay solapamiento si:
        // 1. La nueva fecha inicio está dentro de un rango existente
        // 2. La nueva fecha fin está dentro de un rango existente  
        // 3. El nuevo rango engloba completamente un rango existente
        // 4. Un rango existente engloba completamente el nuevo rango
    
        if (fechaFinNueva) {
            // Caso 1: El nuevo rango tiene fecha fin definida
            query.andWhere(`
            (
                -- Nuevo rango se solapa con rango existente
                (:fechaInicioNueva <= COALESCE(th.fechaVigenciaFin, '9999-12-31') AND 
                :fechaFinNueva >= th.fechaVigenciaInicio)
            )
            `, {
                fechaInicioNueva,
                fechaFinNueva
            });
        } else {
            // Caso 2: El nuevo rango no tiene fecha fin (vigencia indefinida)
            query.andWhere(`
            (
                -- Si el registro existente no tiene fecha fin, hay conflicto
                th.fechaVigenciaFin IS NULL
                OR
                -- Si el registro existente tiene fecha fin, verificar que no se solape
                th.fechaVigenciaFin >= :fechaInicioNueva
            )
            `, {
                fechaInicioNueva
            });
        }
    
        const registrosEnConflicto = await query.getMany();
    
        if (registrosEnConflicto.length > 0) {
            const conflicto = registrosEnConflicto[0];
            
            // Ensure dates are properly converted to Date objects
            const fechaInicio = conflicto.fechaVigenciaInicio instanceof Date 
                ? conflicto.fechaVigenciaInicio 
                : new Date(conflicto.fechaVigenciaInicio);
            
            const fechaFin = conflicto.fechaVigenciaFin 
                ? (conflicto.fechaVigenciaFin instanceof Date 
                    ? conflicto.fechaVigenciaFin 
                    : new Date(conflicto.fechaVigenciaFin))
                : null;
            
            const descripcionConflicto = 
            `Registro ID ${conflicto.idTipoHorario} (${conflicto.idTipoHorarioDescripcion.nombre}) ` +
            `con vigencia desde ${fechaInicio.toISOString().split('T')[0]} ` +
            `hasta ${fechaFin ? fechaFin.toISOString().split('T')[0] : 'indefinido'}`;

            return {
                haySolapamiento: true,
                descripcionConflicto
            };
        }
    
        return { haySolapamiento: false };
    }


    async remove(id: number) {
    
        const tipoHorario = await this.findOne(id);
        
        try {
    
            await this.tipoHorarioRepository.remove(tipoHorario);
            
        } catch (error) {
            
            this.logger.error(error);
    
            if(error.errno == 1451){
            throw new BadRequestException(`El Tipo horario ${tipoHorario.idTipoHorarioDescripcion.nombre} no se puede eliminar debido a que se esta usando en el sistema`); 
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

    // ELIMINAR TODOS LOS TIPOS HORARIO
    // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-HORARIO
    async deleteAllTiposHorario(){
    
        const query = this.tipoHorarioRepository.createQueryBuilder('tipo-horario');
    
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