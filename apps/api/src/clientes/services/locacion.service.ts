import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { UbicacionService, EmailService } from '../../common/services';
import { SendMailOptions } from '../../common/services/email/email.service';
import { EstadoOrdenServicio } from '../../common/entities';

import { PaginationDto } from '../../common/dto';

import { Locacion, Correo } from '../entities';
import { ClientesService } from '../services';

import { CreateLocacionDto, UpdateLocacionDto, CreateCorreoDto } from '../dto';

@Injectable()
export class LocacionService {

    private readonly logger = new Logger('LocacionService');
      
    private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta

    constructor(
        @InjectRepository(Locacion)
        private readonly locacionRepository: Repository<Locacion>,
        @InjectRepository(EstadoOrdenServicio)
        private readonly estadoOrdenServicioRepository: Repository<EstadoOrdenServicio>,
        private readonly ubicacionService: UbicacionService,   
        private readonly clienteService: ClientesService,
        private readonly emailService: EmailService, // Servicio de email para envio de correos
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
    ) {
        this.defaultLimit = this.configService.get<number>('defaultLimit');
    }

    async create(createLocacionDto: CreateLocacionDto) {

        const { correos = [], ...locacionData } = createLocacionDto;

        // Validar que todos los estados estén cubiertos
        await this.validateEstadosCompletos(createLocacionDto.correos);
    
        // Usar QueryRunner para transacción manual
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        // Validar que la ciudad existe
        const ciudad = await this.ubicacionService.findOneCiudad(createLocacionDto.idCiudad);
    
        // Validar que el cliente existe
        const cliente = await this.clienteService.findOne(createLocacionDto.idCliente);
    
        try {

            // Crear la locación sin los correos primero
            const locacion = queryRunner.manager.create(Locacion, {
                ...locacionData,
                idCiudad: ciudad,
                idCliente: cliente,
            });

            const savedLocacion = await queryRunner.manager.save(Locacion, locacion);

            // Procesar cada correo
            const correosCreados: Correo[] = [];

            const uniqueCorreos = this.removeDuplicatesByEmail(correos);
            
            for (const correoDto of uniqueCorreos) {
        
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
    
                // Crear el correo
                const correo = queryRunner.manager.create(Correo, {
                    nombre: correoDto.nombre,
                    apellido: correoDto.apellido,
                    email: correoDto.email,
                    locacion: savedLocacion,
                    estados: estados,
                });
    
                const savedCorreo = await queryRunner.manager.save(Correo, correo);

                // ENVIAR EMAIL PARA SABER SI CORREO FUNCIONA
                await this.notificationEmail(correoDto);
            
                correosCreados.push(savedCorreo);

            }

            // Asignar los correos creados a la locación
            // savedLocacion.correos = correosCreados;
    
            await queryRunner.commitTransaction();
    
            // Retornar la locación con todos sus datos relacionados
            return await this.locacionRepository.findOne({
                where: { idLocacion: savedLocacion.idLocacion },
                relations: ['correos', 'correos.estados'],
            });

        } catch (error) {

            await queryRunner.rollbackTransaction();

            throw error;

        } finally {

            await queryRunner.release();

        }
    }

