import { IsOptional, IsString, MaxLength } from 'class-validator';

// CUERPO MULTIPART DE LA CREACION DE UNA ORDEN DE SERVICIO (POST /orden-servicio). Va en multipart/form-data porque
// lleva las imagenes que se adjuntan al correo de creacion (campo "imagenes", ver controller). Los campos de texto
// llegan como string: "orden" es el CreateOrdenServicioDto en JSON y "destinatarios" un arreglo JSON de correos;
// se parsean y validan en el controller (validarCreacionMultipart)
export class CrearOrdenConNotificacionDto {

  // CreateOrdenServicioDto serializado en JSON
  @IsString()
  orden: string;

  // Mensaje adicional del correo de creacion (no se guarda, solo viaja en el correo)
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'El mensaje adicional no puede superar los 5000 caracteres' })
  mensaje?: string;

  // Arreglo JSON de correos a los que se envia la creacion (al menos uno)
  @IsString()
  destinatarios: string;

}

// Archivo subido por multer (en memoria). Se define aca porque el proyecto no tiene @types/multer
export interface ArchivoSubido {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Datos del correo de creacion que se envia ANTES de confirmar la orden (si el correo falla, la orden no se guarda)
export interface NotificacionCreacionOrden {
  mensaje: string | null;
  destinatarios: string[];
  imagenes: ArchivoSubido[];
}
