import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';

import { TipoHorario, TipoHorarioDescripcion } from '../entities';
import { TipoHorarioDescripcionService } from '../services';
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
        
        const existTipoHorario = await this.tipoHorarioRepository.findOne({
            where: {
                idTipoHorarioDescripcion: tipoHorarioDescripcion,
                fechaVigenciaFin: null
            }
        });
    
        if (existTipoHorario){
            throw new BadRequestException(`Antes de crear un nuevo horario ${tipoHorarioDescripcion.descripcion} debes agregar fecha de finalizacion al que aun esta vigente`)
        }

        // Validar que el período sea lógicamente correcto
        if (createTipoHorarioDto.fechaVigenciaFin && createTipoHorarioDto.fechaVigenciaInicio >= createTipoHorarioDto.fechaVigenciaFin) {
          throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
        }

        await this.validarFechasVigencia(createTipoHorarioDto.fechaVigenciaInicio, tipoHorarioDescripcion);
    
        if (
            tipoHorarioDescripcion.descripcion == TipoHorarioInterface.DIURNO && 
            createTipoHorarioDto.horaInicio >= createTipoHorarioDto.horaFin
        ){
    
            throw new BadRequestException("La hora de fin debe ser mayor que la hora de inicio")
    
        }
        
        if (
            tipoHorarioDescripcion.descripcion == TipoHorarioInterface.NOCTURNO && 
            createTipoHorarioDto.horaFin >= createTipoHorarioDto.horaInicio
        ){
    
            throw new BadRequestException("La hora de inicio debe ser mayor que la hora de fin")
    
        }
    
        try {
    
          const tipoHorario = this.tipoHorarioRepository.create({
            ...createTipoHorarioDto,
            idTipoHorarioDescripcion: tipoHorarioDescripcion,
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
          .where('th.idTipoHorarioDescripcion = :idTipoHorarioDescripcion', { idTipoHorarioDescripcion: tipoHorarioDescripcion })
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
    
        if (pagination) {
    
            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const tiposHorario = await this.tipoHorarioRepository.find({
                take: limit,
                skip: offset,
                order: {
                    fechaVigenciaInicio: 'DESC'
                }
            });
        
            return tiposHorario;
    
        }
    
        return await this.tipoHorarioRepository.find({
            order: {
                fechaVigenciaInicio: 'DESC'
            }
        });

    }


    async findOne(id: number) {
    
        const tipoHorario = await this.tipoHorarioRepository.findOne({
            where: {
                idTipoHorario: id
            }
        });
            
        if(!tipoHorario) throw new NotFoundException(`Tipo Horario con id "${id}" no se ha encontrado`);
    
        return tipoHorario;

    }
    
    async findOneVigente(idTipoHorarioDescripcion: number, fecha: Date) {

        // OBTENER TIPO DE HORARIO DESCRIPCION
        const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOne(idTipoHorarioDescripcion);
    
        const tipoHorario = await this.tipoHorarioRepository
            .createQueryBuilder('th')
            .leftJoinAndSelect('th.idTipoHorarioDescripcion', 'thd')
            .where('th.idTipoHorarioDescripcion = :idTipoHorarioDescripcion', { idTipoHorarioDescripcion })
            .andWhere('th.activo = :activo', { activo: true })
            .andWhere('th.fechaVigenciaInicio <= :fecha', { fecha })
            .andWhere('(th.fechaVigenciaFin IS NULL OR th.fechaVigenciaFin >= :fecha)', { fecha })
            .getOne();
            
        if(!tipoHorario) throw new NotFoundException(`Tipo Horario vigente "${tipoHorarioDescripcion.descripcion}" no se ha encontrado`);
    
        return tipoHorario;

    }

    async update(id: number, updateTipoHorarioDto: UpdateTipoHorarioDto) {
    
        const { idTipoHorarioDescripcion, ...tipoHorarioData } = updateTipoHorarioDto;
    
        const tipoHorario = await this.tipoHorarioRepository.preload({idTipoHorario: id, ...tipoHorarioData});
    
        if(!tipoHorario) throw new NotFoundException(`Tipo Horario con id "${id}" no encontrado`);
    
        if (updateTipoHorarioDto.idTipoHorarioDescripcion){
            
            // OBTENER TIPO DE HORARIO DESCRIPCION
            const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOne(idTipoHorarioDescripcion);
    
            tipoHorario.idTipoHorarioDescripcion = tipoHorarioDescripcion;
            
        }

        // Validar que el período sea lógicamente correcto
        if (tipoHorario.fechaVigenciaInicio >= tipoHorario.fechaVigenciaFin) {
          throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
        }

        // 4. Validar solapamiento con otros registros del mismo tipo de descripción
        const tienesSolapamiento = await this.validarSolapamientoFechasVigencia(
            tipoHorario.idTipoHorarioDescripcion,
            tipoHorario.fechaVigenciaInicio,
            tipoHorario.fechaVigenciaFin,
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
            tipoHorario.idTipoHorarioDescripcion.descripcion == TipoHorarioInterface.DIURNO && 
            tipoHorario.horaInicio >= tipoHorario.horaFin
        ){
    
            throw new BadRequestException("La hora de fin debe ser mayor que la hora de inicio")
    
        }
        
        if (
            tipoHorario.idTipoHorarioDescripcion.descripcion == TipoHorarioInterface.NOCTURNO && 
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
            .where('th.idTipoHorarioDescripcion = :idTipoHorarioDescripcion', { tipoHorarioDescripcion })
            .andWhere('th.activo = :activo', { activo: true });
    
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
            const descripcionConflicto = 
            `Registro ID ${conflicto.idTipoHorario} (${conflicto.idTipoHorarioDescripcion.descripcion}) ` +
            `con vigencia desde ${conflicto.fechaVigenciaInicio.toISOString().split('T')[0]} ` +
            `hasta ${conflicto.fechaVigenciaFin ? conflicto.fechaVigenciaFin.toISOString().split('T')[0] : 'indefinido'}`;
    
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
            throw new BadRequestException(`El Tipo horario ${tipoHorario.idTipoHorarioDescripcion.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
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
