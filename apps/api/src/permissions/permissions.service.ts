import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../common/dto';
import { Roles } from '../auth/interfaces/roles.interface';


import { Role, Permission } from './entities';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto, UpdatePermissionStateDto } from './dto';


@Injectable()
export class PermissionsService {

  private readonly logger = new Logger('PermissionsService');

  // Variable para definir cuantos resultados se van a devolver por default en una consulta
  private defaultLimit: number;

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly configService: ConfigService,         
  ) {
    // Inicializar variable con el valor que se estipulo en el archivo .env
    this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // PERMISSIONS
  
  // CREAR PERMISO
  async createPermission(createPermissionDto: CreatePermissionDto){
    
    try {
        
        const permission = this.permissionRepository.create(createPermissionDto);
        
        await this.permissionRepository.save(permission);

        return permission;

    } catch (error) {
        
        this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN PERMISO POR SU ID
  async findOnePermission(id: number){
    
    const permission = await this.permissionRepository.findOneBy({id});

    if(!permission) throw new NotFoundException(`Permiso con id "${id}" no se ha encontrado`);

    return permission;

  }
  
  // OBTENER UN PERMISO POR SU DESCRIPCION
  async findOnePermissionByDescripton(descripcion: string){
    
    const permission = await this.permissionRepository.findOneBy({descripcion});

    return permission;

  }
  
  // OBTENER TODOS LOS PERMISOS QUE SE PUEDAN MODIFICAR
  async findAllPermissionStatus() {

    const permisos = await this.permissionRepository.find();

    return permisos.map(permiso => {
      
      if(permiso.modificar){
        return permiso;
      }

    });

  }
  
  // OBTENER TODOS LOS PERMISOS
  async findAllPermissions(paginationDto: PaginationDto, pagination: boolean = true) {

    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const permisos = await this.permissionRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return permisos;

    }

    return await this.permissionRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });

  }
  
  // OBTENER TODOS LOS PERMISOS
  async findAllMenuPermission(paginationDto: PaginationDto) {

    // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
    const { limit = this.defaultLimit, offset = 0 } = paginationDto;
    
    const permisos = await this.permissionRepository.find({
      take: limit,
      skip: offset,
      order: {id: 'ASC'}
    });

    return permisos;

  }
  
  // ACTUALIZAR EL ESTADO DE UN PERMISO
  async updatePermissionState(id: number, updatePermissionStateDto: UpdatePermissionStateDto){

    const permission = await this.findOnePermission(id);

    if(permission.activo == updatePermissionStateDto.activo) return;

    permission.activo = updatePermissionStateDto.activo;

    try {
      
      await this.permissionRepository.save(permission);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }


  // ROLES
  
  // CREAR ROL
  async createRole(createRoleDto: CreateRoleDto){

    const nombreRol = createRoleDto.descripcion.toLowerCase().replace(/\s+/g, '-');

    if(nombreRol === Roles.SUPER_ADMIN) throw new ForbiddenException("Este nombre de Rol no se puede crear");

    const { permissionsIds } = createRoleDto;

    let permissions: Permission[];

    if(permissionsIds.length){
      // Busca los permisos por sus IDs
      permissions = await this.permissionRepository.findBy({
        id: In(createRoleDto.permissionsIds)
      });
  
      if (!permissions.length) {
        throw new NotFoundException('No se encontraron permisos con los IDs proporcionados.');
      }
    }
    else{
      permissions = [];
    }
    
    const role = this.roleRepository.create({
      nombreRol,
      permissions,
      descripcion: createRoleDto.descripcion.toLowerCase()
    });
      
    try {

      await this.roleRepository.save(role);

      return role;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }

  // BUSCAR UN ROL POR SU ID
  async findOneRole(id: number){
    
    const rol = await this.roleRepository.findOne({
      where: {id},
      relations: {permissions: true}
    });

    if(!rol) throw new NotFoundException(`Rol con id "${id}" no se ha encontrado`);

    return rol;

  }
  
  // BUSCAR UN ROL POR SU NOMBRE
  async findOneRoleByName(name: string){
    
    const rol = await this.roleRepository.findOne({
      where: {nombreRol: name},
      relations: {permissions: true}
    });

    if(!rol) throw new NotFoundException(`Rol con nombre "${name}" no se ha encontrado`);

    return rol;

  }

  // OBTENER TODOS LOS ROLES
  async findAllRole(paginationDto: PaginationDto, pagination: boolean = true) {

    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const roles = await this.roleRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return roles;

    }
    
    return await this.roleRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });

  }
  
  // OBTENER TODOS LOS ROLES ACTIVOS
  async findAllRoleActivos(paginationDto: PaginationDto, pagination: boolean = true){

    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const roles = await this.roleRepository.find({
          take: limit,
          skip: offset,
          where: {
            estado: true
          },
          order: {
              descripcion: 'ASC'
          }
      });
  
      return roles;

    }
    
    return await this.roleRepository.find({
      where: {
        estado: true 
      },
      order: {
        descripcion: 'ASC'
      }
    });

  }
  
  // OBTENER TODOS LOS RELES CON SUS PERMISOS
  async findAllRoleWithPermissions(paginationDto: PaginationDto, pagination: boolean = true){

    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const roles = await this.roleRepository.find({
          take: limit,
          skip: offset,
          relations: {
            permissions: true
          },
          order: {
              descripcion: 'ASC'
          }
      });
  
      return roles;

    }

    return await this.roleRepository.find({
      relations: {
        permissions: true
      },
      order: {
        descripcion: 'ASC'
      }
    });

  }
  
  // ACTUALIZAR UN ROL
  async updateRole(id: number, updateRoleDto: UpdateRoleDto){

    const {permissionsIds, descripcion, ...toUpdate} = updateRoleDto;
    
    const role = await this.roleRepository.preload({id, ...toUpdate});
    
    if(!role) throw new NotFoundException(`Rol con id "${id}" no existe`);

    if(role.nombreRol === Roles.SUPER_ADMIN) throw new ForbiddenException("Rol super admin no se puede actualizar");

    if(descripcion){
      role.descripcion = descripcion.toLowerCase();
      role.nombreRol = descripcion.toLowerCase().replace(/\s+/g, '-');
    }

    if(permissionsIds && permissionsIds.length > 0){

      role.permissions = [];

      // Busca los permisos por sus IDs
      const permissions = await this.permissionRepository.findBy({
        id: In(permissionsIds)
      });
  
      if (!permissions.length) {
        throw new NotFoundException('No se encontraron permisos con los IDs proporcionados.');
      }

      role.permissions = permissions;

    }
    
    if(permissionsIds && permissionsIds.length == 0){
      role.permissions = [];
    }

    try {

      await this.roleRepository.save(role);

    } catch (error) {
        
        this.handleDbExceptions(error);

    }

    return await this.findOneRole(role.id);

  }

  async deleteRole(id: number){

    const role = await this.findOneRole(id);

    if(role.nombreRol === Roles.SUPER_ADMIN) throw new ForbiddenException("Rol super admin no se puede eliminar");

    try {
      
      await this.roleRepository.remove(role);

    } catch (error) {
      
      if(error.errno == 1451){
        throw new BadRequestException(`El rol ${role.nombreRol} no se puede eliminar debido a que hay usuarios que tienen este rol`); 
      }

      throw new InternalServerErrorException(`Ocurrio un error, por favor valida que ocurrio`);

    }

  }

  // SEED
  async deleteAllRoles(){
    
    const queryRole = this.roleRepository.createQueryBuilder('roles');

    try {
      
      return await queryRole
        .delete()
        .where({})
        .execute();

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async deleteAllPermissions(){
    
    const queryPermissions = this.permissionRepository.createQueryBuilder('permissions');

    try {
      
      return await queryPermissions
        .delete()
        .where({})
        .execute();

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async createRoleSeed(createRoleDto: CreateRoleDto){

    const nombreRol = createRoleDto.descripcion.toLowerCase().replace(/\s+/g, '-');

    const { permissionsIds } = createRoleDto;

    let permissions: Permission[];

    permissions = []
      
    const role = this.roleRepository.create({
      nombreRol,
      permissions,
      descripcion: createRoleDto.descripcion.toLowerCase()
    });
      
    try {

      await this.roleRepository.save(role);

      return role;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }


  // BD ERRORS
  private handleDbExceptions(error: any){
    
    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }


}
