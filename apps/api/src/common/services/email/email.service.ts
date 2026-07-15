import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
    
    private readonly username: string;
    private readonly password: string;
    private readonly tenantId: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly scope: string;

    constructor(
      private readonly configService: ConfigService,
    ){
      // INICIALIZAR VARIABLES CON LOS VALORES ESTABLECIDOS EN EL ARCHIVO .env
      // Utilizando los nombres requeridos o las versiones en mayúsculas como fallback
      this.username = this.configService.get<string>('GRAPH_USERNAME') || this.configService.get<string>('username');
      this.password = this.configService.get<string>('password') || this.configService.get<string>('GRAPH_PASSWORD');
      this.tenantId = this.configService.get<string>('tenantId') || this.configService.get<string>('GRAPH_TENANT_ID');
      this.clientId = this.configService.get<string>('clientId') || this.configService.get<string>('GRAPH_CLIENT_ID');
      this.clientSecret = this.configService.get<string>('clientSecret') || this.configService.get<string>('GRAPH_CLIENT_SECRET');
      this.scope = this.configService.get<string>('scope') || this.configService.get<string>('GRAPH_SCOPE') || 'https://graph.microsoft.com/.default';
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
    
    // Obtener token de Microsoft Graph API
    private async getToken(): Promise<string> {
      const response = await fetch(
        `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            scope: this.scope,
            grant_type: "client_credentials",
            // username: this.username,
            // password: this.password,
          }),
        }
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Error obteniendo token: ${JSON.stringify(data)}`);
      }

      return data.access_token;
    }

    // ENVIAR EMAIL
    async sendEmail( options: SendMailOptions ): Promise<boolean> {

        return true;

        // const { to, subject, htmlBody, attachments } = options;

        // // Validar dominio antes de enviar
        // const emails = Array.isArray(to) ? to : [to];

        // if (emails.length === 0) {
        //   return true;
        // }

        // for (const email of emails) {
        //   const validDomain = await this.validateEmailDomain(email);
        
        //   if (!validDomain) {
        //     console.error(`Dominio inválido para: ${email}`);
        //     return false;
        //   }
        // }
    
        // try {
        //   // Obtener token de acceso
        //   const accessToken = await this.getToken();

        //   // Formatear destinatarios
        //   const toRecipients = emails.map(email => ({
        //     emailAddress: {
        //       address: email.trim(),
        //     },
        //   }));
          
        //   // Formatear adjuntos
        //   let formattedAttachments = [];
        //   if (attachments && attachments.length > 0) {
        //       formattedAttachments = attachments.map(att => {
        //           let contentBytes = "";
        //           if (Buffer.isBuffer(att.content)) {
        //               contentBytes = att.content.toString("base64");
        //           } else {
        //               // Si es un string, lo convertimos a base64 (Graph API lo requiere en base64)
        //               contentBytes = Buffer.from(att.content).toString("base64");
        //           }
                  
        //           return {
        //               "@odata.type": "#microsoft.graph.fileAttachment",
        //               name: att.filename,
        //               contentType: att.contentType || "application/octet-stream",
        //               contentBytes: contentBytes
        //           };
        //       });
        //   }


        //   const emailSender = this.username;
        //   // Enviar correo usando Microsoft Graph
        //   const response = await fetch(`https://graph.microsoft.com/v1.0/users/${emailSender}/sendMail`, {
        //       method: "POST",
        //       headers: {
        //           "Authorization": `Bearer ${accessToken}`,
        //           "Content-Type": "application/json"
        //       },
        //       body: JSON.stringify({
        //           message: {
        //               subject: subject,
        //               body: {
        //                   contentType: "HTML",
        //                   content: htmlBody
        //               },
        //               toRecipients: toRecipients,
        //               attachments: formattedAttachments.length > 0 ? formattedAttachments : undefined
        //           },
        //           // saveToSentItems: "true"
        //       })
        //   });

        //   if (!response.ok) {
        //       const errorData = await response.json();
        //       console.error("Error al enviar email via Graph API:", errorData);
        //       return false;
        //   }
          
        //   // Si se envia el correo con exito
        //   return true;
    
        // } catch ( error ) {
        //   console.error("Excepción al enviar email:", error);
        //   // Si ocurre un error al enviar el correo 
        //   return false;
    
        // }
    
    }

}