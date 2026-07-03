import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Pais, Ciudad, Departamento } from '../../entities';
import { PaginationOption } from '../../interfaces/pagination.interface';
import { 
    CreatePaisDto, 
    CreateDepartamentoDto, 
    CreateCiudadDto,
    UpdatePaisDto,
    UpdateDepartamentoDto,
    UpdateCiudadDto, 
    PaginationDto } from '../../dto';

@Injectable()
export class UbicacionService {

    private readonly logger = new Logger('UbicacionService');

    private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

    constructor(
        @InjectRepository(Pais)
        private readonly paisRepository: Repository<Pais>,
    
        @InjectRepository(Departamento)
        private readonly departamentoRepository: Repository<Departamento>,
    
        @InjectRepository(Ciudad)
        private readonly ciudadRepository: Repository<Ciudad>,
        
        private readonly configService: ConfigService,
    
    ) {
        this.defaultLimit = this.configService.get<number>('defaultLimit');
    }
  

    // PAIS

    // CREAR PAIS
    async createPais(createPaisDto: CreatePaisDto){
    
        try {
            
            const pais = this.paisRepository.create(createPaisDto);
            
            await this.paisRepository.save(pais);
    
            return pais;
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }

    }
  
    // ENCONTRAR UN PAIS
    async findOnePais(id: number){
    
        const pais = await this.paisRepository.findOne({
            where: {idPais: id},
            relations: {departamentos: true}
        });
    
        if(!pais) throw new NotFoundException(`Pais con id "${id}" no se ha encontrado`);
    
        return pais;

    }
  
    // OBTENER TODOS LOS PAISES
    async findAllPais(paginationDto: PaginationDto) {

        if (paginationDto.pagination === PaginationOption.TRUE) {

            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const [paises, total] = await this.paisRepository.findAndCount({
                take: limit,
                skip: offset,
                relations: {
                    departamentos: true
                },
                order: {
                    idPais: 'ASC'
                }
            });
        
            return {
                data: paises,
                pagination: {
                    total,
                    limit,
                    offset,
                    page: Math.floor(offset / limit) + 1,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: offset + limit < total,
                    hasPreviousPage: offset > 0,
                }
            };

        }

        const paises = await this.paisRepository.find({
            relations: {
                departamentos: true
            },
            order: {
                descripcion: 'ASC'
            }
        });

        return {
            data: paises,
            pagination: {
                total: paises.length,
                limit: paises.length,
                offset: 0,
                page: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            }
        };
    }

    // EDITAR PAIS
    async updatePais(id: number, updatePaisDto: UpdatePaisDto) {
    
        const pais = await this.paisRepository.preload({
            idPais: id, 
            ...updatePaisDto,
        });
    
        if (!pais) throw new NotFoundException(`Pais con id "${id}" no se ha encontrado`);
    
        try {
            
            await this.paisRepository.save(pais);
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }

    }

    async removePais(id: number) {
    
        const pais = await this.findOnePais(id);
        
        try {
    
            await this.paisRepository.remove(pais);
            
        } catch (error) {
            
            this.logger.error(error);

            if(error.errno == 1451){
                throw new BadRequestException(`El Pais ${pais.descripcion} no se puede eliminar debido a que varios departamentos lo tienen asignado`); 
            }
            
            throw new InternalServerErrorException(`Unexpected error, check server logs`);
    
        }

    }

    //! DEPARTAMENTOS
  
    // CREAR DEPARTAMENTO
    async createDepartamento(createDepartamentoDto: CreateDepartamentoDto){

        // Obtener pais al que pertenece el departamento
        const pais = await this.findOnePais(createDepartamentoDto.pais);
        
        try {
    
            const departamento = this.departamentoRepository.create({
                ...createDepartamentoDto,
                pais
            });
    
            await this.departamentoRepository.save(departamento);
    
            return departamento;
            
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }
    

    }
  
    // ENCONTRAR UN DEPARTAMENTO
    async findOneDepartamento(id: number){
    
        const departamento = await this.departamentoRepository.findOne({
            where: { idDepartamento: id},
            relations: { ciudades: true }
        });
    
        if(!departamento) throw new NotFoundException(`Departamento con id "${id}" no se ha encontrado`);
    
        return departamento;

    }
  
    // OBTENER TODOS LOS DEPARTAMENTOS
    async findAllDepartamentos(paginationDto: PaginationDto) {

        if (paginationDto.pagination === PaginationOption.TRUE) {

            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const departamentos = await this.departamentoRepository.find({
                take: limit,
                skip: offset,
                order: {
                    descripcion: 'ASC'
                }
            });
        
            return departamentos;

        }

        return await this.departamentoRepository.find({
            order: {
                descripcion: 'ASC'
            }
        });

    }

