import { Injectable, Inject, forwardRef, UnauthorizedException, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { EmailService } from '../common/services';
import { SendMailOptions } from './../common/services/email/email.service';

import { Roles, JwtPayload } from './interfaces';

import { LoginUserDto, NewPasswordDto, ReenviarTokenDto, ReestablecerDatosDto } from './dto';

@Injectable()
export class AuthService {

    private hostFrontend: string; // host del frontend (aplicativo web)
    private hostPublic: string; // host del server del backend

    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService, // Servicio de usuarios 
        @Inject(forwardRef(() => EmailService))
        private readonly emailService: EmailService, // Servicio de email para envio de correos
        private readonly jwtService: JwtService, // Servicio para Json Web Tokens
        private readonly configService: ConfigService,
    ){
        // Inicializar variables con valores establecidos en el archivo .env
        this.hostFrontend = this.configService.get<string>('hostFrontend');
        this.hostPublic = this.configService.get<string>('hostPublic');
    }

    // LOGIN EN EL APLICATIVO
    async loginUser(loginDto: LoginUserDto) {
    
        // Encontrar user que quiere iniciar sesion
        const userFound = await this.usersService.findOneByEmailWithPassword(loginDto.email);

        const {user, permisos} = userFound;
        
        if(!user.estado){
            throw new ForbiddenException('Tu cuenta no está activa, por favor, recupera tu cuenta');
        }

        // Validar si el user tiene el rol de super-admin
        if (user.idRol.nombreRol === Roles.SUPER_ADMIN) {

            if(loginDto.clave !== user.clave){
                throw new UnauthorizedException('Email o contraseña es incorrecto');
            }
            
            const payload: JwtPayload = { email: user.email, id: user.idUser}

            // Generar token de acceso
            const token = await this.getJwtToken(payload);

            // retornar token de acceso y data del user
            return {
                token,
                user: {
                    idUser: user.idUser,
                    nombre: `${user.primerNombre} ${user.primerApellido}`,
                    email: user.email,
                    rol: user.idRol.nombreRol,
                },
                permisos
            };

        }
        
        // Validar si la contraseña coincide
        if(!bcrypt.compareSync(loginDto.clave, user.clave)){
            throw new UnauthorizedException('Email o contraseña es incorrecto');
        }
    
        const payload: JwtPayload = { email: user.email, id: user.idUser };
        
        // Generar token de acceso
        const token = await this.getJwtToken(payload);
        
        // retornar token de acceso y data del user
        return {
            token,
            user: {
                idUser: user.idUser,
                nombre: `${user.primerNombre} ${user.primerApellido}`,
                email: user.email,
                rol: user.idRol.nombreRol
            },
            permisos
        };
    }
    
    // ENVIAR CORREO PARA REESTABLECER LA CONTRASEÑA DEL USER
    async olvidePassword(olvidePasswordDto: ReestablecerDatosDto) {
    
        const { numeroIdentificacion } = olvidePasswordDto;
            
        // VALIDACION USER
        // Validamos que user si se encuentre en nuestra BD y extraemos la data y el token de acceso
        const { fullName, token, email } = await this.validateUser(numeroIdentificacion);

        const url = `${this.hostFrontend}/olvide-password/${token}`;

        const nombreCompleto = fullName;        

        const html = `
        <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Encabezado -->
            <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 700;">REESTABLECER CONTRASEÑA</h2>
            </div>
            
            <!-- Cuerpo -->
            <div style="padding: 25px; text-align: center;">
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                Buen día <strong>${nombreCompleto}</strong>, para reestablecer tu contraseña en <b>GEVID</b> por favor haz click sobre el enlace: <br><br>
                📎 Enlace para reestablecer contraseña: <strong><a href="${url}">Reestablecer contraseña</a></strong>
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

        const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): reestablece tu contraseña`;

        // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
        const options: SendMailOptions = {
            to: email,
            subject: subject,
            htmlBody: html
        }
    
        // Enviamos correo para reestablecer la contraseña
        const isEmailSend = await this.emailService.sendEmail(options);
    
        if (!isEmailSend){
            throw new InternalServerErrorException('Error al enviar correo para reestablecer contraseña');
        }

    }

    // VALIDAR USER
    async comprobarTokenOlvidePassword(token: string){
    
        // validamos el token y extraemos el email
        const payload: JwtPayload = await this.validateToken(token);
    
        const { email } = payload;
        
        // Verificamos que el user si exista en nuestra BD
        const user = await this.usersService.findOneByEmail(email);
    
        if(user){
            return
        }
    
        throw new NotFoundException('User no encontrado');

    }

    // REESTABLECER CONTRASEÑA DEL USER
    async nuevaPassword(token: string, newPasswordDto: NewPasswordDto){

        const { clave, confirmarClave } = newPasswordDto;

        // Validamos que las contraseñas coincidan
        if(clave !== confirmarClave){
            throw new UnauthorizedException('Las contraseñas no coinciden');
        }
    
        // validamos el token y extraemos el email
        const payload: JwtPayload = await this.validateToken(token);
    
        const { email } = payload;
        
        // Actualizamos la contraseña del user
        await this.usersService.actualizarPassword(email, clave);

    }

    // ENVIAR CORREO PARA REESTABLECER LA CUENTA DEL USER
    async reestablecerCuenta(reestablecerCuentaDto: ReestablecerDatosDto) {

        const { numeroIdentificacion } = reestablecerCuentaDto;
        
        // Validamos que user si se encuentre en nuestra BD y extraemos la data y el token de acceso
        const { fullName, token, email } = await this.validateUser(numeroIdentificacion);

        const url = `${this.hostFrontend}/actualizar/${token}`;

        const html = `
        <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Encabezado -->
            <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 700;">REESTABLECER CUENTA</h2>
            </div>
            
            <!-- Cuerpo -->
            <div style="padding: 25px; text-align: center;">
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                Buen día <strong>${fullName}</strong>, para reestablecer tu cuenta en <b>GEVID</b> por favor haz click sobre el enlace: <br><br>
                📎 Enlace para reestablecer cuenta: <strong><a href="${url}">Reestablecer contraseña</a></strong>
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

        const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): reestablecer cuenta`;

        // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
        const options: SendMailOptions = {
            to: email,
            subject: subject,
            htmlBody: html
        }
    
        // Enviamos correo para reestablecer la cuents
        const isEmailSend = await this.emailService.sendEmail(options);
    
        if (!isEmailSend){
            throw new InternalServerErrorException('Error al enviar correo para reestablecer cuenta');
        }

    }

    // VALIDAR / VERIFICAR CUENTA DEL USER
    async confirmarCuenta(token: string){
    
        // validamos el token y extraemos el email
        const payload: JwtPayload = await this.validateToken(token);
    
        const { email } = payload;
        
        // Verificamos cuenta del user, se utiliza funcion que esta en el servicio del user
        await this.usersService.validateUser(email);    

    }

    // VALIDAR USER
    async validateUser(numeroIdentificacion: string){
    
        // Verificamos que el user si exista en nuestra BD
        const user = await this.usersService.findOneByNroId(numeroIdentificacion);
    
        if(!user){
            throw new NotFoundException('User no encontrado');
        }
        
        const fullName = `${user.primerNombre} ${user.primerApellido}`;
        
        // Generamos el token
        const token = await this.getJwtToken({ email: user.email, id: user.idUser });
        
        // Retornamos nombre del user y token de acceso
        return {
            fullName,
            token,
            email: user.email
        };
    
    }

    // GENERAR JWT
    async getJwtToken(payload: JwtPayload){
    
        const token = await this.jwtService.signAsync(payload);
    
        return token;

    }

    // VALIDAR JWT
    async validateToken(token: string){
    
        try {
            
            // Validamos que el JWT este firmado con la llave secreta y retornamos el payload
            const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
            secret: this.configService.get<string>('jwtSecret')
            });
            
            return payload;
            
        } catch (error) {
            
            throw new UnauthorizedException('El token expiro o es incorrecto');
    
        }

    }
  
}
