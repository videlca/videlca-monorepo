import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity';

import { Roles } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { OrdenServicioService } from './orden-servicio.service';
import { ObservacionOrdenServicio } from '../entities';
import { CreateObservacionOrdenServicioDto, UpdateObservacionOrdenServicioDto } from '../dto';


@Injectable()
export class ObservacionesOrdenServicioService {

    private readonly logger = new Logger('ObservacionesOrdenServicioService');
    
    // Variable para definir cuantos resultados se van a devolver por default en una consulta
    private defaultLimit: number;

    constructor(
        @InjectRepository(ObservacionOrdenServicio)
        private observacionOrdenServicioRepository: Repository<ObservacionOrdenServicio>,
        private readonly ordenServicioService: OrdenServicioService,
        private readonly configService: ConfigService,
    ){
        // Inicializar variable con el valor que se estipulo en el archivo .env
        this.defaultLimit = this.configService.get<number>('defaultLimit');
    }
  
    // CREAR UNA OBSERVACION A UNA ORDEN
    async create(createObservacionOrdenServicioDto: CreateObservacionOrdenServicioDto, user: User) {

        // OBTENER ORDEN SERVICIO
        const ordenServicio = await this.ordenServicioService.findOne(createObservacionOrdenServicioDto.idOrdenServicio);
        
        try {
            
            const observacionOrdenServicio = this.observacionOrdenServicioRepository.create({
                descripcion: createObservacionOrdenServicioDto.descripcion,
                idUsuario: user,
                idOrdenServicio: ordenServicio
            });
    
            await this.observacionOrdenServicioRepository.save(observacionOrdenServicio);
    
            return observacionOrdenServicio;
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }

    }
  
    // OBTENER TODAS LAS OBSERVACIONES DE UNA ORDEN DE SERVICIO
    async findAll(idOrdenServicio: number, paginationDto: PaginationDto, pagination: boolean = true) {
    
        const queryBuilder = this.observacionOrdenServicioRepository.createQueryBuilder('obs')
            .where('obs.idOrdenServicio = :idOrdenServicio', { idOrdenServicio })
            .orderBy('obs.fechaCreacion', 'ASC') // Opcional: ordenar por más reciente
            .leftJoinAndSelect('obs.idUsuario', 'u')

        if (pagination) {
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            queryBuilder.take(limit).skip(offset);
        }
        
        return await queryBuilder.getMany();

    }
  
    // OBTENER UNA OBSERVACION POR SU ID
    async findOne(id: number){
        
        const observacionOrdenServicio = await this.observacionOrdenServicioRepository.findOneBy({idObservacionOrdenServicio: id});
    
        if(!observacionOrdenServicio) throw new NotFoundException(`Observacion orden servicio con id "${id}" no se ha encontrado`);
    
        return observacionOrdenServicio;
    
    }
  
    // ACTUALIZAR UNA OBSERVACION REALIZADA POR EL USER
    async update(id: number, updateObservacionOrdenServicioDto: UpdateObservacionOrdenServicioDto, user: User) {
    
        // Buscar observacion a actualizar
        const observacionOrdenServicio = await this.findOne(id);
        
        // la observacion solo se podra actualizar si es el user que lo creo, de otra forma marcara error.
        if(observacionOrdenServicio.idUsuario.idUser != user.idUser){

            throw new UnauthorizedException('No tienes permiso para editar esta observacion de la orden de servicio ');
        
        }
    
        try {
            
            // Actualizar campo descripcion
            observacionOrdenServicio.descripcion = updateObservacionOrdenServicioDto.descripcion;
        
            await this.observacionOrdenServicioRepository.save(observacionOrdenServicio);
            
            return observacionOrdenServicio;
    
        } catch (error) {
    
            console.log(error);
            
            throw new InternalServerErrorException("No se logro actualizar la observacion de la orden de servicio con exito")
    
        }

    }
  
    // ELIMINAR OBSERVACION
    async remove(id: number, user: User) {
    
        // Buscar observacion a eliminar
        const observacionOrdenServicio = await this.findOne(id);
    
        let isUser: boolean = true;
        
        // Validamos que la observacion sea de la persona que creo la observacion
        if(observacionOrdenServicio.idUsuario.idUser != user.idUser){
            isUser = false;
        }
        
        // Solo podra eliminar el comentario si fue el user que lo creo o si el user tiene rol de super admin
        if(!isUser && user.idRol.nombreRol != Roles.SUPER_ADMIN){
            throw new UnauthorizedException('No tienes permiso para eliminar esta observacion de la orden de servicio');
        }
        
        try {
            
            // eliminamos la observacion
            await this.observacionOrdenServicioRepository.remove(observacionOrdenServicio);
    
        } catch (error) {
            
            throw new InternalServerErrorException("No se logro eliminar la observacion de la orden de servicio con exito")
    
        }

    }

    private handleDbExceptions(error: any){
    
        if (error.errno === 1062)
            throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);
  
        this.logger.error(error);
  
        throw new InternalServerErrorException('Unexpected error, check server logs');
  
    }
  
    // ELIMINAR TODAS LAS OBSERVACIONES
    // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA OBSERVACIONES ORDEN SERVICIO
    async deleteAllComentarios(){
    
        const query = this.observacionOrdenServicioRepository.createQueryBuilder('observacion-orden-servicio');
        
        try {
            
            return await query
            .delete()
            .where({})
            .execute();
        
        } catch (error) {
            
            throw new InternalServerErrorException('Ocurrio un error borrando tabla observaciones orden servicio');
        
        }
    
    }

}
