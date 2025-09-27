import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { EmailService } from '../email/email.service';
import { SendMailOptions } from '../../services/email/email.service';
import { EstadoApp, CorreoDefault, EstadoOrdenServicio } from '../../entities';

import { PaginationDto } from '../../dto';
import { EstadoAppInterface } from '../../interfaces/estado-app.interface';
import { EstadoOrdenServicio as EstadoOrdenServicioInterface } from '../../interfaces/estado-orden-servicio.interface';

import { CorreoDefaultDto, CreateCorreoDefaultDto } from '../../dto';

@Injectable()
export class CorreoDefaultService {

    private readonly logger = new Logger('CorreoDefaultService');
      
    private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta

    constructor(
        @InjectRepository(EstadoApp)
        private readonly estadoAppRepository: Repository<EstadoApp>,
        @InjectRepository(EstadoOrdenServicio)
        private readonly estadoOrdenServicioRepository: Repository<EstadoOrdenServicio>,
        @InjectRepository(CorreoDefault)
        private readonly correoDefaultRepository: Repository<CorreoDefault>,
        private readonly emailService: EmailService, // Servicio de email para envio de correos
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
    ) {
        this.defaultLimit = this.configService.get<number>('defaultLimit');
    }

    async create(createCorreoDefaultDto: CorreoDefaultDto) {

        const { correos = [] } = createCorreoDefaultDto;

        if (correos.length <= 0){
            throw new BadRequestException(`Se debe añadir al menos un correo`);
        }

        const uniqueCorreos = this.removeDuplicatesByEmail(correos);

        // Validar que todos los estados de orden estén cubiertos
        await this.validateEstadosOrdenCompletos(uniqueCorreos);
        
        // Validar que todos los estados de app estén cubiertos
        await this.validateEstadosAppCompletos(uniqueCorreos);
    
        // Usar QueryRunner para transacción manual
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        // Obtener correos existentes con sus estados
        const correosExistentes = await queryRunner.manager.find(CorreoDefault, {
            relations: {
                estados: true,
                estadosApp: true
            }
        });

        const crearCorreos = await this.analizarCambiosCorreos(correosExistentes, uniqueCorreos);

        // Eliminar correos existentes
        await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from(CorreoDefault)
            .where("1=1")
            .execute();
    
        try {

            // Procesar cada correo
            const correosCreados: CorreoDefault[] = [];
            
            for (const correoDto of uniqueCorreos) {

                if (correoDto.estados.length <= 0){

                    throw new BadRequestException(`Se debe enviar al menos un estado en cada correo`);

                }
        
                // Validar que los estados existen
                // Busca los estados por sus IDs
                const estados = await this.estadoOrdenServicioRepository.findBy({
                    idEstadoOrdenServicio: In(correoDto.estados)
                });
        
                if (!estados.length) {
                    throw new NotFoundException(`No se encontraron estados con los IDs proporcionados para el correo ${correoDto.email}`);
                }
            
                if (estados.length !== correoDto.estados.length) {
        
                    const estadosEncontrados = estados.map(e => e.idEstadoOrdenServicio);
        
                    const estadosNoEncontrados = correoDto.estados.filter(
                        id => !estadosEncontrados.includes(id)
                    );
        
                    throw new BadRequestException(`Los siguientes estados no existen: ${estadosNoEncontrados.join(', ')}`);
        
                }

                // Validar que los estados de app existen
                // Busca los estados por sus IDs
                const estadosApp = await this.estadoAppRepository.findBy({
                    idEstadoApp: In(correoDto.estadosApp)
                });
        
                if (!estadosApp.length) {
                    throw new NotFoundException(`No se encontraron estados de app con los IDs proporcionados para el correo ${correoDto.email}`);
                }
            
                if (estadosApp.length !== correoDto.estadosApp.length) {
        
                    const estadosAppEncontrados = estadosApp.map(e => e.idEstadoApp);
        
                    const estadosAppNoEncontrados = correoDto.estadosApp.filter(
                        id => !estadosAppEncontrados.includes(id)
                    );
        
                    throw new BadRequestException(`Los siguientes estados de app no existen: ${estadosAppNoEncontrados.join(', ')}`);
        
                }
    
                // Crear el correo
                const correo = queryRunner.manager.create(CorreoDefault, {
                    descripcion: correoDto.descripcion,
                    email: correoDto.email,
                    estados: estados,
                    estadosApp: estadosApp
                });
    
                const savedCorreo = await queryRunner.manager.save(CorreoDefault, correo);
                
                // Validar si este correo está en la lista de envío
                const debeEnviarCorreo = crearCorreos.some(emailEnvio => 
                    emailEnvio.email === correo.email
                );
                
                if (debeEnviarCorreo) {
                    // ENVIAR EMAIL PARA SABER SI CORREO FUNCIONA
                    await this.notificationEmail(correoDto);
                }
            
                correosCreados.push(savedCorreo);

            }
    
            await queryRunner.commitTransaction();
    
            // Retornar cantidad de correos creados
            return {
                message: `Se crearon ${correos.length} correos`
            }

        } catch (error) {

            await queryRunner.rollbackTransaction();

            throw error;

        } finally {

            await queryRunner.release();

        }
    }

