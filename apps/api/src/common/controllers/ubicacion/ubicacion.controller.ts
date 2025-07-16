import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../../auth/decorators';
import { DescriptionRoutes } from '../../../auth/interfaces';

import { UbicacionService } from '../../services';
import { 
    CreatePaisDto, 
    CreateDepartamentoDto, 
    CreateCiudadDto,
    UpdatePaisDto,
    UpdateDepartamentoDto,
    UpdateCiudadDto, 
    PaginationDto 
} from '../../dto';

@Controller('ubicacion')
@AppAuth(DescriptionRoutes.CONFIGURACION)
export class UbicacionController {

    constructor(private readonly ubicacionService: UbicacionService) {}
  
    //! PAIS
    
    // RUTA PROTEGIDA: Crear un pais
    @Post('pais')
    createPais(@Body() createPaisDto: CreatePaisDto) {
        return this.ubicacionService.createPais(createPaisDto);
    }
    
    // RUTA PROTEGIDA: Obtener todos los paises con sus departamentos
    @Get('pais')
    findAllPais(@Query() paginationDto: PaginationDto) {
        return this.ubicacionService.findAllPais(paginationDto, paginationDto.pagination);
    }

    // RUTA PROTEGIDA: Obtener un pais con sus departamentos
    @Get('pais/:id')
    findOnePais(@Param('id', ParseIntPipe) id: number) {
        return this.ubicacionService.findOnePais(id);
    }

    // RUTA PROTEGIDA: Editar un pais
    @Patch('pais/:id')
    updatePais(@Param('id', ParseIntPipe) id: number, @Body() updatePaisDto: UpdatePaisDto) {
        return this.ubicacionService.updatePais(id, updatePaisDto);
    }

    // RUTA PROTEGIDA: ELIMINAR UN PAIS
    @Delete('pais/:id')
    removePais(@Param('id', ParseIntPipe) id: number) {
        return this.ubicacionService.removePais(id);
    }
    

    //! DEPARTAMENTO
    
    // RUTA PROTEGIDA: Crear un departamento
    @Post('departamento')
    createDepartamento(@Body() createDepartamentoDto: CreateDepartamentoDto) {
        return this.ubicacionService.createDepartamento(createDepartamentoDto);
    }

    // RUTA PUBLICA (para ver desde otra pantalla o dropdown): Obtener todos los departamentos con sus ciudades
    @Get('departamento')
    @ValidateJwtAuth()
    findAllDepartamentos(@Query() paginationDto: PaginationDto) {
        return this.ubicacionService.findAllDepartamentosCiudades(paginationDto, paginationDto.pagination);
    }

    // RUTA PROTEGIDA: Obtener un departamento con sus ciudades
    @Get('departamento/:id')
    findOneDepartamento(@Param('id', ParseIntPipe) id: number) {
        return this.ubicacionService.findOneDepartamento(id);
    }

    // RUTA PROTEGIDA: Editar un departamento
    @Patch('departamento/:id')
    updateDepartamento(@Param('id', ParseIntPipe) id: number, @Body() updateDepartamentoDto: UpdateDepartamentoDto) {
        return this.ubicacionService.updateDepartamento(id, updateDepartamentoDto);
    }

    // RUTA PROTEGIDA: ELIMINAR UN DEPARTAMENTO
    @Delete('departamento/:id')
    removeDepartamento(@Param('id', ParseIntPipe) id: number) {
        return this.ubicacionService.removeDepartamento(id);
    }


    //! CIUDAD

    // RUTA PROTEGIDA: Crear una ciudad
    @Post('ciudad')
    createCiudad(@Body() createCiudadDto: CreateCiudadDto) {
        return this.ubicacionService.createCiudad(createCiudadDto);
    }

    // RUTA PROTEGIDA: Obtener todas las ciudades
    @Get('ciudad')
    findAllCiudades(@Query() paginationDto: PaginationDto) {
        return this.ubicacionService.findAllCiudades(paginationDto, paginationDto.pagination);
    }

    // RUTA PROTEGIDA: Obtener todas las ciudades activas
    @Get('ciudad/activas')
    @ValidateJwtAuth()
    findAllCiudadesActivas(@Query() paginationDto: PaginationDto) {
        return this.ubicacionService.findAllCiudadesActivas(paginationDto, paginationDto.pagination);
    }

    // RUTA PROTEGIDA: Obtener todas las ciudades asociadas a un departamento
    @Get('ciudad/departamento/:id')
    @ValidateJwtAuth()
    findAllCiudadesDepartamento(@Param('id', ParseIntPipe) id: number, @Query() paginationDto: PaginationDto) {
        return this.ubicacionService.findAllCiudadesDepartamento(id, paginationDto, paginationDto.pagination);
    }

    // RUTA PROTEGIDA: Obtener una ciudad
    @Get('ciudad/:id')
    findOneCiudad(@Param('id', ParseIntPipe) id: number) {
        return this.ubicacionService.findOneCiudad(id);
    }

    // RUTA PROTEGIDA: Editar una ciudad
    @Patch('ciudad/:id')
    updateCiudad(@Param('id', ParseIntPipe) id: number, @Body() updateCiudadDto: UpdateCiudadDto) {
        return this.ubicacionService.updateCiudad(id, updateCiudadDto);
    }

    // ELIMINAR UNA CIUDAD
    @Delete('ciudad/:id')
    removeCiudad(@Param('id', ParseIntPipe) id: number) {
        return this.ubicacionService.removeCiudad(id);
    }

}