import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';

import { TipoHorario } from '../entities';
import { TIPO_HORARIO_COLUMNAS, RangoHorario } from '../interfaces/tipo-horario-columnas.interface';

import { CreateTipoHorarioDto, UpdateTipoHorarioDto } from '../dto';

@Injectable()
export class TipoHorarioService {

    private readonly logger = new Logger('TipoHorarioService');

    private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta

    constructor(
        @InjectRepository(TipoHorario)
        private readonly tipoHorarioRepository: Repository<TipoHorario>,
        private readonly configService: ConfigService,
    ) {
        this.defaultLimit = this.configService.get<number>('defaultLimit');
    }

    async create(createTipoHorarioDto: CreateTipoHorarioDto) {

        const { horaInicioDiurno, horaFinDiurno, horaInicioNocturno, horaFinNocturno } = createTipoHorarioDto;

        this.validarHorarios(horaInicioDiurno, horaFinDiurno, horaInicioNocturno, horaFinNocturno);

        const existeTipoHorarioVigente = await this.tipoHorarioRepository.findOneBy({ fechaVigenciaFin: IsNull() });

        if (existeTipoHorarioVigente) {
            throw new BadRequestException('Antes de crear un nuevo horario debes agregar fecha de finalizacion al que aun esta vigente');
        }

        const cantidadTiposHorario = await this.tipoHorarioRepository.count();

        // FECHA VIGENCIA INICIO
        const fechaVigenciaInicio = this.normalizarFecha(createTipoHorarioDto.fechaVigenciaInicio);

        // FECHA VIGENCIA FIN
        let fechaVigenciaFin: Date | null = null;

        if (createTipoHorarioDto.fechaVigenciaFin != null) {

            fechaVigenciaFin = this.normalizarFecha(createTipoHorarioDto.fechaVigenciaFin);

            if (fechaVigenciaInicio >= fechaVigenciaFin) {
                throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
            }

        }

        await this.validarFechasVigencia(fechaVigenciaInicio);

        // VALIDAR QUE CUANDO SE CREE EL PRIMER TIPO DE HORARIO NO SE PUEDA CREAR CON FECHA DE FIN
        if (cantidadTiposHorario == 0 && fechaVigenciaFin != null) {
            throw new BadRequestException('No se puede crear un horario con fecha de fin si no hay uno vigente, por favor, crea un horario sin fecha de fin primero');
        }

        try {

            const tipoHorario = this.tipoHorarioRepository.create({
                horaInicioDiurno,
                horaFinDiurno,
                horaInicioNocturno,
                horaFinNocturno,
                fechaVigenciaInicio,
                fechaVigenciaFin,
            });

            await this.tipoHorarioRepository.save(tipoHorario);

            return tipoHorario;

        } catch (error) {

            this.handleDbExceptions(error);

        }

    }

    // EL HORARIO DIURNO Y EL NOCTURNO DEBEN SER COMPLEMENTARIOS: EL NOCTURNO DEBE EMPEZAR EXACTAMENTE
    // DONDE TERMINA EL DIURNO Y TERMINAR EXACTAMENTE DONDE EMPIEZA EL DIURNO, PARA QUE ENTRE AMBOS
    // CUBRAN LAS 24 HORAS DEL DIA SIN SOLAPARSE NI DEJAR VACIOS (ej: diurno 06:00-19:00, nocturno debe
    // ser 19:00-06:00, no puede ser 19:00-07:00 ni 20:00-06:00)
    private validarHorarios(horaInicioDiurno: string, horaFinDiurno: string, horaInicioNocturno: string, horaFinNocturno: string) {

        if (horaInicioDiurno >= horaFinDiurno) {
            throw new BadRequestException('La hora de fin del horario diurno debe ser mayor que la hora de inicio');
        }

        if (horaInicioNocturno !== horaFinDiurno) {
            throw new BadRequestException('La hora de inicio del horario nocturno debe ser igual a la hora de fin del horario diurno, para que los horarios no se solapen ni dejen vacíos');
        }

        if (horaFinNocturno !== horaInicioDiurno) {
            throw new BadRequestException('La hora de fin del horario nocturno debe ser igual a la hora de inicio del horario diurno, para que los horarios no se solapen ni dejen vacíos');
        }

    }

    private async validarFechasVigencia(fechaInicio: Date) {

        // Validar solapamientos
        const vigenciasSolapadas = await this.tipoHorarioRepository
            .createQueryBuilder('th')
            .where(
                `(
                  (:fechaInicio BETWEEN th.fechaVigenciaInicio AND th.fechaVigenciaFin) OR
                  (:fechaInicio <= th.fechaVigenciaInicio)
                )`,
                { fechaInicio }
            )
            .getMany();

        if (vigenciasSolapadas.length > 0) {
            throw new BadRequestException(`La vigencia se solapa con un horario existente (id: ${vigenciasSolapadas.map(p => p.idTipoHorario).join(', ')})`);
        }

    }

    // NORMALIZA UNA FECHA A MEDIANOCHE LOCAL PARA EVITAR PROBLEMAS DE ZONA HORARIA (UTC)
    private normalizarFecha(fecha: Date): Date {

        const [año, mes, dia] = fecha.toISOString().split('T')[0].split('-').map(Number);

        return new Date(año, mes - 1, dia);

    }

