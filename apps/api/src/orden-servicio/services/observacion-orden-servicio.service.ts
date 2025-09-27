import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { User } from '../../users/entities/user.entity';

import { Roles } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';
import { EstadoAppInterface } from '../../common/interfaces/estado-app.interface';

import { SendMailOptions } from '../../common/services/email/email.service';
import { EmailService, CorreoDefaultService } from '../../common/services';

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
        private readonly dataSource: DataSource, 
        private readonly ordenServicioService: OrdenServicioService,
        private readonly correoDefaultService: CorreoDefaultService, // Servicio para obtener el email por defecto
        private readonly emailService: EmailService, // Servicio de email para envio de correos
        private readonly configService: ConfigService,
    ){
        // Inicializar variable con el valor que se estipulo en el archivo .env
        this.defaultLimit = this.configService.get<number>('defaultLimit');
    }
  
    // CREAR UNA OBSERVACION A UNA ORDEN
    async create(createObservacionOrdenServicioDto: CreateObservacionOrdenServicioDto, user: User) {

        // OBTENER ORDEN SERVICIO
        const ordenServicio = await this.ordenServicioService.findOne(createObservacionOrdenServicioDto.idOrdenServicio);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {

            // Crear observacion
            const observacionOrdenServicio = queryRunner.manager.create(ObservacionOrdenServicio, {
                descripcion: createObservacionOrdenServicioDto.descripcion,
                idUsuario: user,
                idOrdenServicio: ordenServicio
            });

            await queryRunner.manager.save(observacionOrdenServicio);

            // NOTIFICAR CREACION DE OBSERVACION
            await this.notificationEmail(
                ordenServicio.idOrdenServicio,
                `${user.primerApellido} ${user.primerNombre}`,
                createObservacionOrdenServicioDto.descripcion
            )

            await queryRunner.commitTransaction();
    
            return observacionOrdenServicio;
    
        } catch (error) {

            await queryRunner.rollbackTransaction();
            
            this.handleDbExceptions(error);
    
        } finally {

            await queryRunner.release();
    
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

    // ENVIAR CORREO PARA INFORMAR CREACION DE COMENTARIO/OBSERVACION
      private async notificationEmail(
        idOrdenServicio: number,
        nombreUsuario: string,
        comentario: string
      ) {        
    
        const html = `
        <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Encabezado -->
            <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CREACION OBSERVACION EN ORDEN DE SERVICIO</h2>
            </div>
            
            <!-- Cuerpo -->
            <div style="padding: 25px; text-align: center;">
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                Buen día, se ha creado una nueva observacion en una orden de servicio. <br><br>
                📝 ID Orden de Servicio: <b>${idOrdenServicio}</b>. <br><br>
                👤 Usuario que creo la observacion: ${nombreUsuario}. <br><br>
                📑 Observacion: ${comentario}
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #555;">
                Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
              </p>
              <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
              <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
            </div>
        
            <!-- Imagen -->
            <div style="text-align: center; padding: 15px;">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                    alt="videlca" 
                    style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
            </div>
        
            <!-- Mensaje de aplicación -->
            <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
              📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
            </div>
        
            <!-- Pie de página -->
            <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
              © 2025 Videlca Ltda. - Seguridad Física y Electrónica
            </div>
            
          </div>
        </div>
        `;
    
        const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): creacion de observacion en orden de servicio ${idOrdenServicio}`;
    
        const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.COMENTARIOS_ORDEN_SERVICIO);
    
        // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
        const options: SendMailOptions = {
            to: emails,
            subject: subject,
            htmlBody: html
        }
    
        // Enviamos correo para notificar al usuario
        const isEmailSend = await this.emailService.sendEmail(options);
    
        if (!isEmailSend){
            throw new InternalServerErrorException(`Error al enviar correo de notificacion a los emails ${emails}, revisar correo si esta bien escrito`);
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