    // OBTENER TODOS LOS DEPARTAMENTOS
    async findAllDepartamentosCiudades(paginationDto: PaginationDto) {

        if (paginationDto.pagination === PaginationOption.TRUE) {

            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const [departamentos, total] = await this.departamentoRepository.findAndCount({
                take: limit,
                skip: offset,
                relations: {
                    ciudades: true
                },
                order: {
                    descripcion: 'ASC'
                }
            });
        
            return {
                data: departamentos,
                pagination: {
                    total,
                    limit,
                    offset,
                    page: Math.floor(offset / limit) + 1,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: offset + limit < total,
                    hasPreviousPage: offset > 0,
                }
            };

        }

        const departamentos =await this.departamentoRepository.find({
            relations: {
                ciudades: true
            },
            order: {
                descripcion: 'ASC'
            }
        });

        return {
            data: departamentos,
            pagination: {
                total: departamentos.length,
                limit: departamentos.length,
                offset: 0,
                page: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            }
        };

    }
    

    // EDITAR DEPARTAMENTO
    async updateDepartamento(id: number, updateDepartamentoDto: UpdateDepartamentoDto) {

        // Obtener pais al que pertenece el departamento
        const pais = await this.findOnePais(updateDepartamentoDto.pais);
    
        const departamento = await this.departamentoRepository.preload({
            idDepartamento: id, 
            ...updateDepartamentoDto,
            pais
        });
    
        if (!departamento) throw new NotFoundException(`Departamento con id "${id}" no se ha encontrado`);
    
        try {
            
            await this.departamentoRepository.save(departamento);
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }

    }
    
    async removeDepartamento(id: number) {
    
        const departamento = await this.findOneDepartamento(id);
        
        try {
    
            await this.departamentoRepository.remove(departamento);
            
        } catch (error) {
            
            this.logger.error(error);

            if(error.errno == 1451){
                throw new BadRequestException(`El departamento ${departamento.descripcion} no se puede eliminar debido a que varias ciudades lo tienen asignado`); 
            }
            
            throw new InternalServerErrorException(`Unexpected error, check server logs`);
    
        }

    }

    //! CIUDADES
  
    // CREAR CIUDAD
    async createCiudad(createCiudadDto: CreateCiudadDto){ 
    
        // Obtener departamento al que pertenece la ciudad
        const departamento = await this.findOneDepartamento(createCiudadDto.departamento);
        
        const createCiudadData = {
            ...createCiudadDto,
            departamento
        }
    
        try {
        
            const ciudad = this.ciudadRepository.create({ 
                ...createCiudadData 
            });
    
            await this.ciudadRepository.save(ciudad);
    
            return ciudad;
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }


    }
  
    // ENCONTRAR UNA CIUDAD
    async findOneCiudad(id: number){
    
        const ciudad = await this.ciudadRepository.findOne({
            where: {idCiudad: id},
            relations: {departamento: true}
        });
    
        if(!ciudad) throw new NotFoundException(`Ciudad con id "${id}" no se ha encontrado`);
    
        return ciudad;

    }
  
    // ENCONTRAR UNA CIUDAD POR NOMBRE
    async findOneCiudadByName(name: string){
    
        const ciudad = await this.ciudadRepository.findOneBy({descripcion: name});
    
        if(!ciudad) throw new NotFoundException(`Ciudad con nombre "${name}" no se ha encontrado`);
    
        return ciudad;

  }
  
    // OBTENER TODAS LAS CIUDADES
    async findAllCiudades(paginationDto: PaginationDto){

        if (paginationDto.pagination === PaginationOption.TRUE) {

            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const [ciudades, total] = await this.ciudadRepository.findAndCount({
                take: limit,
                skip: offset,
                relations: {
                    departamento: true
                },
                order: {
                    descripcion: 'ASC'
                }
            });
        
            return {
                data: ciudades,
                pagination: {
                    total,
                    limit,
                    offset,
                    page: Math.floor(offset / limit) + 1,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: offset + limit < total,
                    hasPreviousPage: offset > 0,
                }
            };

        }
        

        const ciudades = await this.ciudadRepository.find({
            relations: {
                departamento: true
            },
            order: {
                descripcion: 'ASC'
            }
        });

        return {
            data: ciudades,
            pagination: {
                total: ciudades.length,
                limit: ciudades.length,
                offset: 0,
                page: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            }
        };

    }
  
    // OBTENER TODAS LAS CIUDADES ACTIVAS
    async findAllCiudadesActivas(paginationDto: PaginationDto) {

        if (paginationDto.pagination === PaginationOption.TRUE) {

            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const [ciudades, total] = await this.ciudadRepository.findAndCount({
                take: limit,
                skip: offset,
                where: {
                    estado: true
                },
                relations: {
                    departamento: true
                },
                order: {
                    descripcion: 'ASC'
                }
            });
        
            return {
                data: ciudades,
                pagination: {
                    total,
                    limit,
                    offset,
                    page: Math.floor(offset / limit) + 1,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: offset + limit < total,
                    hasPreviousPage: offset > 0,
                }
            };

        }

        const ciudades = await this.ciudadRepository.find({
            relations: {
                departamento: true
            },
            where: {estado: true},
            order: {
                descripcion: 'ASC'
            }
        });

        return {
            data: ciudades,
            pagination: {
                total: ciudades.length,
                limit: ciudades.length,
                offset: 0,
                page: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            }
        };

    }
    