    private removeDuplicatesByEmail(correos: CreateCorreoDefaultDto[]): CreateCorreoDefaultDto[] {

        const seen = new Set<string>();

        return correos.filter(correo => {

            const normalizedEmail = correo.email.toLowerCase().trim();
            
            if (seen.has(normalizedEmail)) {
                return false;
            }
            
            seen.add(normalizedEmail);
            
            return true;
        });
    }

    private async validateEstadosOrdenCompletos(correos: CreateCorreoDefaultDto[]): Promise<void> {

        // 1. Obtener todos los estados existentes
        const todosLosEstados = await this.estadoOrdenServicioRepository.find({
            where: { estado: true }
        });
    
        if (todosLosEstados.length === 0) {
            throw new BadRequestException('No hay estados configurados en el sistema');
        }

    
        // 2. Recopilar todos los estados asignados en los correos
        const estadosAsignados = new Set<number>();
        
        correos.forEach(correo => {
            correo.estados.forEach(estadoId => {
                estadosAsignados.add(estadoId);
            });
        });

    
        // 3. Verificar que todos los estados estén cubiertos
        const estadosRequeridos = new Set(
            todosLosEstados.map(estado => estado.idEstadoOrdenServicio)
        );
    
        const estadosFaltantes = [...estadosRequeridos].filter(
            estadoId => !estadosAsignados.has(estadoId)
        );

    
        if (estadosFaltantes.length > 0) {
    
            throw new BadRequestException(
                `Se deben cubrir todos los estados de orden de servicio. Estados faltantes: ${
                    estadosFaltantes.map(id => {
                        const estado = todosLosEstados.find(e => e.idEstadoOrdenServicio === id);
                        return estado?.descripcion || `ID: ${id}`;
                    }).join(', ')
                }`
            );
        }
    
        // 4. Validar que todos los estados existen
        const estadosInvalidos = [...estadosAsignados].filter(
            estadoId => !estadosRequeridos.has(estadoId)
        );

    
        if (estadosInvalidos.length > 0) {
            throw new BadRequestException(
                `Estados inválidos encontrados: ${
                    estadosInvalidos.map(id => {
                        const estado = todosLosEstados.find(e => e.idEstadoOrdenServicio === id);
                        return estado?.descripcion || `ID: ${id}`;
                    }).join(', ')
                }`
            );
        }
    }
    
    private async validateEstadosAppCompletos(correos: CreateCorreoDefaultDto[]): Promise<void> {

        // 1. Obtener todos los estados existentes
        const todosLosEstados = await this.estadoAppRepository.find({
            where: { estado: true }
        });
    
        if (todosLosEstados.length === 0) {
            throw new BadRequestException('No hay estados configurados en el sistema');
        }
    
        // 2. Recopilar todos los estados asignados en los correos
        const estadosAsignados = new Set<number>();
        
        correos.forEach(correo => {
            correo.estadosApp.forEach(estadoId => {
                estadosAsignados.add(estadoId);
            });
        });
    
        // 3. Verificar que todos los estados estén cubiertos
        const estadosRequeridos = new Set(
            todosLosEstados.map(estado => estado.idEstadoApp)
        );

    
        const estadosFaltantes = [...estadosRequeridos].filter(
            estadoId => !estadosAsignados.has(estadoId)
        );
    
        if (estadosFaltantes.length > 0) {
    
            throw new BadRequestException(
                `Se debe cubrir todos los estados de aplicacion. Estados faltantes: ${
                    estadosFaltantes.map(id => {
                        const estado = todosLosEstados.find(e => e.idEstadoApp === id);
                        return estado?.descripcion || `ID: ${id}`;
                    }).join(', ')
                }`
            );
        }
    
        // 4. Validar que todos los estados existen
        const estadosInvalidos = [...estadosAsignados].filter(
            estadoId => !estadosRequeridos.has(estadoId)
        );
    
        if (estadosInvalidos.length > 0) {
            throw new BadRequestException(
                `Estados inválidos encontrados: ${
                    estadosInvalidos.map(id => {
                        const estado = todosLosEstados.find(e => e.idEstadoApp === id);
                        return estado?.descripcion || `ID: ${id}`;
                    }).join(', ')
                }`
            );
        }
    }

