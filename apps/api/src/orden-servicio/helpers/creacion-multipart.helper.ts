import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { isEmail, validate, type ValidationError } from 'class-validator';

import { CreateOrdenServicioDto } from '../dto';
import type { ArchivoSubido, CrearOrdenConNotificacionDto, NotificacionCreacionOrden } from '../dto/orden-servicio/crear-orden-con-notificacion.dto';

export const MAX_IMAGENES_CORREO = 5;
// El servicio de correo (Microsoft Graph) no acepta mensajes de mas de ~4 MB en total; se deja margen para el PDF
export const MAX_BYTES_IMAGENES_CORREO = 3 * 1024 * 1024;
export const MAX_DESTINATARIOS_CORREO = 50;
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Mismos mensajes que el ValidationPipe global (ver main.ts)
const mensajesValidacion = (errores: ValidationError[]): string[] => {
  const mensajes: string[] = [];
  const extraer = (errs: ValidationError[]) => {
    for (const err of errs) {
      if (err.constraints) mensajes.push(...Object.values(err.constraints));
      if (err.children?.length) extraer(err.children);
    }
  };
  extraer(errores);
  return mensajes;
};

const parsearJson = (texto: string, campo: string): unknown => {
  try {
    return JSON.parse(texto);
  } catch {
    throw new BadRequestException(`El campo "${campo}" no es un JSON valido`);
  }
};

// PARSEA Y VALIDA EL CUERPO MULTIPART DE LA CREACION DE UNA ORDEN: la orden (con las mismas reglas que el
// ValidationPipe global: whitelist + forbidNonWhitelisted + conversion implicita), los destinatarios (al menos un
// correo valido, sin repetidos) y las imagenes (maximo 5, solo imagenes, 3 MB en total)
export const validarCreacionMultipart = async (
  body: CrearOrdenConNotificacionDto,
  imagenes: ArchivoSubido[] = [],
): Promise<{ orden: CreateOrdenServicioDto; notificacion: NotificacionCreacionOrden }> => {

  const orden = plainToInstance(CreateOrdenServicioDto, parsearJson(body.orden, 'orden'), {
    enableImplicitConversion: true,
  });
  const errores = await validate(orden, { whitelist: true, forbidNonWhitelisted: true });
  if (errores.length) throw new BadRequestException(mensajesValidacion(errores));

  const destinatariosJson = parsearJson(body.destinatarios, 'destinatarios');
  if (!Array.isArray(destinatariosJson) || destinatariosJson.some((d) => typeof d !== 'string')) {
    throw new BadRequestException('Los destinatarios deben ser una lista de correos');
  }
  const destinatarios = [...new Set(destinatariosJson.map((d: string) => d.trim().toLowerCase()).filter(Boolean))];
  if (destinatarios.length === 0) {
    throw new BadRequestException('Debe seleccionar al menos un destinatario para el correo de creacion de la orden');
  }
  if (destinatarios.length > MAX_DESTINATARIOS_CORREO) {
    throw new BadRequestException(`El correo de creacion admite maximo ${MAX_DESTINATARIOS_CORREO} destinatarios`);
  }
  const invalidos = destinatarios.filter((d) => !isEmail(d));
  if (invalidos.length) {
    throw new BadRequestException(`Correos no validos: ${invalidos.join(', ')}`);
  }

  if (imagenes.length > MAX_IMAGENES_CORREO) {
    throw new BadRequestException(`Se pueden adjuntar maximo ${MAX_IMAGENES_CORREO} imagenes`);
  }
  const noImagen = imagenes.find((img) => !TIPOS_IMAGEN.includes(img.mimetype));
  if (noImagen) {
    throw new BadRequestException(`El archivo "${noImagen.originalname}" no es una imagen (JPG, PNG, WEBP o GIF)`);
  }
  const totalBytes = imagenes.reduce((acc, img) => acc + img.size, 0);
  if (totalBytes > MAX_BYTES_IMAGENES_CORREO) {
    throw new BadRequestException('Las imagenes superan los 3 MB en total, que es lo maximo que admite el correo');
  }

  const mensaje = body.mensaje?.trim() || null;

  return { orden, notificacion: { mensaje, destinatarios, imagenes } };
};
