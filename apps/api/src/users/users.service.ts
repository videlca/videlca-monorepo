import { BadRequestException, ForbiddenException, 
  Injectable, InternalServerErrorException, 
  Logger, UnauthorizedException, forwardRef, Inject, 
  NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { AuthService } from '../auth/auth.service';
import { PermissionsService } from '../permissions/permissions.service';
import { EmailService, TipoIdentificacionService, CorreoDefaultService } from '../common/services';

import { Roles } from '../auth/interfaces/roles.interface';
import { SendMailOptions } from './../common/services/email/email.service';
import { PaginationDto } from '../common/dto';
import { PaginationOption } from '../common/interfaces/pagination.interface';
import { FilterUserDto, UserFilterColumn } from './dto/filter-user.dto';
import { EstadoAppInterface } from '../common/interfaces/estado-app.interface';

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
    private readonly correoDefaultService: CorreoDefaultService, // Servicio para obtener el email por defecto
  ){
    // Inicializar variables con los valores estipulados en el archivo .env
    this.hostFrontend = this.configService.get<string>('hostFrontend');
    this.hostPublic = this.configService.get<string>('hostPublic');
    this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async reenviarToken(id: number){
    
    const existUser = await this.findOne(id);

    if(!existUser){
      throw new BadRequestException(`Usuario con id ${id} no encontrado`);
    }

    const token = await this.authService.getJwtToken({email: existUser.email, id: existUser.idUser});

    const fullName = `${existUser.primerNombre} ${existUser.primerApellido}`;

    // ENVIAR CORREO PARA CONFIRMAR LA CUENTA
    const emailResult = await this.emailValidation(fullName, existUser.email, token);

    if (!emailResult){
      throw new InternalServerErrorException('Error al enviar correo de validación');
    }
    
  }

  async create(createUserDto: CreateUserDto) {

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    
    const existUser = await this.findOneByEmail(createUserDto.email);

    if(existUser){
      throw new BadRequestException(`Usuario con email ${createUserDto.email} ya existe`);
    }

    const existUserById = await this.findOneByNroId(createUserDto.numeroIdentificacion);

    if(existUserById){
      throw new BadRequestException('El numero de identificacion ya se encuentra registrado. Por favor, verifique que el numero de identificacion sea correcto');
    }

    const {...userData} = createUserDto;

    // Generar una clave temporal
    const clave = Math.random().toString(36).slice(-8);

    // OBTENER TIPO DE ID
    const tipoIdentificacion = await this.tipoIdentificacionService.findOne(createUserDto.idTipoIdentificacion);

    // OBTENER ROL USER
    const rol = await this.permissionsService.findOneRole(createUserDto.idRol);

    if(rol.nombreRol == Roles.SUPER_ADMIN){
      throw new ForbiddenException('No se puede crear un super admin');
    }

    const user = this.userRepository.create({
      ...userData,
      clave: bcrypt.hashSync(clave, 10),
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

      await this.notificarCreacionCuenta(fullName, createUserDto.email, createUserDto.numeroIdentificacion);

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

      throw error;

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

    // Crear QueryRunner para manejar la transacción
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {

      user.estado = false;

      // Cambiamos el estado del user
      await queryRunner.manager.save(User, user);

      // notificar a usuario
      await this.notificarDesactivacionCuenta(user.email, `${user.primerNombre} ${user.primerApellido}`);

      // notificar a correo default
      await this.notificarDesactivacionCuentaCorreoDefault(user.email, `${user.primerNombre} ${user.primerApellido}`);

      await queryRunner.commitTransaction();

    } catch (error) {

      await queryRunner.rollbackTransaction();
      
      throw new InternalServerErrorException("No se logro eliminar el user con exito")

    } finally {

      // Liberar el QueryRunner
      await queryRunner.release();

    }
      
  }

  // ELIMINAR UN USUARIO
  async removeUser(id: number) {
    
    // Buscar usuario a eliminar
    const existUser = await this.findOne(id);

    if(!existUser) throw new NotFoundException(`User con id "${id}" no encontrado`);
    
    // no se podra eliminar un usuario con rol de superadmin
    if(existUser.idRol.nombreRol == Roles.SUPER_ADMIN){
      throw new UnauthorizedException('No tienes permiso para eliminar este Usuario');
    }
    
    // Crear QueryRunner para manejar la transacción
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      await queryRunner.manager.remove(User, existUser);

      // notificar a correo default
      await this.notificarEliminacionCuentaCorreoDefault(existUser.email, `${existUser.primerNombre} ${existUser.primerApellido}`);
      
      await queryRunner.commitTransaction()

    } catch (error) {

      await queryRunner.rollbackTransaction();
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El usuario ${existUser.numeroIdentificacion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    } finally {

      // Liberar el QueryRunner
      await queryRunner.release();

    }


  }

  // ACTUALIZAR ESTADO Y ROL DEL USER
  async updateUser(id: number, updateUserstateRolDto: UpdateUserStateRolDto) {

    const existUser = await this.findOne(id);

    const estado = existUser.estado;

    if(!existUser) throw new NotFoundException(`User con id "${id}" no encontrado`);

    // No se puede editar un usuario si tiene rol de superadmin
    if(existUser.idRol.nombreRol == Roles.SUPER_ADMIN){
      throw new UnauthorizedException('No tienes los permisos para editar este usuario');
    }
    
    if(updateUserstateRolDto.hasOwnProperty('estado') && existUser.estado !== updateUserstateRolDto.estado ){
      
      existUser.estado = updateUserstateRolDto.estado;
    
    }

    
    if(updateUserstateRolDto.idRol){

      const rol = await this.permissionsService.findOneRole(updateUserstateRolDto.idRol);

      existUser.idRol = rol;

    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{

      await queryRunner.manager.save(User, existUser);

      if (estado != existUser.estado){

        if(!existUser.estado){
          
          await this.notificarDesactivacionCuentaCorreoDefault(existUser.email, `${existUser.primerNombre} ${existUser.primerApellido}`);
          
        } else {

          // notificar al usuario en caso que la cuenta se haya activado
          await this.notificarActivacionCuenta(existUser.email, `${existUser.primerNombre} ${existUser.primerApellido}`);
  
          // notificar a correo por default en caso que el estado haya cambiado, indicando si se activo
          await this.notificarActivacionCuentaCorreoDefault(existUser.email, `${existUser.primerNombre} ${existUser.primerApellido}`);

        }

      }
  
      const user = await queryRunner.manager.findOne(User, {
        where: { idUser: existUser.idUser },
        relations: ['idTipoIdentificacion', 'idRol'],
      });
  
      if (!user) {
        throw new NotFoundException(`User con id "${existUser.idUser}" no encontrado`);
      }
  
      await queryRunner.commitTransaction();
  
      const { idTipoIdentificacion, idRol, ...userData } = user;
  
      return {
        ...userData,
        tipoIdentificacion: idTipoIdentificacion.descripcion,
        rol: idRol.descripcion,
      };

    } catch (error) {

      await queryRunner.rollbackTransaction();
       
      this.logger.error(error);
        
      throw new InternalServerErrorException('Ocurrio un error, no se logro cambiar el estado del user');

    } finally {

      await queryRunner.release();

    }
    
  }

  // OBTENER TODOS LOS USUARIOS REGISTRADOS EN EL APLICATIVO
  async findAll(paginationDto: PaginationDto) {

    if(paginationDto.pagination === PaginationOption.TRUE){
    
      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [users, total] = await this.userRepository.findAndCount({
        take: limit,
        skip: offset,
        order: {
          primerNombre: 'ASC'
        },
        where: {
          idRol: {
            nombreRol: Not(Roles.SUPER_ADMIN)
          }
        }
      });
      
      return {
        data: users,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0
        }
      };

    }

    const users = await this.userRepository.find({
      order: {
        primerNombre: 'ASC'
      }
    });

    return {
      data: users,
      pagination: {
        total: users.length,
        limit: users.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  // FILTRAR USUARIOS POR COLUMNA
  async findFiltered(
    filterUserDto: FilterUserDto
  ) {
    
    const {
      column,
      query,
      limit = this.defaultLimit,
      offset = 0,
    } = filterUserDto;
  
    const columnMap: Record<UserFilterColumn, string> = {
      [UserFilterColumn.NUMERO_IDENTIFICACION]: 'user.numeroIdentificacion',
      [UserFilterColumn.NOMBRE]: 'user.primerNombre',
      [UserFilterColumn.EMAIL]: 'user.email',
      [UserFilterColumn.ROL]: 'rol.descripcion',
    };
  
    const dbColumn = columnMap[column];
  
    if (!dbColumn) {
      throw new BadRequestException('Columna de filtro no permitida');
    }
  
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.idTipoIdentificacion', 'tipoIdentificacion')
      .leftJoinAndSelect('user.idRol', 'rol')
      .where(`${dbColumn} LIKE :query`, {
        query: `%${query}%`,
      })
      .andWhere('rol.nombreRol != :superAdmin', { superAdmin: Roles.SUPER_ADMIN })
      .orderBy('user.primerNombre', 'ASC');
  
    if (filterUserDto.pagination === PaginationOption.TRUE) {
      qb.take(limit).skip(offset);

      const [users, total] = await qb.getManyAndCount();

      return {
        data: users,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
        },
      };
  
    }
  
    const users = await qb.getMany();

    return {
      data: users,
      pagination: {
        total: users.length,
        limit: users.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };
    
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
  
  // VALIDAR CUENTA DE USUARIO
  async validateUserAndPassword(email: string, password: string){
      
    const user = await this.findOneByEmail(email);

    if(!user){
      throw new UnauthorizedException('Token no valido');
    }

    if(user.estado === true){
      return;
    }

    // actualizar estado a activo
    user.estado = true;

    // actualizar contraseña
    user.clave = bcrypt.hashSync(password, 10);

    await this.notificarValidacionCuenta(email, `${user.primerNombre} ${user.primerApellido}`);

    try{
  
      await this.userRepository.save(user);

    } catch (error) {
       
      this.logger.error(error);
        
      throw new InternalServerErrorException('Ocurrio un error, no se logro verificar el user');

    }

  }

  async notificarDesactivacionCuenta(userEmail: string, nombre: string){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Desactivacion exitosa de su cuenta`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Desactivacion de cuenta en GEVID</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, ${nombre} <br><br> 
              Su cuenta en GEVID se ha desactivado con exito. <br><br>
              En caso de requerir activarla nuevamente, por favor pongase en contacto con el admin.
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

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: userEmail,
      subject: subject,
      htmlBody: html
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo de notificacion de desactivacion de cuenta a ${userEmail}, revisar correo si esta bien escrito`);
    }

  }
  
  async notificarActivacionCuenta(userEmail: string, nombre: string){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Activacion exitosa de su cuenta`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Activacion de cuenta en GEVID</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, ${nombre} <br><br> 
              Su cuenta en GEVID se ha Activado con exito, ya puede hacer uso del aplicativo. <br><br>.
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

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: userEmail,
      subject: subject,
      htmlBody: html
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo de notificacion de activacion de cuenta a ${userEmail}, revisar correo si esta bien escrito`);
    }

  }
  
  async notificarDesactivacionCuentaCorreoDefault(userEmail: string, nombre: string){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Se ha DESCATIVADO cuenta en GEVID para el Usuario ${nombre}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Desactivacion de cuenta en GEVID</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se ha desactivado la cuenta en GEVID para el usuario ${nombre} con email ${userEmail}.<br><br> 
              En caso de querer activar la cuenta del usuario nuevamente, el admin debe realizar esta activacion en el modulo de usuarios del aplicativo. <br><br>
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

    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CREACION_ELIMINACION_USUARIOS);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo de notificacion de desactivacion de cuenta a ${emails.join(', ')}, revisar correos si estan bien escritos`);
    }

  }
  
  async notificarActivacionCuentaCorreoDefault(userEmail: string, nombre: string){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Se ha ACTIVADO cuenta en GEVID para el Usuario ${nombre}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Activacion de cuenta en GEVID</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se ha activado la cuenta en GEVID para el usuario ${nombre} con email ${userEmail}.<br><br> 
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

    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CREACION_ELIMINACION_USUARIOS);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo de notificacion de activacion de cuenta a ${emails.join(', ')}, revisar correos si estan bien escritos`);
    }

  }
  
  async notificarEliminacionCuentaCorreoDefault(userEmail: string, nombre: string){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Se elimino cuenta de usuario ${nombre} en GEVID`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">ELIMINACION de cuenta en GEVID</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se ha eliminado la cuenta en el aplicativo para el usuario ${nombre} con email ${userEmail}.<br><br> 
              Esta cuenta para este usuario ya no existe en el apllicativo. <br><br>
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

    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CREACION_ELIMINACION_USUARIOS);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo de notificacion de eliminacion de cuenta a ${emails.join(', ')}, revisar correos si estan bien escritos`);
    }

  }
  
  async notificarValidacionCuenta(userEmail: string, nombre: string){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Validacion exitosa de su cuenta`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">BIENVENIDO a GEVID ${nombre}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, ${nombre} <br><br> 
              su cuenta en GEVID se ha confirmado con exito. <br><br>
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

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: userEmail,
      subject: subject,
      htmlBody: html
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo de confirmacion de cuenta a ${userEmail}, revisar correo si esta bien escrito`);
    }

  }
  
  async notificarCreacionCuenta(nombre: string, email: string, nroId: string){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Creacion de cuenta para usuario ${nombre}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CREACION DE CUENTA EN GEVID para ${nombre}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se ha creado una cuenta en GEVID para el usuario:<br><br> 
              <b>Nombre</b>: ${nombre} <br><br>
              <b>Nro Identificacion</b>: ${nroId} <br><br>
              <b>Email</b>: ${email} <br><br>
              El usuario debe verificar su cuenta para ingresar en el aplicativo. <br><br>
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

    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CREACION_ELIMINACION_USUARIOS);
    
    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo de notificacion de creacion de cuenta a los correos ${emails.join(', ')}, revisar correos si estan bien escritos`);
    }

  }

  // EMAIL PARA VALIDAR CUENTA DEL USER
  async emailValidation(fullName: string, email: string, token: string) {

    const url = `${this.hostFrontend}/confirmar-cuenta/${token}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CONFIRMAR CUENTA EN GEVID</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día <strong>${fullName}</strong>, para comprobar tu cuenta en GEVID por favor haz click sobre el enlace, en el cual debes establecer una contraseña. <br><br>
              📎 Enlace para comprobar cuenta: <strong><a href="${url}">Comprobar Cuenta</a></strong>
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

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): comprobar cuenta`;
    
    // VALORES REQUERIDOS PARA PODER ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: email,
      subject: subject,
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
