import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, PayloadTooLargeException } from '@nestjs/common';
import type { Response } from 'express';

import { MAX_BYTES_IMAGENES_CORREO, MAX_IMAGENES_CORREO } from './creacion-multipart.helper';

// Los errores de multer (subida de imagenes del correo de creacion) llegan en ingles ("Too many files", "File too
// large"...): se traducen para que el usuario entienda el problema. El resto de errores pasan tal cual
const TRADUCCIONES: Record<string, string> = {
  'Too many files': `Se pueden adjuntar maximo ${MAX_IMAGENES_CORREO} imagenes`,
  'File too large': `Cada imagen puede pesar maximo ${MAX_BYTES_IMAGENES_CORREO / (1024 * 1024)} MB`,
  'Unexpected field': 'Las imagenes se deben enviar en el campo "imagenes"',
};

@Catch(BadRequestException, PayloadTooLargeException)
export class ErroresSubidaFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const cuerpo = exception.getResponse();
    const mensaje = typeof cuerpo === 'object' && cuerpo !== null ? (cuerpo as { message?: unknown }).message : cuerpo;
    const traducido = typeof mensaje === 'string' ? TRADUCCIONES[mensaje] : undefined;

    respuesta.status(status).json(
      traducido
        ? { statusCode: status, message: traducido, error: 'Bad Request' }
        : typeof cuerpo === 'object' ? cuerpo : { statusCode: status, message: cuerpo },
    );
  }
}
