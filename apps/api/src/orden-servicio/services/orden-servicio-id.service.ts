import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { PaginationDto } from '../../common/dto';

import { EstadoAppInterface } from '../../common/interfaces/estado-app.interface';

import { SendMailOptions } from '../../common/services/email/email.service';
import { EmailService, CorreoDefaultService } from '../../common/services';

import { OrdenServicioId, OrdenServicioIdAnulado } from '../entities';
import { AnularIdOrdenServicioDto, UpdateOrdenServicioIdDto } from '../dto';


@Injectable()
export class OrdenServicioIdService {

    private readonly logger = new Logger('OrdenServicioIdService');
    
    // Variable para definir cuantos resultados se van a devolver por default en una consulta
    private defaultLimit: number;

    constructor(
        @InjectRepository(OrdenServicioId)
        private OrdenServicioIdRepository: Repository<OrdenServicioId>,
        @InjectRepository(OrdenServicioIdAnulado)
        private OrdenServicioIdAnuladoRepository: Repository<OrdenServicioIdAnulado>,
        private readonly dataSource: DataSource, 
        private readonly correoDefaultService: CorreoDefaultService, // Servicio para obtener el email por defecto
        private readonly emailService: EmailService, // Servicio de email para envio de correos
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
                },
                where: {
                    anulado: false
                }
            });
        
            return ordenServicioIds;
    
        }
    
        return await this.OrdenServicioIdRepository.find({
            order: {
                descripcionId: 'ASC'
            },
            where: {
                anulado: false
            }
        });
        
    }

    // OBTENER TODOS ORDEN DE SERVICIO ID'S ANULADOS
    async findAllAnulados(paginationDto: PaginationDto, pagination: boolean = true) {
    
        if (pagination) {
    
            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const ordenServicioIds = await this.OrdenServicioIdAnuladoRepository.find({
                take: limit,
                skip: offset,
                order: {
                    consecutivo: 'ASC'
                }
            });
        
            return ordenServicioIds;
    
        }
    
        return await this.OrdenServicioIdAnuladoRepository.find({
            order: {
                consecutivo: 'ASC'
            }
        });
        
    }

    // OBTENER ULTIMO ORDEN DE SERVICIO ID
    async getNextConsecutivo(): Promise<number> {

        const result = await this.OrdenServicioIdRepository
            .createQueryBuilder('orden')
            .select('MAX(orden.consecutivo)', 'max')
            .getRawOne();
    
        let next = (result?.max || 0) + 1;
    
        while (true) {
    
            const exists = await this.OrdenServicioIdAnuladoRepository.exists({
                where: {
                    consecutivo: next
                }
            });
    
            if (!exists) {
                return next;
            }
    
            next++;
        }
    }
  
    // OBTENER UNA ORDEN SERVICIO ID POR SU ID
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
    
    // OBTENER UNA ORDEN SERVICIO ID ANULADO POR SU ID
    async findOneAnulado(id: number){
        
        const ordenServicioId = await this.OrdenServicioIdAnuladoRepository.findOne({
            where: { 
                id 
            }
        });

        if(!ordenServicioId) throw new NotFoundException(`Orden de servicio id con id "${id}" no se ha encontrado`);

        const ordenServicioIdEmitido = await this.OrdenServicioIdRepository.findOne({
            where: {
                consecutivo: ordenServicioId.consecutivo
            },
            relations: {
                ordenServicio: true
            }
        });

        return {
            ordenServicioId,
            ordenServicio: ordenServicioIdEmitido?.ordenServicio || null
        };
    
    }
  
    // EDITAR UN ORDEN SERVICIO ID ANULADO 
    async update(id: number, updateOrdenServicioIdDto: UpdateOrdenServicioIdDto) {

        const idExistente = await this.OrdenServicioIdRepository.findOne({
            where: {
                consecutivo: updateOrdenServicioIdDto.consecutivo
            }
        });

        const idAnuladoExistente = await this.OrdenServicioIdAnuladoRepository.findOne({
            where: {
                consecutivo: updateOrdenServicioIdDto.consecutivo
            }
        });

        if (idExistente || idAnuladoExistente) {
            throw new BadRequestException(`El ID ${updateOrdenServicioIdDto.descripcionId} ya existe`);
        }
    
        const ordenServicioIdAnulada = await this.OrdenServicioIdAnuladoRepository.preload({ id, ...updateOrdenServicioIdDto});
    
        if (!ordenServicioIdAnulada) throw new NotFoundException(`Orden de servicio con ID "${updateOrdenServicioIdDto.descripcionId}" no se ha encontrado`);
    
        try {
            
            await this.OrdenServicioIdAnuladoRepository.save(ordenServicioIdAnulada);
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }

    }

    async anularId(anularIdDto: AnularIdOrdenServicioDto){

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
    
            const idExistente = await this.OrdenServicioIdRepository.findOne({
                where: {
                    consecutivo: anularIdDto.consecutivo
                }
            });

            const idAnuladoExistente = await this.OrdenServicioIdAnuladoRepository.findOne({
                where: {
                    consecutivo: anularIdDto.consecutivo
                }
            });

            if (idExistente || idAnuladoExistente) {
                throw new BadRequestException(`El consecutivo ${anularIdDto.consecutivo} ya existe, no se pueden anular consecutivos duplicados`);
            }

            // Anular ID
            const idAnulado = queryRunner.manager.create(OrdenServicioIdAnulado, {
                ...anularIdDto
            });

            await queryRunner.manager.save(idAnulado);

            // NOTIFICAR AANULACION DE ID
            await this.notificationEmail(
                idAnulado.descripcionId,
            )

            await queryRunner.commitTransaction();
          
        } catch (error) {

            await queryRunner.rollbackTransaction();

            throw error;
    
            // this.handleDbExceptions(error);
          
        } finally {

            await queryRunner.release();
    
        }

    }
    
  
    // ELIMINAR UN ORDEN SERVICIO ID ANULADA
    async remove(id: number) {

        const ordenServicioIdAnulada = await this.OrdenServicioIdAnuladoRepository.findOne({
            where: { 
                id 
            }
        });

        if(!ordenServicioIdAnulada) throw new NotFoundException(`Orden de servicio id con id "${id}" no se ha encontrado`);

        const ordenServicioIdEmitido = await this.OrdenServicioIdRepository.findOne({
            where: {
                consecutivo: ordenServicioIdAnulada.consecutivo
            }
        });

        if (ordenServicioIdEmitido) {
            throw new BadRequestException(`Orden de servicio id ${ordenServicioIdAnulada.descripcionId} no se puede eliminar debido a que se esta usando en una orden de servicio`);
        }

        try {
    
            await this.OrdenServicioIdAnuladoRepository.remove(ordenServicioIdAnulada);
            
        } catch (error) {
            
            // Si es una BadRequestException (que viene de la validación de orden de servicio asociada), la re-lanzamos
            if (error instanceof BadRequestException) {
                throw error;
            }
            
            this.logger.error(error);
    
            if(error.errno == 1451){
                throw new BadRequestException(`Orden de servicio id ${ordenServicioIdAnulada.descripcionId} no se puede eliminar debido a que se esta usando en el sistema`); 
            }
            
            throw new InternalServerErrorException(`Unexpected error, check server logs`);
    
        }

    }

    // ENVIAR CORREO PARA INFORMAR ANULACION ID
    private async notificationEmail(
        descripcionId: string,
    ) {        
    
        const html = `
        <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Encabezado -->
            <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 700;">ANULACION ID ORDEN DE SERVICIO</h2>
            </div>
            
            <!-- Cuerpo -->
            <div style="padding: 25px; text-align: center;">
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                Buen día, se ha anulado un ID orden de servicio. <br><br>
                📝 ID Orden de Servicio anulado: <b>${descripcionId}</b>.
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
    
        const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): anulacion ID orden de servicio ${descripcionId}`;
    
        const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.ANULACION_ID_ORDEN_SERVICIO);
    
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

}
