import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";

import { Personal } from "../entities";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { PaginationOption } from '../../common/interfaces/pagination.interface';


interface Locacion {
  nombre: string;
  direccion: string;
  telefono: string;
  nombreCliente: string;
  Ciudad: string;
}

interface OrdenServicio {
  ordenServicioId: string;
  estado: string;
  fechaCreacion: string;
  locacion: Locacion;
}

interface Event {
  idEvento: string;
  tituloEvento: string;
  tipoEvento: 'asignado' | 'permiso' | 'vacaciones' | 'incapacitado';
  fechaInicioEvento: Date;
  fechaFinEvento: Date;
  horaInicioEvento: string;
  horaFinEvento: string;
  horaInicioEmpleado: string;
  horaFinEmpleado: string;
  ordenServicio?: OrdenServicio;
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
          programaciones: {
            idOrdenServicioTarifa: {
              idOrdenServicio: {
                idLocacion: {
                  idCiudad: true,
                  idCliente: true,
                },
              },
              idTarifa: {
                idServicio: true,
              },
            },
          },
        },
        where: {
          laborando: true,
        },
        order: {
          primerApellido: 'ASC' as const,
        },
      };
  
      let programacionPersonal = [];
      let total = 0;

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
        const programaciones = personal.programaciones || [];
  
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
  
        // Añadir programaciones como eventos
        for (const programacion of programaciones) {
          if (!programacion.idOrdenServicioTarifa || !programacion.idOrdenServicioTarifa.idOrdenServicio) {
            continue;
          }
  
          const ordenServicio = programacion.idOrdenServicioTarifa.idOrdenServicio;
          // Crear el evento
          const evento: Event = {
            idEvento: programacion.idProgramacionPersonal.toString(),
            tituloEvento: `Orden Servicio (${ordenServicio.ordenServicioId?.descripcionId || ordenServicio.idOrdenServicio}) - ${programacion.idOrdenServicioTarifa.idTarifa?.idServicio?.codigo || ''} ${programacion.idOrdenServicioTarifa.idTarifa?.idServicio?.descripcion || ''}`,
            tipoEvento: 'asignado', // Por ahora fijo; podrías mapear según estado
            fechaInicioEvento: ordenServicio.fechaInicioOrden,
            fechaFinEvento: ordenServicio.fechaFinOrden,
            horaInicioEvento: programacion.idOrdenServicioTarifa.horaInicio,
            horaFinEvento: programacion.idOrdenServicioTarifa.horaFin,
            horaInicioEmpleado: programacion.horaInicio,
            horaFinEmpleado: programacion.horaFin,
            ordenServicio: {
              ordenServicioId: ordenServicio.idOrdenServicio,
              estado: ordenServicio.idEstadoOrdenServicio?.nombre || 'Sin estado',
              fechaCreacion: ordenServicio.fechaCreacion,
              locacion: {
                nombre: ordenServicio.idLocacion?.nombre || 'Sin nombre',
                direccion: ordenServicio.idLocacion?.direccion || 'Sin dirección',
                telefono: ordenServicio.idLocacion?.telefono || 'Sin teléfono',
                nombreCliente: ordenServicio.idLocacion?.idCliente?.nombre || 'Sin cliente',
                Ciudad: ordenServicio.idLocacion?.idCiudad?.descripcion || 'Sin ciudad'
              }
            }
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