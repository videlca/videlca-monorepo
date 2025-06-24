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
        const user = await this.usersService.findOneByEmailWithPassword(loginDto.email);
        
        // Validar si existe
        if(!user){
            throw new UnauthorizedException('Email o contraseña es incorrecto');
        }
        
        if(!user.estado){
            throw new ForbiddenException('Tu cuenta no está activa, por favor, recupera tu cuenta');
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
            email: user.email
            }
        };
    }
    
    // ENVIAR CORREO PARA REESTABLECER LA CONTRASEÑA DEL USER DEL APLICATIVO
    async olvidePassword(olvidePasswordDto: ReestablecerDatosDto) {
    
        const { nroIdentificacion } = olvidePasswordDto;
            
        // VALIDACION USER
        // Validamos que user si se encuentre en nuestra BD y extraemos la data y el token de acceso
        const { fullName, token, email } = await this.validateUser(nroIdentificacion);

        const url = `${this.hostFrontend}/auth/olvide-password/${token}`;

        const nombreCompleto = fullName;        
    
        const html = `
        <div style="background-color: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); padding: 20px; max-width: 600px; margin: 20px auto; text-align: center; font-family: 'Poppins', sans-serif;">
            <h2 style="margin-bottom: 20px; color: #333; font-weight: 700;">Reestablecer contraseña en GEVID 👮‍♂️</h2>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">Buen día ${nombreCompleto}, para reestablecer tu contraseña en GEVID por favor haz click sobre el enlace</p>
            <div style="background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p>📎 Enlace para reestablecer contraseña: <strong><a href="${url}">Reestablecer contraseña</a></strong></p>
            </div>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">Si tu no creaste una cuenta en Dtime omiste este mensaje.</p>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">Saludos,</p>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">El equipo de Dtime</p>
            <img src="${this.hostPublic}/dtime_imgs/logo_dtime.png" alt="Dtime" style="width: 100%; height: auto; margin-top: 20px; border-radius: 5px;">
        </div>
        `;
        
        const subject = `${nombreCompleto} Reestablece tu contraseña en Dtime`;
    
        // Enviamos correo para reestablecer la contraseña
        const isEmailSend = await this.sendEmail(email, html, subject);
    
        if (!isEmailSend){
            throw new InternalServerErrorException('Error al enviar correo para reestablecer contraseña');
        }

    }

    // VALIDAR USER DEL APLICATIVO WEB (FRONTEND) y DASHBOARD (BACKEND)
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

    // REESTABLECER CONTRASEÑA DEL USER DEL APLICATIVO WEB (FRONTEND)
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

    // ENVIAR CORREO PARA REESTABLECER LA CUENTA DEL USER DEL APLICATIVO
    async reestablecerCuenta(reestablecerCuentaDto: ReestablecerDatosDto) {

        const { nroIdentificacion } = reestablecerCuentaDto;
        
        // Validamos que user si se encuentre en nuestra BD y extraemos la data y el token de acceso
        const { fullName, token, email } = await this.validateUser(nroIdentificacion);

        const url = `${this.hostFrontend}/auth/confirmar/${token}`;
    
        const html = `
        <div style="background-color: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); padding: 20px; max-width: 600px; margin: 20px auto; text-align: center; font-family: 'Poppins', sans-serif;">
            <h2 style="margin-bottom: 20px; color: #333; font-weight: 700;">Reestablecer cuenta en Dtime 🚚</h2>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">Buen día ${fullName}, para reestablecer tu cuenta en GEVID por favor haz click sobre el enlace</p>
            <div style="background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p>📎 Enlace para reestablecer cuenta: <strong><a href="${url}">Reestablecer cuenta</a></strong></p>
            </div>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">Si tu no creaste una cuenta en Dtime omiste este mensaje.</p>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">Saludos,</p>
            <p style="line-height: 1.6; margin: 10px 0; color: #555;">El equipo de Dtime</p>
            <img src="${this.hostPublic}/dtime_imgs/logo_dtime.png" alt="Dtime" style="width: 100%; height: auto; margin-top: 20px; border-radius: 5px;">
        </div>
        `;
        
        const subject = `${fullName} Reestablece tu cuenta en Dtime`;
    
        // Enviamos correo para reestablecer la cuents
        const isEmailSend = await this.sendEmail(email, html, subject);
    
        if (!isEmailSend){
            throw new InternalServerErrorException('Error al enviar correo para reestablecer cuenta');
        }

    }

    // VALIDAR / VERIFICAR CUENTA DEL USER DEL APLICATIVO WEB (FRONTEND)
    async confirmarCuenta(token: string){
    
        // validamos el token y extraemos el email
        const payload: JwtPayload = await this.validateToken(token);
    
        const { email } = payload;
        
        // Verificamos cuenta del user, se utiliza funcion que esta en el servicio del user
        await this.usersService.validateUser(email);    

    }

    // VALIDAR USER DEL APLICATIVO
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

    // EMAIL PARA REESTABLECER CONTRASEÑA
    async sendEmail(email: string, html: string, subject: string) {
    
        // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
        const options: SendMailOptions = {
            to: email,
            subject: subject,
            htmlBody: html
        }
        
        const isSend = await this.emailService.sendEmail(options);
        
        return isSend; 

    }
  
}
