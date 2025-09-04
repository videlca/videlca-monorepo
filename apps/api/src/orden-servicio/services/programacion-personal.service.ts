import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ProgramacionPersonal } from "../entities";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { PaginationDto } from "src/common/dto/pagination.dto";

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
}

export interface PersonalAsignado {
  idPersonal: number;
  nombreCompleto: string;
  numeroIdentificacion: string;
  idTipoPersonal: number;
  eventos: Event[];
}

@Injectable()
export class ProgramacionPersonalService {
  private readonly logger = new Logger('ProgramacionPersonalService');
  // Variable para definir cuantos resultados se van a devolver por default en una consulta
  private defaultLimit: number;

  constructor(
    @InjectRepository(ProgramacionPersonal)
    private readonly programacionPersonalRepository: Repository<ProgramacionPersonal>,
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
          idOrdenServicioTarifa: {
            idOrdenServicio: true,
          },
          idPersonal: true
        },
        order: {
          horaInicio: 'ASC'
        }
      });

    }
    else{

      programacionPersonal = await this.programacionPersonalRepository.find({
        relations: {
          idOrdenServicioTarifa: {
            idOrdenServicio: true,
            idTarifa: true
          },
          idPersonal: true
        },
        order: {
          horaInicio: 'ASC'
        }
      });

    }

    console.log(programacionPersonal);

    // return programacionPersonal;

    // Transformar resultados al formato requerido
    const personalMap: Record<number, PersonalAsignado> = {};

    for (const prog of programacionPersonal) {

      const persona = prog.idPersonal;
      const orden = prog.idOrdenServicioTarifa.idOrdenServicio;

      // Si no existe aún el personal en el map, crearlo
      if (!personalMap[persona.idPersonal]) {

        personalMap[persona.idPersonal] = {
          idPersonal: persona.idPersonal,
          nombreCompleto: `${persona.primerNombre} ${persona.segundoNombre ?? ''} ${persona.primerApellido} ${persona.segundoApellido ?? ''}`.trim(),
          numeroIdentificacion: persona.numeroIdentificacion,
          idTipoPersonal: persona.idTipoPersonal.idTipoPersonal,
          eventos: [],
        };

      }

      // Crear el evento
      const evento: Event = {
        idEvento: orden.idOrdenServicio.toString(),
        tituloEvento: `${orden.ordenServicioId.descripcionId} - (${prog.idOrdenServicioTarifa.idTarifa.idServicio.codigo}) ${prog.idOrdenServicioTarifa.idTarifa.idServicio.descripcion}`,
        tipoEvento: 'asignado', // Por ahora fijo; podrías mapear según estado
        fechaInicioEvento: orden.fechaInicio,
        fechaFinEvento: orden.fechaFin,
        horaInicioEvento: prog.idOrdenServicioTarifa.horaInicio,
        horaFinEvento: prog.idOrdenServicioTarifa.horaFin,
        horaInicioEmpleado: prog.horaInicio,
        horaFinEmpleado: prog.horaFin,
      };

      // Añadir evento al personal
      personalMap[persona.idPersonal].eventos.push(evento);

    }

    return Object.values(personalMap);

  }

}