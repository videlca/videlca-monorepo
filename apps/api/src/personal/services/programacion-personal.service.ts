import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";

import { Personal } from "../entities";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { PaginationOption } from '../../common/interfaces/pagination.interface';

interface Event {
  idEvento: string;
  tituloEvento: string;
  tipoEvento: string;
  fechaInicioEvento: Date;
  fechaFinEvento: Date;
  horaInicioEvento: string;
  horaFinEvento: string;
  horaInicioEmpleado: string;
  horaFinEmpleado: string;
}

export interface PersonalAsignado {
  idPersonal: number;
  nombreCompleto: string;
  numeroIdentificacion: string;
  idTipoPersonal: number;
  tipoPersonal: string;
  eventos?: Event[];
}

@Injectable()
export class ProgramacionPersonalService {

  private readonly logger = new Logger('ProgramacionPersonalService');
  // Variable para definir cuantos resultados se van a devolver por default en una consulta
  private defaultLimit: number;

  constructor(
    @InjectRepository(Personal)
    private readonly programacionPersonalRepository: Repository<Personal>,
    private readonly configService: ConfigService,
  ){
    // Inicializar variable con el valor que se estipulo en el archivo .env
    this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async findAll(paginationDto: PaginationDto) {

    try {

      const { limit = this.defaultLimit, offset = 0 } = paginationDto;

      const options = {
        relations: {
          novedades: true,
        },
        where: {
          laborando: true,
        },
        order: {
          primerApellido: 'ASC' as const,
        },
      };

      let programacionPersonal: Personal[];
      let total: number;

      if (paginationDto.pagination === PaginationOption.TRUE) {
        const [data, count] = await this.programacionPersonalRepository.findAndCount({
          ...options,
          take: limit,
          skip: offset,
        });

        programacionPersonal = data;
        total = count;
      } else {
        programacionPersonal = await this.programacionPersonalRepository.find(options);
        total = programacionPersonal.length;
      }

      const personalMap: Record<number, PersonalAsignado> = {};

      for (const personal of programacionPersonal) {
        const novedades = personal.novedades || [];

        personalMap[personal.idPersonal] = {
          idPersonal: personal.idPersonal,
          nombreCompleto: `${personal.primerNombre} ${personal.segundoNombre ?? ''} ${personal.primerApellido} ${personal.segundoApellido ?? ''}`.trim(),
          numeroIdentificacion: personal.numeroIdentificacion,
          idTipoPersonal: personal.idTipoPersonal.idTipoPersonal,
          tipoPersonal: personal.idTipoPersonal.descripcion,
          eventos: [],
        };

        // Añadir novedades como eventos
        for (const novedad of novedades) {

          // Crear el evento
          const evento: Event = {
            idEvento: novedad.idNovedad.toString(),
            tituloEvento: `Novedad - ${novedad.idTipoNovedad.descripcion}`,
            tipoEvento: novedad.idTipoNovedad.descripcion,
            fechaInicioEvento: novedad.fechaInicio,
            fechaFinEvento: novedad.fechaFin,
            horaInicioEvento: novedad.horaInicio,
            horaFinEvento: novedad.horaFin,
            horaInicioEmpleado: novedad.horaInicio,
            horaFinEmpleado: novedad.horaFin,
          };

          // Añadir evento al personal
          personalMap[personal.idPersonal].eventos.push(evento);

        }

      }

      const data = Object.values(personalMap);

      return {
        data,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
          pagination: paginationDto.pagination === PaginationOption.TRUE,
        },
      };

    } catch (error) {
      this.logger.error('Error en findAll:', error);
      throw error;
    }

  }

}