    // OBTENER TODAS LAS CIUDADES SEGUN EL ID DEL DEPARTAMENTO
    async findAllCiudadesDepartamento(idDepartamento: number, paginationDto: PaginationDto) {

        const departamento = await this.findOneDepartamento(idDepartamento);

        if (paginationDto.pagination === PaginationOption.TRUE) {

            // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
            const { limit = this.defaultLimit, offset = 0 } = paginationDto;
            
            // Se hace la consulta de manera paginada
            const [ciudades, total] = await this.ciudadRepository.findAndCount({
                take: limit,
                skip: offset,
                where: {
                    departamento
                },
                order: {
                    descripcion: 'ASC'
                }
            });
        
            return {
                data: ciudades,
                pagination: {
                    total,
                    limit,
                    offset,
                    page: Math.floor(offset / limit) + 1,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: offset + limit < total,
                    hasPreviousPage: offset > 0,
                }
            };

        }

        const ciudades = await this.ciudadRepository.find({
            relations: {
                departamento: true
            },
            where: {
                departamento
            },
            order: {
                descripcion: 'ASC'
            }
        });

        return {
            data: ciudades,
            pagination: {
                total: ciudades.length,
                limit: ciudades.length,
                offset: 0,
                page: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            }
        };

    }

    // EDITAR CIUDAD
    async updateCiudad(id: number, updateCiudadDto: UpdateCiudadDto) {

        // Obtener departamento al que pertenece la ciudad
        const departamento = await this.findOneDepartamento(updateCiudadDto.departamento);
    
        const ciudad = await this.ciudadRepository.preload({
            idCiudad: id, 
            ...updateCiudadDto,
            departamento
        });
    
        if (!ciudad) throw new NotFoundException(`Ciudad con id "${id}" no se ha encontrado`);
    
        try {
            
            await this.ciudadRepository.save(ciudad);
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }

    }

    async removeCiudad(id: number) {
    
        const ciudad = await this.findOneCiudad(id);
        
        try {
    
            await this.ciudadRepository.remove(ciudad);
            
        } catch (error) {
            
            this.logger.error(error);

            if(error.errno == 1451){
                throw new BadRequestException(`La ciudad ${ciudad.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
            }
            
            throw new InternalServerErrorException(`Unexpected error, check server logs`);
    
        }

    }
  
    // ELIMINAR TODOS LOS PAISES, POR CONSECUENCIA SE BORRAN LOS DEPARTAMENTOS Y CIUDADES
    // ELIMINAR TODOS LOS PAISES
    // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LAS TABLAS PAISES, DEPARTAMENTOS, CIUDAD
    async deleteAllPais(){
    
        const query = this.paisRepository.createQueryBuilder('pais');
    
        try {
            
            return await query
            .delete()
            .where({})
            .execute();
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }

    }
  
    // ENCONTRAR UN PAIS POR SU NOMBRE
    async findOnePaisByName(descripcion: string){
    
        const pais = await this.paisRepository.findOneBy({descripcion});
    
        if(!pais) throw new NotFoundException(`Pais con nombre "${descripcion}" no se ha encontrado`);
    
        return pais;

    }

    // CREAR UN DEPARTAMENTO
    async createDepartamentoByString(departamentoData: {descripcion: string, pais: string, codigoDepartamento: string} ){

        // Obtener pais al que pertenece el departamento
        const pais = await this.findOnePaisByName(departamentoData.pais);
        
        try {
    
            const departamento = this.departamentoRepository.create({
                descripcion: departamentoData.descripcion,
                codigoDepartamento: departamentoData.codigoDepartamento, 
                pais
            });
    
            await this.departamentoRepository.save(departamento);
    
            return departamento;
            
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }
    

    }

    // ENCONTRAR UN DEPARTAMENTO POR SU NOMBRE
    async findOneDepartamentoByName(descripcion: string){
    
        const departamento = await this.departamentoRepository.findOneBy({descripcion});
    
        if(!departamento) throw new NotFoundException(`Departamento con nombre "${descripcion}" no se ha encontrado`);
    
        return departamento;

    }
  
    // CREAR UNA CIUDAD
    async createCiudadByString(ciudadData: {descripcion: string, departamento: string, codigoCiudad: string}){
    
        // Obtener departamento al que pertenece la ciudad
        const departamento = await this.findOneDepartamentoByName(ciudadData.departamento);
        
        try {
        
            const ciudad = this.ciudadRepository.create({
                descripcion: ciudadData.descripcion,
                codigoCiudad: ciudadData.codigoCiudad, 
                departamento
            });
    
            await this.ciudadRepository.save(ciudad);
    
            return ciudad;
    
        } catch (error) {
            
            this.handleDbExceptions(error);
    
        }


    }

    private handleDbExceptions(error: any){
  
        if (error.errno === 1062)
          throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);
    
        this.logger.error(error);
    
        throw new InternalServerErrorException('Unexpected error, check server logs');

    }
  
}