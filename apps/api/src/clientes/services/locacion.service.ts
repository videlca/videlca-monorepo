import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { UbicacionService, EmailService } from '../../common/services';
import { SendMailOptions } from '../../common/services/email/email.service';
import { EstadoOrdenServicio } from '../../common/entities';

import { PaginationDto } from '../../common/dto';

import { Locacion, Correo } from '../entities';
import { ClientesService } from '../services';

import { CreateLocacionDto, UpdateLocacionDto, CreateCorreoDto, LocacionSearchDto } from '../dto';

@Injectable()
export class LocacionService {

    private readonly logger = new Logger('LocacionService');
      
    private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta

    constructor(
        @InjectRepository(Locacion)
        private readonly locacionRepository: Repository<Locacion>,
        @InjectRepository(EstadoOrdenServicio)
        private readonly estadoOrdenServicioRepository: Repository<EstadoOrdenServicio>,
        @InjectRepository(Correo)
        private readonly correoRepository: Repository<Correo>,
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
    
        // Usar QueryRunner para transacción manual
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        // Validar que la ciudad existe
        const ciudad = await this.ubicacionService.findOneCiudad(createLocacionDto.idCiudad);
    
        // Validar que el cliente existe
        const cliente = await this.clienteService.findOne(createLocacionDto.idCliente);

        // Validar cliente facturacion
        let clienteFacturacion = null;

        if (createLocacionDto.idClienteFacturacion) {
        
            clienteFacturacion = await this.clienteService.findOne(
                createLocacionDto.idClienteFacturacion
            );
        
        }
    
        try {

            // Crear la locación sin los correos primero
            const locacion = queryRunner.manager.create(Locacion, {
                ...locacionData,
                idCiudad: ciudad,
                idCliente: cliente,
                idClienteFacturacion: clienteFacturacion
            });

            const savedLocacion = await queryRunner.manager.save(Locacion, locacion);

            // Procesar cada correo
            const correosCreados: Correo[] = [];

            const uniqueCorreos = this.removeDuplicatesByEmail(correos);
            
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
                await this.notificationEmail(correoDto, savedLocacion.nombre);
            
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

    // ENVIAR CORREO PARA INFORMAR REGISTRO DE NOTIFICACIONES EN GEVID Y SABER QUE SI ESTA FUNCIONANDO EL CORREO
    private async notificationEmail(correoInfo: CreateCorreoDto, locacion: string) {

        const nombreCompleto = `${correoInfo.nombre} ${correoInfo.apellido}`;        

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
                Buen día <strong>${nombreCompleto}</strong>, este correo ha sido añadido en el sistema de notificaciones de <b>Videlca</b> para el puesto ${locacion}.
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

        const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): correo electronico vinculado a la aplicacion para el puesto ${locacion}`;

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
                    idCliente: true,
                    idClienteFacturacion: true
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
                idCliente: true,
                idClienteFacturacion: true
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
                    idCliente: true,
                    idClienteFacturacion: true
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
                idCliente: true,
                idClienteFacturacion: true
            },
            where: {
                estado: true // Solo activas
            },
            order: {
                nombre: 'ASC'
            }
        });
    }
    
    // Obtener todas las locaciones POR BUSQUEDA
    async findAllActivesSearch(locacionSearch: LocacionSearchDto) {

        const { column, text } = locacionSearch;

        const search = `%${text.toLowerCase()}%`;

        const qb = this.locacionRepository
            .createQueryBuilder('loc')
            .leftJoinAndSelect('loc.idCliente', 'cliente')
            .leftJoinAndSelect('loc.idClienteFacturacion', 'clienteFacturacion')
            .leftJoinAndSelect('loc.idCiudad', 'ciudad')   // NUEVO JOIN
            .where('loc.estado = :estado', { estado: true });  // FILTRO GLOBAL
    
        switch (column) {

            case 'nombre':
                qb.andWhere(`LOWER(loc.nombre) LIKE :search`, { search });
                break;
        
            case 'direccion':
                qb.andWhere(`LOWER(loc.direccion) LIKE :search`, { search });
                break;
        
            case 'cliente':
                qb.andWhere(`LOWER(cliente.nombre) LIKE :search`, { search });
                break;

            default:
                throw new BadRequestException('Columna inválida');

        }
    
        return qb.getMany();

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

        const { correos = [], idCiudad, idCliente, idClienteFacturacion, ...locacionData } = updateLocacionDto;

        if (correos.length <= 0){
            throw new BadRequestException(`Se debe añadir al menos un correo`);
        }
    
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
            
            // Validar cliente facturacion si se está actualizando
            if (updateLocacionDto.idClienteFacturacion) {

                const clienteFacturacion = await this.clienteService.findOne(updateLocacionDto.idClienteFacturacion);

                locacionExistente.idClienteFacturacion = clienteFacturacion;
            }
            else {

                locacionExistente.idClienteFacturacion = null;
            
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

                    if (correoDto.estados.length <= 0){

                        throw new BadRequestException(`Se debe enviar al menos un estado en cada correo`);
    
                    }

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
                        await this.notificationEmail(correoDto, locacionExistente.nombre);
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

    async getEmailsByLocacionAndEstado(
        idLocacion: number, 
        idEstadoOrden: number
    ): Promise<string[]> {
        
        const result = await this.correoRepository
            .createQueryBuilder('correo')
            .innerJoin('correo_estado', 'ce', 'ce.correo_id = correo.idCorreo')
            .where('correo.idLocacion = :idLocacion', { idLocacion })
            .andWhere('ce.estado_id = :idEstadoOrden', { idEstadoOrden })
            .select('correo.email')
            .getMany();
            
        return result.map(correo => correo.email);
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