import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Transporter } from "nodemailer";
import * as nodemailer from 'nodemailer';

// Opciones requeridas para enviar un email
export interface SendMailOptions {
    to: string | string[];
    subject: string;
    htmlBody: string;
}

@Injectable()
export class EmailService {
    
    private transporter: Transporter;

    constructor(
      private readonly configService: ConfigService,
    ){
      
      // INICIALIZAR VARIABLES CON LOS VALORES ESTABLECIDOS EN EL ARCHIVO .env
      // estas variables son de configuracion para el envio de emails
      const mailerService = this.configService.get<string>('mailerService');
      const mailerEmail = this.configService.get<string>('mailerEmail');
      const senderEmailKey = this.configService.get<string>('mailerSecretKey');
      
      this.transporter = nodemailer.createTransport({
          service: mailerService,
          auth: {
            user: mailerEmail,
            pass: senderEmailKey,
          }
      });

    }
    
    // ENVIAR EMAIL
    async sendEmail( options: SendMailOptions ): Promise<boolean> {

        const { to, subject, htmlBody } = options;
    
        try {
    
          const sentInformation = await this.transporter.sendMail({
            to: to,
            subject: subject,
            html: htmlBody,
          });
          
          // Si se envia el correo con exito
          return true;
    
        } catch ( error ) {
          
          // Si ocurre un error al enviar el correo 
          return false;
    
        }
    
    }

}