    async findAll(paginationDto: PaginationDto) {

        const queryBuilder = this.tipoHorarioRepository.createQueryBuilder('th')
            .orderBy('th.fechaVigenciaInicio', 'DESC')

        if (paginationDto.pagination === PaginationOption.TRUE) {
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            queryBuilder.take(limit).skip(offset);

            const [tiposHorario, total] = await queryBuilder.getManyAndCount();

            return {
                data: tiposHorario,
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

        const tiposHorario = await queryBuilder.getMany();

        return {
            data: tiposHorario,
            pagination: {
                total: tiposHorario.length,
                limit: tiposHorario.length,
                offset: 0,
                page: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            }
        };

    }


    async findOne(id: number) {

        const tipoHorario = await this.tipoHorarioRepository.findOneBy({ idTipoHorario: id });

        if(!tipoHorario) throw new NotFoundException(`Tipo Horario con id "${id}" no se ha encontrado`);

        return tipoHorario;

    }

    // OBTIENE EL HORARIO VIGENTE PARA UNA FECHA ESPECIFICA (USADO PARA CALCULOS SOBRE FECHAS PASADAS)
    async findOneVigente(fecha: Date) {

        const tipoHorario = await this.tipoHorarioRepository
            .createQueryBuilder('th')
            .where('th.estado = :estado', { estado: true })
            .andWhere('th.fechaVigenciaInicio <= :fecha', { fecha })
            .andWhere('(th.fechaVigenciaFin IS NULL OR th.fechaVigenciaFin >= :fecha)', { fecha })
            .getOne();

        if(!tipoHorario) throw new NotFoundException(`No se ha encontrado un horario vigente para la fecha indicada`);

        return tipoHorario;

    }

    // OBTIENE EL UNICO HORARIO ACTUALMENTE VIGENTE (EL QUE NO TIENE FECHA DE FIN DE VIGENCIA)
    async findVigenteActual() {

        const tipoHorario = await this.tipoHorarioRepository
            .createQueryBuilder('th')
            .where('th.estado = :estado', { estado: true })
            .andWhere('th.fechaVigenciaFin IS NULL')
            .getOne();

        if(!tipoHorario) throw new NotFoundException(`No se ha encontrado un horario vigente`);

        return tipoHorario;

    }

    // EXTRAE EL RANGO DE HORAS (horaInicio/horaFin) DE UNA FILA DE TipoHorario SEGUN EL TIPO DE
    // HORARIO SOLICITADO (DIURNO O NOCTURNO), USANDO EL MAPEO DE COLUMNAS DE TIPO_HORARIO_COLUMNAS
    obtenerRangoHorario(tipoHorario: TipoHorario, nombreTipoHorario: string): RangoHorario {

        const columnas = TIPO_HORARIO_COLUMNAS[nombreTipoHorario];

        if (!columnas) {
            throw new BadRequestException(`El tipo de horario "${nombreTipoHorario}" no es valido para obtener un rango de horas`);
        }

        return {
            horaInicio: tipoHorario[columnas.horaInicio],
            horaFin: tipoHorario[columnas.horaFin],
        };

    }

    async update(id: number, updateTipoHorarioDto: UpdateTipoHorarioDto) {

        const tipoHorarioExistente = await this.findOne(id);

        const { fechaVigenciaInicio, fechaVigenciaFin, ...tipoHorarioData } = updateTipoHorarioDto;

        // FECHA VIGENCIA INICIO
        const fechaInicio = fechaVigenciaInicio != null
            ? this.normalizarFecha(fechaVigenciaInicio)
            : tipoHorarioExistente.fechaVigenciaInicio;

        // FECHA VIGENCIA FIN
        let fechaFin: Date | null = tipoHorarioExistente.fechaVigenciaFin;

        if (updateTipoHorarioDto.fechaVigenciaFin !== undefined) {

            fechaFin = updateTipoHorarioDto.fechaVigenciaFin != null
                ? this.normalizarFecha(updateTipoHorarioDto.fechaVigenciaFin)
                : null;

        }

        if (fechaFin != null && fechaInicio >= fechaFin) {
            throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
        }

        // OBTENER TIPO HORARIO
        const tipoHorario = await this.tipoHorarioRepository.preload({
            idTipoHorario: id,
            ...tipoHorarioData,
            fechaVigenciaInicio: fechaInicio,
            fechaVigenciaFin: fechaFin,
        });

        if(!tipoHorario) throw new NotFoundException(`Tipo Horario con id "${id}" no encontrado`);

        // Validar solapamiento con otros registros
        const tienesSolapamiento = await this.validarSolapamientoFechasVigencia(fechaInicio, fechaFin, id);

        if (tienesSolapamiento.haySolapamiento) {
            throw new BadRequestException(
                `Las fechas de vigencia se solapan con otro registro existente. ` +
                `Conflicto: ${tienesSolapamiento.descripcionConflicto}`
            );
        }

        // VALIDAR HORARIOS (diurno/nocturno complementarios)
        this.validarHorarios(
            tipoHorario.horaInicioDiurno,
            tipoHorario.horaFinDiurno,
            tipoHorario.horaInicioNocturno,
            tipoHorario.horaFinNocturno,
        );

        try {

            await this.tipoHorarioRepository.save(tipoHorario);

        } catch (error) {

            this.handleDbExceptions(error);

        }

    }

    async validarSolapamientoFechasVigencia(
        fechaInicioNueva: Date,
        fechaFinNueva: Date | null,
        excluirId?: number
    ): Promise<{ haySolapamiento: boolean; descripcionConflicto?: string }> {

        const query = this.tipoHorarioRepository
            .createQueryBuilder('th')
            .where('th.estado = :estado', { estado: true });

        // Excluir el registro actual si se está actualizando
        if (excluirId) {
            query.andWhere('th.idTipoHorario != :excluirId', { excluirId });
        }

        // Lógica de solapamiento:
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
            `Registro ID ${conflicto.idTipoHorario} ` +
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
            throw new BadRequestException(`El Tipo horario no se puede eliminar debido a que se esta usando en el sistema`);
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
