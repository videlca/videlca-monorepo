import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { UbicacionService } from '../../common/services';
import { EstadoOrdenServicio } from '../../common/entities';

import { PaginationDto } from '../../common/dto';

import { Locacion, Correo } from '../entities';
import { ClientesService } from '../services';

import { CreateLocacionDto, UpdateLocacionDto } from '../dto';

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
            
            for (const correoDto of correos) {
        
                // Validar que los estados existen
                // Busca los estados por sus IDs
                const estados = await this.estadoOrdenServicioRepository.findBy({
                    idEstadoOrdenServicio: In(correoDto.estados)
                });
        
                if (!estados.length) {
                    throw new NotFoundException('No se encontraron estados con los IDs proporcionados.');
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
            
                correosCreados.push(savedCorreo);

            }

            // Asignar los correos creados a la locación
            savedLocacion.correos = correosCreados;
    
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
    
            // Si se actualizan los correos
            if (correos && correos.length > 0) {

                // Eliminar correos existentes
                await queryRunner.manager.delete(Correo, { locacion: { idLocacion: id } });
        
                // Crear nuevos correos
                for (const correoDto of correos) {

                    const estados = await this.estadoOrdenServicioRepository.findBy({
                        idEstadoOrdenServicio: In(correoDto.estados)
                    });
            
                    if (!estados.length) {
                        throw new NotFoundException('No se encontraron estados con los IDs proporcionados.');
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

                    correosCreados.push(savedCorreo);

                }
            }

            // Asignar los correos creados a la locación
            locacionExistente.correos = correosCreados;
    
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