    private removeDuplicatesByEmail(correos: CreateCorreoDto[]): CreateCorreoDto[] {

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

    private async validateEstadosCompletos(correos: CreateCorreoDto[]): Promise<void> {

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
                `La locación debe cubrir todos los estados. Estados faltantes: ${
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

    // ENVIAR CORREO PARA INFORMAR REGISTRO DE NOTIFICACIONES EN GEVID Y SABER QUE SI ESTA FUNCIONANDO EL CORREO
    private async notificationEmail(correoInfo: CreateCorreoDto) {

        const nombreCompleto = `${correoInfo.nombre} ${correoInfo.apellido}`;        
    
        const html = `
        <div style="background-color: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); padding: 20px; max-width: 600px; margin: 20px auto; text-align: center; font-family: 'Poppins', sans-serif;">
            <h2 style="margin-bottom: 20px; color: #333; font-weight: 700;">CORREO INFORMATIVO VIDELCA - GEVID 👮‍♂️</h2>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">Buen día ${nombreCompleto}, este correo ha sido añadido en el sistema de notificaciones de Videlca</p>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">Si usted no brindo su correo para el sistema de notificaciones, omiste este mensaje.</p>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">Saludos,</p>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">El equipo de GEVID</p>
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" alt="videlca" style="width: 100%; height: auto; margin-top: 20px; border-radius: 5px;">
        </div>
        `;
        
        const subject = `CORREO INFORMATIVO VIDELCA - GEVID 👮‍♂️`;
    
        // Enviamos correo para notificar al usuario
        const isEmailSend = await this.sendEmail(correoInfo.email, html, subject);
    
        if (!isEmailSend){
            throw new BadGatewayException(`Error al enviar correo de notificacion al email ${correoInfo.email}, revisar correo`);
        }

    }

    // EMAIL PARA NOTIFICAR AL USUARIO
    async sendEmail(email: string, html: string, subject: string) {
    
        // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
        const options: SendMailOptions = {
            to: email,
            subject: subject,
            htmlBody: html
        }
        
        const isSend = await this.emailService.sendEmail(options);
        
        return isSend; 

    }

    // Obtener todas las locaciones
    async findAll(paginationDto: PaginationDto, pagination: boolean = true) {

        if (pagination) {

            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const locaciones = await this.locacionRepository.find({
                take: limit,
                skip: offset,
                order: {
                    nombre: 'ASC'
                },
                relations: {
                    correos: {
                        estados: true
                    },
                    idCiudad: true,
                    idCliente: true
                }
            });
  
            return locaciones;

        }    
        
        return await this.locacionRepository.find({
            relations: {
                correos: {
                    estados: true
                },
                idCiudad: true,
                idCliente: true
            },
            order: {
                nombre: 'ASC'
            }
        });
    }

    // Obtener todas las locaciones
    async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {

        if (pagination) {

            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const locaciones = await this.locacionRepository.find({
                take: limit,
                skip: offset,
                order: {
                    nombre: 'ASC'
                },
                relations: {
                    correos: {
                        estados: true
                    },
                    idCiudad: true,
                    idCliente: true
                },
                where: {
                    estado: true // Solo activas
                },
            });
  
            return locaciones;

        }    
        
        return await this.locacionRepository.find({
            relations: {
                correos: {
                    estados: true
                },
                idCiudad: true,
                idCliente: true
            },
            where: {
                estado: true // Solo activas
            },
            order: {
                nombre: 'ASC'
            }
        });
    }

    // Obtener una locación por ID
    async findOne(id: number) {

        const locacion = await this.locacionRepository.findOne({
            where: { 
                idLocacion: id 
            },
            relations: {
                correos: {
                    estados: true
                },
            }
        });
        
        if (!locacion) {
            throw new NotFoundException(`Locación con id "${id}" no encontrada`);
        }
        
        return locacion;
    }

    
    // Actualizar locación
    async update(id: number, updateLocacionDto: UpdateLocacionDto) {

        const { correos, idCiudad, idCliente, ...locacionData } = updateLocacionDto;

        // Validar que todos los estados estén cubiertos
        await this.validateEstadosCompletos(correos);
    
        // Verificar que la locación existe
        const locacionExistente = await this.locacionRepository.preload({idLocacion: id, ...locacionData});

        if(!locacionExistente) throw new NotFoundException(`Locacion con id "${id}" no encontrado`);
    
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {

            // Validar ciudad si se está actualizando
            if (updateLocacionDto.idCiudad) {

                const ciudad = await this.ubicacionService.findOneCiudad(updateLocacionDto.idCiudad);

                locacionExistente.idCiudad = ciudad;
            }
            
            // Validar cliente si se está actualizando
            if (updateLocacionDto.idCliente) {

                const cliente = await this.clienteService.findOne(updateLocacionDto.idCliente);

                locacionExistente.idCliente = cliente;
            }
            
            await queryRunner.manager.save(locacionExistente);

            const correosCreados: Correo[] = [];

            const uniqueCorreos = this.removeDuplicatesByEmail(correos);

            // 2. Obtener correos existentes con sus estados
            const correosExistentes = await queryRunner.manager.find(Correo, {
                where: { 
                    locacion: {
                        idLocacion: locacionExistente.idLocacion
                    } 
                },
                relations: ['estados']
            });

            const crearCorreos = await this.analizarCambiosCorreos(correosExistentes, uniqueCorreos);
    
            // Si se actualizan los correos
            if (correos && uniqueCorreos.length > 0) {

                // Eliminar correos existentes
                await queryRunner.manager.delete(Correo, { locacion: { idLocacion: id } });
        
                // Crear nuevos correos
                for (const correoDto of uniqueCorreos) {

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
        
                    const correo = queryRunner.manager.create(Correo, {
                        nombre: correoDto.nombre,
                        apellido: correoDto.apellido,
                        email: correoDto.email,
                        locacion: locacionExistente,
                        estados: estados,
                    });
        
                    const savedCorreo = await queryRunner.manager.save(Correo, correo);

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
            }

            // Asignar los correos creados a la locación
            // locacionExistente.correos = correosCreados;
    
            await queryRunner.commitTransaction();
    
            // Retornar la locación actualizada
            return await this.findOne(id);
    
        } catch (error) {

          await queryRunner.rollbackTransaction();

          throw error;

        } finally {

          await queryRunner.release();

        }

    }

    private async analizarCambiosCorreos(correosExistentes: Correo[], correosNuevos: CreateCorreoDto[]){

        const correosACrear: CreateCorreoDto[] = [];
    
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

    // Método para obtener estados faltantes (útil para el frontend)
    async getEstadosFaltantesParaLocacion(correos: CreateCorreoDto[]): Promise<EstadoOrdenServicio[]> {
        
        const todosLosEstados = await this.estadoOrdenServicioRepository.find({
            where: { estado: true }
        });

        const estadosAsignados = new Set<number>();
        
        correos.forEach(correo => {
            correo.estados.forEach(estadoId => {
                estadosAsignados.add(estadoId);
            });
        });

        return todosLosEstados.filter(
            estado => !estadosAsignados.has(estado.idEstadoOrdenServicio)
        );
    
    }

    async remove(id: number) {
    
        const locacion = await this.findOne(id);
        
        try {
    
          await this.locacionRepository.remove(locacion);
          
        } catch (error) {
          
          this.logger.error(error);
    
          if(error.errno == 1451){
            throw new BadRequestException(` La locacion ${locacion.nombre} no se puede eliminar debido a que se esta usando en el sistema`); 
          }
            
          throw new InternalServerErrorException(`Unexpected error, check server logs`);
    
        }

    }


}