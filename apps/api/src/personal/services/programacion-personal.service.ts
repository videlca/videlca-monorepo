import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";

import { Personal } from "../entities";
import { PaginationDto } from "../../common/dto/pagination.dto";


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

  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {

    let programacionPersonal;

    if (pagination) {

      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      programacionPersonal = await this.programacionPersonalRepository.find({
        take: limit,
        skip: offset,
        relations: {
          novedades: true,
          programaciones: {
            idOrdenServicioTarifa: {
              idOrdenServicio: true,
            },
          }
        },
        where: {
          laborando: true,
        },
        order: {
          primerApellido: 'ASC',
        }
      });

    }
    else{

      programacionPersonal = await this.programacionPersonalRepository.find({
        relations: {
          novedades: true,
          programaciones: {
            idOrdenServicioTarifa: {
              idOrdenServicio: {
                idLocacion: {
                  idCiudad: true,
                  idCliente: true,
                }
              },
              idTarifa: {
                idServicio: true,
              }
            },
          }
        },
        where: {
          laborando: true,
        },
        order: {
          primerApellido: 'ASC',
        }
      });

    }

    // return programacionPersonal;

    // Transformar resultados al formato requerido
    const personalMap: Record<number, PersonalAsignado> = {};

    for (const personal of programacionPersonal) {

      const novedades = personal.novedades || [];
      const programaciones = personal.programaciones || [];

      personalMap[personal.idPersonal] = {
        idPersonal: personal.idPersonal,
        nombreCompleto: `${personal.primerNombre} ${personal.segundoNombre ?? ''} ${personal.primerApellido} ${personal.segundoApellido ?? ''}`.trim(),
        numeroIdentificacion: personal.numeroIdentificacion,
        idTipoPersonal: personal.idTipoPersonal.idTipoPersonal,
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

        // Crear el evento
        const evento: Event = {
          idEvento: programacion.idProgramacionPersonal.toString(),
          tituloEvento: `Orden Servicio (${programacion.idOrdenServicioTarifa.idOrdenServicio.ordenServicioId.descripcionId}) - ${programacion.idOrdenServicioTarifa.idTarifa.idServicio.codigo} ${programacion.idOrdenServicioTarifa.idTarifa.idServicio.descripcion}`,
          tipoEvento: 'asignado', // Por ahora fijo; podrías mapear según estado
          fechaInicioEvento: programacion.idOrdenServicioTarifa.idOrdenServicio.fechaInicio,
          fechaFinEvento: programacion.idOrdenServicioTarifa.idOrdenServicio.fechaFin,
          horaInicioEvento: programacion.idOrdenServicioTarifa.horaInicio,
          horaFinEvento: programacion.idOrdenServicioTarifa.horaFin,
          horaInicioEmpleado: programacion.horaInicio,
          horaFinEmpleado: programacion.horaFin,
          ordenServicio: {
            ordenServicioId: programacion.idOrdenServicioTarifa.idOrdenServicio.idOrdenServicio,
            estado: programacion.idOrdenServicioTarifa.idOrdenServicio.idEstadoOrdenServicio.nombre,
            fechaCreacion: programacion.idOrdenServicioTarifa.idOrdenServicio.fechaCreacion,
            locacion: {
              nombre: programacion.idOrdenServicioTarifa.idOrdenServicio.idLocacion.nombre,
              direccion: programacion.idOrdenServicioTarifa.idOrdenServicio.idLocacion.direccion,
              telefono: programacion.idOrdenServicioTarifa.idOrdenServicio.idLocacion.telefono,
              nombreCliente: programacion.idOrdenServicioTarifa.idOrdenServicio.idLocacion.idCliente.nombre,
              Ciudad: programacion.idOrdenServicioTarifa.idOrdenServicio.idLocacion.idCiudad.descripcion
            }
          }
        };
  
        // Añadir evento al personal
        personalMap[personal.idPersonal].eventos.push(evento);

      }

    }

    return Object.values(personalMap);

  }

}