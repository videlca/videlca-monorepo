import { IsArray, IsNotEmpty, IsOptional, IsString, IsEmail, Length, ValidateNested, ArrayMinSize, IsNumber, IsPositive, Min, Max, MaxLength, IsNumberString, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateCorreoDto {

  @IsString()
  @IsNotEmpty()
  @Length(1, 50, { message: 'El nombre debe tener entre 1 y 50 caracteres' })
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50, { message: 'El apellido debe tener entre 1 y 50 caracteres' })
  apellido: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'El correo debe ser un correo válido' })
  @Length(1, 100, { message: 'El email debe tener entre 1 y 100 caracteres' })
  email: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'El correo debe tener al menos un estado' })
  @IsNotEmpty({ each: true })
  estados: number[]; // Array de IDs de estados

}

export class CreateLocacionDto {

  @IsString()
  @IsNotEmpty()
  @Length(1, 100, { message: 'El nombre debe tener entre 1 y 100 caracteres' })
  nombre: string;

  @IsNumber({}, { message: 'El valor del campo Ciudad no puede estar vacio' })
  @IsPositive({ message: 'El valor del campo Ciudad no puede estar vacio' })
  @Min(1, { message: 'El valor del campo Ciudad no puede estar vacio' })
  idCiudad: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100, { message: 'La dirección debe tener entre 1 y 100 caracteres' })
  direccion: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 15, { message: 'La latitud debe tener entre 1 y 13 caracteres' })
  latitud: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 15, { message: 'La longitud debe tener entre 1 y 13 caracteres' })
  longitud: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50, { message: 'El primer nombre del responsable debe tener entre 1 y 50 caracteres' })
  primerNombreResponsable: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50, { message: 'El primer apellido del responsable debe tener entre 1 y 50 caracteres' })
  primerApellidoResponsable: string;

  @IsNotEmpty()
  @IsNumberString({}, { message: 'El valor del campo telefono debe ser un número' })
  @Length(10, 10, { message: 'El campo telefono debe tener exactamente 10 caracteres' })
  telefono: string;

  @ValidateIf(o => o.segundoTelefono !== '')
  @IsNumberString({}, { message: 'El valor del campo segundo telefono debe ser un número' })
  @Length(10, 10, { message: 'El segundo teléfono debe tener exactamente 10 dígitos' })
  @IsOptional()
  segundoTelefono?: string;

  @IsNumber({}, { message: 'El valor del campo dias de anticipacion debe ser un número' })
  @IsPositive({ message: 'El valor del campo dias de anticipacion debe ser un numero positivo' })
  @Min(1, { message: 'El valor del campo dias de anticipacion debe ser minimo 1' })
  @Max(10, { message: 'El valor del campo dias de anticipacion debe ser maximo 10' })
  diasAnticipaticionNotificacion: number;

  @IsNumber({}, { message: 'El valor del campo Cliente no puede estar vacio' })
  @IsPositive({ message: 'El valor del campo Cliente no puede estar vacio' })
  @Min(1, { message: 'El valor del campo Cliente no puede estar vacio' })
  idCliente: number;

  @IsOptional()
  @IsNumber({}, { message: 'El valor del campo Cliente Facturacion no puede estar vacio' })
  @IsPositive({ message: 'El valor del campo Cliente Facturacion no puede estar vacio' })
  @Min(1, { message: 'El valor del campo Cliente Facturacion no puede estar vacio' })
  idClienteFacturacion?: number;

  // Array de correos (mínimo 1)
  @IsArray()
  @ArrayMinSize(1, { message: 'La locación debe tener al menos un correo' })
  @ValidateNested({ each: true })
  @Type(() => CreateCorreoDto)
  correos: CreateCorreoDto[];

}