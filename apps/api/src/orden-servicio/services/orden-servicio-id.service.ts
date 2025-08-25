import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginationDto } from '../../common/dto';

import { OrdenServicioId } from '../entities';
import { AnularIdOrdenServicioDto, UpdateOrdenServicioIdDto } from '../dto';


@Injectable()
export class OrdenServicioIdService {

    private readonly logger = new Logger('OrdenServicioIdService');
    
    // Variable para definir cuantos resultados se van a devolver por default en una consulta
    private defaultLimit: number;

    constructor(
        @InjectRepository(OrdenServicioId)
        private OrdenServicioIdRepository: Repository<OrdenServicioId>,
        private readonly configService: ConfigService,
    ){
        // Inicializar variable con el valor que se estipulo en el archivo .env
        this.defaultLimit = this.configService.get<number>('defaultLimit');
    }
  
    // OBTENER TODOS ORDEN DE SERVICIO ID'S
    async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
        if (pagination) {
    
            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const ordenServicioIds = await this.OrdenServicioIdRepository.find({
                take: limit,
                skip: offset,
                order: {
                    descripcionId: 'ASC'
                }
            });
        
            return ordenServicioIds;
    
        }
    
        return await this.OrdenServicioIdRepository.find({
            order: {
                descripcionId: 'ASC'
            }
        });
        
    }
  
    // OBTENER UNA OBSERVACION POR SU ID
    async findOne(id: number){
        
        const ordenServicioId = await this.OrdenServicioIdRepository.findOne({
            where: { 
                idOrdenServicioId: id 
            },
            relations: {
                ordenServicio: true
            }
        });

        if(!ordenServicioId) throw new NotFoundException(`Orden de servicio id con id "${id}" no se ha encontrado`);

        return ordenServicioId;
    
    }
  
    // EDITAR UN TIPO ID 
    async update(id: number, updateOrdenServicioIdDto: UpdateOrdenServicioIdDto) {
    
        const ordenServicioId = await this.OrdenServicioIdRepository.preload({idOrdenServicioId: id, ...updateOrdenServicioIdDto});
    
        if (!ordenServicioId) throw new NotFoundException(`Orden de servicio con ID "${updateOrdenServicioIdDto.descripcionId}" no se ha encontrado`);
    
        try {
            
            await this.OrdenServicioIdRepository.save(ordenServicioId);
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }

    }

    async anularId(anularIdDto: AnularIdOrdenServicioDto){

    try {

      const idExistente = await this.OrdenServicioIdRepository.findOne({
        where: {
          descripcionId: anularIdDto.descripcionId
        },
        relations: {
          ordenServicio: true
        }
      });

      if (idExistente) {
        
        // Si existe y tiene orden asociada, error
        if (idExistente.ordenServicio) {
          throw new BadRequestException(`No se puede anular el ID "${anularIdDto.descripcionId}" porque tiene una orden asociada`);
        }

        // Si existe pero no tiene orden, también es error (ya está anulado)
        throw new BadRequestException(`El ID "${anularIdDto.descripcionId}" ya existe`);
      }

      const idAnulado = this.OrdenServicioIdRepository.create({
        ...anularIdDto,
        anulado: true
      });

      await this.OrdenServicioIdRepository.save(idAnulado);
      
    } catch (error) {

      this.handleDbExceptions(error);
      
    }

  }
    
  
    // ELIMINAR UN ORDEN SERVICIO ID
    async remove(id: number) {
    
        const ordenServicioId = await this.findOne(id);
        
        try {

            if(ordenServicioId.ordenServicio){
                
                throw new BadRequestException(`Orden de servicio id ${ordenServicioId.descripcionId} no se puede eliminar debido a que se esta usando en una orden de servicio`); 
            
            }
    
            await this.OrdenServicioIdRepository.remove(ordenServicioId);
            
        } catch (error) {
            
            // Si es una BadRequestException (que viene de la validación de orden de servicio asociada), la re-lanzamos
            if (error instanceof BadRequestException) {
                throw error;
            }
            
            this.logger.error(error);
    
            if(error.errno == 1451){
                throw new BadRequestException(`Orden de servicio id ${ordenServicioId.descripcionId} no se puede eliminar debido a que se esta usando en el sistema`); 
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

}
