import { InternalServerErrorException } from '@nestjs/common';

import { EmailService } from '../../common/services';
import { SendMailOptions } from '../../common/services/email/email.service';

import { CreateCorreoDto } from '../dto';

// CORREO DE BIENVENIDA A UN CONTACTO QUE SE AGREGA PARA RECIBIR LAS NOTIFICACIONES DE LAS ORDENES (de un puesto o de
// un cliente), para confirmar que el correo funciona. descripcionDestino: ej. "el puesto Bodega 3" o "el cliente Acme"
export async function enviarCorreoContactoVinculado(
    emailService: EmailService,
    correoInfo: CreateCorreoDto,
    descripcionDestino: string,
) {

    const nombreCompleto = `${correoInfo.nombre} ${correoInfo.apellido}`;

    const html = `
        <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Encabezado -->
            <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CORREO VINCULADO A LAS NOTIFICACIONES DE GEVID</h2>
            </div>
            
            <!-- Cuerpo -->
            <div style="padding: 25px; text-align: center;">
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                Buen día <strong>${nombreCompleto}</strong>, este correo ha sido añadido en el sistema de notificaciones de <b>Videlca</b> para ${descripcionDestino}.
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

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): correo electronico vinculado a la aplicacion para ${descripcionDestino}`;

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
        to: correoInfo.email,
        subject: subject,
        htmlBody: html
    };

    // Enviamos correo para notificar al usuario
    const isEmailSend = await emailService.sendEmail(options);

    if (!isEmailSend){
        throw new InternalServerErrorException(`Error al enviar correo de notificacion al email ${correoInfo.email}, revisar correo si esta bien escrito`);
    }

}
