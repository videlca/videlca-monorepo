import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ProgramacionPersonal } from "../entities";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { PaginationDto } from "src/common/dto/pagination.dto";

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
    if (pagination) {
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      const programacionPersonal = await this.programacionPersonalRepository.find({
        take: limit,
        skip: offset,
        relations: {
          idOrdenServicioTarifa: true,
          idPersonal: true
        },
        order: {
          horaInicio: 'ASC'
        }
      });
      return programacionPersonal;
    }
    return await this.programacionPersonalRepository.find({
      relations: {
        idOrdenServicioTarifa: true,
        idPersonal: true
      },
      order: {
        horaInicio: 'ASC'
      }
    });
  }
}