    private async analizarCambiosCorreos(correosExistentes: CorreoDefault[], correosNuevos: CreateCorreoDefaultDto[]){
    
        const correosACrear: CreateCorreoDefaultDto[] = [];
    
        // Crear mapas para comparación eficiente
        const correosExistentesMap = new Map(
            correosExistentes.map(correo => [correo.email, correo])
        );
    
        // Encontrar correos a crear 
        for (const correoNuevo of correosNuevos) {
            
            const correoExistente = correosExistentesMap.get(correoNuevo.email);
    
            if (!correoExistente) {
                // Es un correo nuevo
                correosACrear.push(correoNuevo);
            } 
        }
    
        return correosACrear;
    }

    // ENVIAR CORREO PARA INFORMAR REGISTRO DE NOTIFICACIONES EN GEVID Y SABER QUE SI ESTA FUNCIONANDO EL CORREO
    private async notificationEmail(correoInfo: CreateCorreoDefaultDto) {

        const nombreCompleto = `${correoInfo.descripcion}`;        
        
        const html = `
        <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Encabezado -->
            <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CORREO VINCULADO A LAS NOTIFICACIONES DE GEVID</h2>
            </div>
            
            <!-- Cuerpo -->
            <div style="padding: 25px; text-align: center;">
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                Buen día <strong>${nombreCompleto}</strong>, este correo ha sido añadido en el sistema de notificaciones de <b>Videlca</b>.
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

        const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): correo electronico vinculado a la aplicacion`;

        // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
        const options: SendMailOptions = {
            to: correoInfo.email,
            subject: subject,
            htmlBody: html
        }
    
        // Enviamos correo para notificar al usuario
        const isEmailSend = await this.emailService.sendEmail(options);
    
        if (!isEmailSend){
            throw new InternalServerErrorException(`Error al enviar correo de notificacion al email ${correoInfo.email}, revisar correo si esta bien escrito`);
        }

    }

    // Obtener todos los correos default
    async findAll(paginationDto: PaginationDto, pagination: boolean = true) {

        if (pagination) {

            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const correosDefault = await this.correoDefaultRepository.find({
                take: limit,
                skip: offset,
                order: {
                    descripcion: 'ASC'
                },
                relations: {
                    estados: true,
                    estadosApp: true
                }
            });
  
            return correosDefault;

        }    
        
        return await this.correoDefaultRepository.find({
            relations: {
                estados: true,
                estadosApp: true
            },
            order: {
                descripcion: 'ASC'
            }
        });
    }
    
    // Obtener todos los correos default por estado de app
    async findAllByEstadoApp(estadoApp: EstadoAppInterface) {  
        
        const correosDefault = await this.correoDefaultRepository.find({
            where: {
                estadosApp: {
                    nombre: estadoApp
                }
            },
            relations: {
                estados: true,
                estadosApp: true
            },
            order: {
                descripcion: 'ASC'
            }
        });

        if (correosDefault.length === 0) {
            throw new NotFoundException(`No hay correos asociados al estado de app "${estadoApp}"`);
        }

        return correosDefault.map(correo => correo.email);

    }
    
    // Obtener todos los correos defaultnpor estado de orden de servicio
    async findAllByEstadoOrden(estadoOrden: EstadoOrdenServicioInterface) {  
        
        const correosDefault = await this.correoDefaultRepository.find({
            where: {
                estados: {
                    nombre: estadoOrden
                }
            },
            relations: {
                estados: true,
                estadosApp: true
            },
            order: {
                descripcion: 'ASC'
            }
        });

        if (correosDefault.length === 0) {
            throw new NotFoundException(`No hay correos asociados al estado de orden "${estadoOrden}"`);
        }

        return correosDefault.map(correo => correo.email);

    }

    // Obtener un correo default por id
    async findOne(id: number) {

        const correoDefault = await this.correoDefaultRepository.findOne({
            where: { 
                idCorreoDefault: id 
            },
            relations: {
                estados: true,
                estadosApp: true
            }
        });
        
        if (!correoDefault) {
            throw new NotFoundException(`Correo con id "${id}" no encontrado`);
        }
        
        return correoDefault;
    }

}