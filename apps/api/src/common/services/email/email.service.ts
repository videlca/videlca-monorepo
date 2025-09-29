import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Transporter } from "nodemailer";
import * as nodemailer from 'nodemailer';
import { promises as dns } from "dns";

// Opciones requeridas para enviar un email
export interface SendMailOptions {
    to: string | string[];
    subject: string;
    htmlBody: string;
    attachments?: {
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }[];
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
      const emailHostService = this.configService.get<string>('emailHostService');
      
      this.transporter = nodemailer.createTransport({
          service: mailerService,
          host: emailHostService,
          auth: {
            user: mailerEmail,
            pass: senderEmailKey,
          },
          connectionTimeout: 10_000,
          socketTimeout: 20_000,
      });

    }

    // ✅ Validar si el dominio del correo tiene MX
    private async validateEmailDomain(email: string): Promise<boolean> {
      const domain = email.split("@")[1];
      try {
        const mxRecords = await dns.resolveMx(domain);
    
        // Filtrar el caso de Null MX → { exchange: '', priority: 0 }
        const validMx = mxRecords.filter(mx => mx.exchange && mx.exchange.trim() !== "");
    
        return validMx.length > 0;
      } catch {
        return false;
      }
    }
    
    
    // ENVIAR EMAIL
    async sendEmail( options: SendMailOptions ): Promise<boolean> {

        const { to, subject, htmlBody, attachments } = options;

        // Validar dominio antes de enviar
        const validDomain = await this.validateEmailDomain(
          Array.isArray(to) ? to[0] : to
        );
    
        if (!validDomain) {
          return false; // acá ya no dejas crear el correo en tu app
        }
    
        try {
    
          const sentInformation = await this.transporter.sendMail({
            to: to,
            subject: subject,
            html: htmlBody,
            attachments: attachments,
          });
          
          // Si se envia el correo con exito
          return true;
    
        } catch ( error ) {
          
          // Si ocurre un error al enviar el correo 
          return false;
    
        }
    
    }

}