import { BadRequestException, ForbiddenException, 
  Injectable, InternalServerErrorException, 
  Logger, UnauthorizedException, forwardRef, Inject, 
  NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { AuthService } from '../auth/auth.service';
import { PermissionsService } from '../permissions/permissions.service';
import { EmailService, TipoIdentificacionService } from '../common/services';

import { Roles } from '../auth/interfaces/roles.interface';
import { SendMailOptions } from './../common/services/email/email.service';
import { PaginationDto } from '../common/dto';

import { User } from './entities/user.entity';

import { CreateUserDto, UpdateUserDto, UpdateUserStateRolDto } from './dto';
import { Role } from '../permissions/entities/role.entity';

@Injectable()
export class UsersService {

  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 
  private hostFrontend: string; // Host del frontend
  private hostPublic: string; // host del server del backend

  private readonly logger = new Logger('UserService'); // visualizar los errores de una mejor forma en la consola

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource, 
    private readonly configService: ConfigService,
    private readonly permissionsService: PermissionsService, // Servicio de roles y permisos
    private readonly tipoIdentificacionService: TipoIdentificacionService, // Servicio de tipo de id
    private readonly emailService: EmailService, // Servicio de email para enviar correos
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService, // Servicio de auth para crear JWT
  ){
    // Inicializar variables con los valores estipulados en el archivo .env
    this.hostFrontend = this.configService.get<string>('hostFrontend');
    this.hostPublic = this.configService.get<string>('hostPublic');
    this.defaultLimit = this.configService.get<number>('defaultLimit');
  }


  async create(createUserDto: CreateUserDto) {

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    
    const existUser = await this.findOneByEmail(createUserDto.email);

    if(existUser){
      throw new BadRequestException(`Usuario con email ${createUserDto.email} ya existe`);
    }

    const {clave, ...userData} = createUserDto;

    // OBTENER TIPO DE ID
    const tipoIdentificacion = await this.tipoIdentificacionService.findOne(createUserDto.idTipoIdentificacion);

    // OBTENER ROL USER
    const rol = await this.permissionsService.findOneRole(createUserDto.idRol);

    if(rol.nombreRol == Roles.SUPER_ADMIN){
      throw new ForbiddenException('No se puede crear un super admin');
    }

    const user = this.userRepository.create({
      ...userData,
      clave: clave ? bcrypt.hashSync(clave, 10) : undefined,
      idTipoIdentificacion: tipoIdentificacion,
      idRol: rol
    });

    const token = await this.authService.getJwtToken({email: createUserDto.email, id: user.idUser});

    const fullName = `${createUserDto.primerNombre} ${createUserDto.primerApellido}`;

    try {
      
      // GUARDAR USER Y ENVIAR CORREO DE CONFIRMACION, 
      // ACA SE TIENE QUE CUMPLIR ESTAS 2 CONDICIONES PARA QUE SE HAYA EJECUTADO CON EXITO LA FUNCION
      
      // GUARDAR USER
      await queryRunner.manager.save(user);
      
      // ENVIAR CORREO PARA CONFIRMAR LA CUENTA
      const emailResult = await this.emailValidation(fullName, createUserDto.email, token);

      if (!emailResult){
        throw new InternalServerErrorException('No se logro crear user con exito, Error al enviar correo de validación');
      }

      await queryRunner.commitTransaction();

      await queryRunner.release();

      delete user.clave;

      return {
        nombre: `${createUserDto.primerNombre} ${createUserDto.primerApellido}`,
        email: createUserDto.email
      };
      
    } catch (error) {

      await queryRunner.rollbackTransaction();
       
      await queryRunner.release();

      this.handleDbExceptions(error);
      
    }


  }

  // ACTUALIZAR DATA DE UN USER
  async updatePerfil(updateUserDto: UpdateUserDto, user: User) {

    const { idTipoIdentificacion, ...updateUserData } = updateUserDto;
        
    // BUSCAR Y PRECARGAR USER A ACTUALIZAR 
    const existUser = await this.userRepository.preload({
      idUser: user.idUser,
      ...updateUserData
    });

    if(!existUser) throw new NotFoundException(`User con id "${user.numeroIdentificacion}" no encontrado`);
    
    // SOLO PODRA ACTUALIZAR LA DATA EL MISMO USER
    if(existUser.numeroIdentificacion != user.numeroIdentificacion){
      throw new UnauthorizedException('No tienes permiso para editar este User');
    }

    if(updateUserDto.clave){

      existUser.clave = bcrypt.hashSync(updateUserDto.clave, 10);

    }

    if(updateUserDto.idTipoIdentificacion){
    
      const tipoIdentificacion = await this.tipoIdentificacionService.findOne(updateUserDto.idTipoIdentificacion);  
      
      existUser.idTipoIdentificacion = tipoIdentificacion;

    }

    try {
      
      // Guradar user
      await this.userRepository.save(existUser);

      const user = await this.findOne(existUser.idUser);
      
      // Desestructuramos los valores para poder retornar la respuesta como queremos
      const { idTipoIdentificacion, idRol, ...userData } = user;
      
      return {
        ...userData,
        tipoIdentificacion: idTipoIdentificacion.descripcion,
        rol: idRol.descripcion
      };
        
    } catch (error) {

      this.handleDbExceptions(error);
      
    }
    
  }

  async removePerfil(user: User){
    
    // UN USUARIO PODRA ELIMINAR SU PERFIL, MENOS EL USER SUPER USUARIO
    if( user.idRol.nombreRol == Roles.SUPER_ADMIN){
      throw new UnauthorizedException('No se puede eliminar usuario con Rol Super admin');
    }
    
    try {

      user.estado = false;
      
      // Cambiamos el estado del user
      await this.userRepository.save(user);

    } catch (error) {
      
      throw new InternalServerErrorException("No se logro eliminar el user con exito")

    }
      
  }

  // ELIMINAR UN USUARIO
  async removeUser(id: number) {
    
    // Buscar comentario a eliminar
    const existUser = await this.findOne(id);
    
    // Solo podra eliminar el user si fue el propio user o si el user tiene rol de super admin
    if(existUser.idRol.nombreRol == Roles.SUPER_ADMIN){
      throw new UnauthorizedException('No tienes permiso para eliminar este Usuario');
    }
    
    try {

      existUser.estado = false;
      
      // Cambiamos el estado del user
      await this.userRepository.save(existUser);

    } catch (error) {
      
      throw new InternalServerErrorException("No se logro eliminar el user con exito")

    }


  }

  // ACTUALIZAR ESTADO Y ROL DEL USER
  async updateUser(id: number, updateUserstateRolDto: UpdateUserStateRolDto) {

    const existUser = await this.findOne(id);

    if(!existUser) throw new NotFoundException(`User con id "${id}" no encontrado`);

    // Solo podra eliminar el user si fue el propio user o si el user tiene rol de super admin
    if(existUser.idRol.nombreRol == Roles.SUPER_ADMIN){
      throw new UnauthorizedException('No se puede editar este Usuario');
    }
    
    if(updateUserstateRolDto.hasOwnProperty('estado') && existUser.estado !== updateUserstateRolDto.estado ){
      
      existUser.estado = updateUserstateRolDto.estado;
    
    }

    
    if(updateUserstateRolDto.idRol){

      const rol = await this.permissionsService.findOneRole(updateUserstateRolDto.idRol);

      existUser.idRol = rol;

    }

    try{
  
      await this.userRepository.save(existUser);

      const user = await this.findOne(existUser.idUser);
      
      // Desestructuramos los valores para poder retornar la respuesta como queremos
      const { idTipoIdentificacion, idRol, ...userData } = user;
      
      return {
        ...userData,
        tipoIdentificacion: idTipoIdentificacion.descripcion,
        rol: idRol.descripcion
      };

    } catch (error) {
       
      this.logger.error(error);
        
      throw new InternalServerErrorException('Ocurrio un error, no se logro cambiar el estado del user');

    }
    
  }

  // OBTENER TODOS LOS USUARIOS REGISTRADOS EN EL APLICATIVO
  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {

    if(pagination){
    
      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const users = await this.userRepository.find({
        take: limit,
        skip: offset,
        order: {
          primerNombre: 'ASC'
        }
      });
      
      return users;

    }

    return await this.userRepository.find({
      order: {
        primerNombre: 'ASC'
      }
    });

  }
  
  // OBTENER UN USER POR SU NUMERO DE ID
  async findOne(id: number) {
    
    const user = await this.userRepository.findOneBy({ idUser: id });

    return user;

  }


  // OBTENER UN USER CON PERMISOS POR SU NUMERO DE ID
  async findOneUserWithPermissions(id: number) {
    
    const user = await this.userRepository.findOneBy({ idUser: id });

    if(!user) throw new NotFoundException(`User con id "${id}" no fue encontrado`);
    
    const role = await this.permissionsService.findOneRole(user.idRol.id);

    const permisos = role.permissions

    return {
      ...user,
      role,
      permisos
    };

  }

  // ENCONTRAR A UN USER POR SU EMAIL Y RETORNAR LA CONTRASEÑA, FUNCION PARA LOGIN
  async findOneByEmailWithPassword(email: string){
    
    // SOLO DEVOLVEMOS LA DATA QUE SE NECESITA
    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        idUser: true, 
        email: true, 
        clave: true, 
        primerNombre: true, 
        primerApellido: true, 
        estado: true,
        idRol: true
      },
    });

    // Validar si existe
    if(!user){
        throw new UnauthorizedException('Email o contraseña es incorrecto');
    }

    delete user.idTipoIdentificacion;    

    const rol = await this.permissionsService.findOneRole(user.idRol.id);

    const permisos = rol.permissions.map(permiso => permiso.descripcion);

    return {
      user,
      permisos
    };

  }

  async findOneByNroId(numeroIdentificacion: string){

    const user = await this.userRepository.findOneBy({ numeroIdentificacion });

    return user;

  }

  // ENCONTRAR UN USER POR SU EMAIL
  async findOneByEmail(email: string){

    const user = await this.userRepository.findOneBy({ email });

    return user;

  }

  // ACTUALIZAR CONTRASEÑA DEL USER
  async actualizarPassword(email: string, clave: string){
          
    const user = await this.findOneByEmail(email);

    if(!user){
      throw new UnauthorizedException('Token no valido');
    }

    try {

      user.clave = bcrypt.hashSync(clave, 10);
  
      await this.userRepository.save(user);

    } catch (error) {
       
      this.logger.error(error);
        
      throw new InternalServerErrorException('Ocurrio un error, no se logro actualizar la contraseña');

    }
    
  }

  // VALIDAR USUARIO PARA CAMBIAR SU ESTADO A VERIFICADO
  async validateUser(email: string){
      
    const user = await this.findOneByEmail(email);

    if(!user){
      throw new UnauthorizedException('Token no valido');
    }

    if(user.estado === true){
      return;
    }

    // actualizar estado a activo
    user.estado = true;

    try{
  
      await this.userRepository.save(user);

    } catch (error) {
       
      this.logger.error(error);
        
      throw new InternalServerErrorException('Ocurrio un error, no se logro verificar el user');

    }

  }

  // EMAIL PARA VALIDAR CUENTA DEL USER
  async emailValidation(fullName: string, email: string, token: string) {

    const url = `${this.hostFrontend}/auth/confirmar-cuenta/${token}`;
    
    const html = `
    <div style="background-color: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); padding: 20px; max-width: 600px; margin: 20px auto; text-align: center; font-family: 'Poppins', sans-serif;">
        <h2 style="margin-bottom: 20px; color: #333; font-weight: 700;">Comprobar creacion de usuario en GEVID 👮‍♂️</h2>
        <p style="line-height: 1.6; margin: 10px 0; color: #555;">Buen día ${fullName}, para comprobar tu cuenta en GEVID por favor haz click sobre el enlace, en el cual debes establecer una contraseña</p>
        <div style="background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p>📎 Enlace para comprobar cuenta: <strong><a href="${url}">Comprobar Cuenta</a></strong></p>
        </div>
        <p style="line-height: 1.6; margin: 10px 0; color: #555;">Si tu no creaste una cuenta en GEVID omita este mensaje.</p>
        <p style="line-height: 1.6; margin: 10px 0; color: #555;">Saludos,</p>
        <p style="line-height: 1.6; margin: 10px 0; color: #555;">El equipo de GEVID</p>
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" alt="videlca" style="width: 100%; height: auto; margin-top: 20px; border-radius: 5px;">
    </div>
    `;
    
    // VALORES REQUERIDOS PARA PODER ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: email,
      subject: `${fullName} Comprueba la creacion de usuario en GEVID 👮‍♂️`,
      htmlBody: html
    }

    const isSend = await this.emailService.sendEmail(options);

    return isSend; 

  }

  // CREAR USUARIOS
  async createUserSeed(
    createUserDto: {
      primerNombre: string,
      segundoNombre?: string,
      primerApellido: string,
      segundoApellido?: string,
      email: string,
      clave: string,
      numeroIdentificacion: string,
      tipoIdentificacion: string,
      rol: string,
    }
  ){

    const {
      tipoIdentificacion,
      rol: nombreRol,
      ...createUserData
    } = createUserDto;
    
    // OBTENER TIPO DE ID
    const tipoId = await this.tipoIdentificacionService.findOneByName(tipoIdentificacion);

    // OBTENER ROL USER
    const rol = await this.permissionsService.findOneRoleByName(nombreRol);
    
    try {

      const user = this.userRepository.create({
        ...createUserData,
        idTipoIdentificacion: tipoId,
        idRol: rol
      });
  
      await this.userRepository.save(user);

      return user;

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR TODOS LOS USER
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA USER
  async deleteAllUsers(){
    
    const query = this.userRepository.createQueryBuilder('users');

    try {
      
      return await query
        .delete()
        .where({})
        .execute();

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
