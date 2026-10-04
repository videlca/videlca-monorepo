import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../auth/decorators';
import { DescriptionRoutes } from '../auth/interfaces';

import { PaginationDto } from '../common/dto';

import { PermissionsService } from './permissions.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';


@Controller('permissions')
@AppAuth(DescriptionRoutes.PERMISOS)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // RUTA PROTEGIDA (solo un user con permisos puede acceder): Obtener todos los permisos que estan en la app
  @Get()
  findAllPermission(@Query() paginationDto: PaginationDto) {
    return this.permissionsService.findAllPermissions(paginationDto);
  }

  //! ROLES
  
  // RUTA PROTEGIDA (solo un user con permisos puede acceder): Crear un rol
  @Post('role')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.permissionsService.createRole(createRoleDto);
  }
  
  // RUTA PROTEGIDA (solo un user con permisos puede acceder): Obtener todos los roles
  @Get('roles')
  findAllRole(@Query() paginationDto: PaginationDto) {
    return this.permissionsService.findAllRole(paginationDto);
  }

  // RUTA PROTEGIDA (solo un user con permisos puede acceder): Obtener todos los roles con sus permisos
  @Get('roles-permissions')
  findAllRoleWithPermissions(@Query() paginationDto: PaginationDto) {
    return this.permissionsService.findAllRoleWithPermissions(paginationDto);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown):: Obtener todos los roles ACTIVOS
  //! RUTA PARA USAR EN OTRAS SECCIONES QUE TENGAN QUE COLOCAR UN ROL ACTIVO POR EJEMPLO SECCION PERMISOS O CREAR UN USUARIO
  @Get('roles/activos')
  @ValidateJwtAuth()
  findAllRoleActivos(@Query() paginationDto: PaginationDto) {
    return this.permissionsService.findAllRoleActivos(paginationDto);
  }

  // RUTA PROTEGIDA (solo un user con permisos puede acceder): Obtener un rol por el id y los permisos relacionados
  @Get('role/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOneRole(id);
  }

  // RUTA PROTEGIDA (solo un user con permisos puede acceder): Actualizar rol -> permisos, el nombre o el estado
  @Patch('role/:id')
  updateRole(
    @Body() updateRoleDto: UpdateRoleDto,
    @Param('id', ParseIntPipe) id: number,
  ){
    return this.permissionsService.updateRole(id, updateRoleDto);
  }

  // RUTA PROTEGIDA (solo un user con permisos puede acceder): Eliminar un Rol
  @Delete('role/:id')
  deleteRole(
    @Param('id', ParseIntPipe) id: number 
  ){
    return this.permissionsService.deleteRole(id);
  }


}
