import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, GetUser, UserAuth, ValidateJwtAuth } from '../auth/decorators';
import { DescriptionRoutes } from '../auth/interfaces';

import { PaginationDto } from '../common/dto';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateUserStateRolDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //! ENDPOINTS PARA PERFIL DE UN USER

  // RUTA PROTEGIDA (solo un user logueado puede acceder): Obtener data del user
  @Get('mi-perfil')
  @UserAuth()
  async getMyProfile(
    @GetUser() user: User
  ){

    const existUser = await this.usersService.findOne(user.idUser);

    if(!existUser) throw new NotFoundException(`User con id "${user.numeroIdentificacion}" no fue encontrado`);
    
    return existUser;

  }

  // RUTA PROTEGIDA (solo un user logueado puede acceder): actualizar data del user
  @Patch('mi-perfil')
  @UserAuth()
  updatePerfil(
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User
  ) 
  {
    return this.usersService.updatePerfil(updateUserDto, user);
  }

  // RUTA PROTEGIDA (solo el propio user o SUPERADMIN puede acceder): un usuario pueda eliminar su perfil
  @Delete('mi-perfil')
  @UserAuth()
  removePerfil(
    @GetUser() user: User,
  ) {
    return this.usersService.removePerfil(user);
  }


  //! USUARIOS
  
  // RUTA PROTEGIDA : crear un usuario
  @Post()
  @AppAuth(DescriptionRoutes.USUARIOS)
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // RUTA PROTEGIDA : Obtener todos los usuarios 
  @Get()
  @AppAuth(DescriptionRoutes.USUARIOS)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  // RUTA PROTEGIDA : reenviar token de validacion de cuenta a usuario
  @Get('reenviar-token/:id')
  @AppAuth(DescriptionRoutes.USUARIOS)
  reenviarToken(@Param('id', ParseIntPipe) id: number) {
      
    return this.usersService.reenviarToken(id);

  }

  // RUTA PROTEGIDA : Obtener data de un user
  @Get(':id')
  @AppAuth(DescriptionRoutes.USUARIOS)
  async findOne(@Param('id', ParseIntPipe) id: number) {
      
    const existUser = await this.usersService.findOneUserWithPermissions(id);

    return existUser;

  }

  // RUTA PROTEGIDA : Actualizar estado y rol de un user
  @Patch(':id')
  @AppAuth(DescriptionRoutes.USUARIOS)
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUser: UpdateUserStateRolDto 
  ){
    return this.usersService.updateUser(id, updateUser);
  }

  @Delete(':id')
  @AppAuth(DescriptionRoutes.USUARIOS)
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ){
    return this.usersService.removeUser(id);
  }


}
