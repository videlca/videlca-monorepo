import { IsArray, IsNotEmpty, IsOptional, IsString, IsEmail, Length, ValidateNested, ArrayMinSize, IsNumber, IsPositive, Min, Max, MaxLength, IsNumberString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateCorreoDto {

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  apellido: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Length(1, 100)
  email: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'El correo debe tener al menos un estado' })
  @IsNotEmpty({ each: true })
  estados: number[]; // Array de IDs de estados

}

export class CreateLocacionDto {
    
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nombre: string;

  @IsNumber({}, {message: 'El valor del campo Ciudad debe ser un número'})
  @IsPositive({message: 'El valor del campo Ciudad debe ser un numero positivo'})
  @Min(1, {message: 'El valor del campo Ciudad debe ser minimo 1'})
  idCiudad: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  direccion: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  latitud: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  longitud: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  primerNombreResponsable: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  primerApellidoResponsable: string;

  @IsNotEmpty()
  @IsNumberString({}, {message: 'El valor del campo telefono debe ser un número'})
  @Length(10, 10, { message: 'El campo telefono debe tener exactamente 10 caracteres' })
  telefono: string;

  @IsOptional()
  @IsNumberString({}, {message: 'El valor del campo segundo telefono debe ser un número'})
  @Length(10, 10, { message: 'El segundo teléfono debe tener exactamente 10 dígitos' })
  segundoTelefono?: string;

  @IsNumber({}, {message: 'El valor del campo dias de anticipacion debe ser un número'})
  @IsPositive({message: 'El valor del campo dias de anticipacion debe ser un numero positivo'})
  @Min(1, {message: 'El valor del campo dias de anticipacion debe ser minimo 1'})
  @Max(10, {message: 'El valor del campo dias de anticipacion debe ser maximo 10'})
  diasAnticipaticionNotificacion: number;

  @IsNumber({}, {message: 'El valor del campo Cliente debe ser un número'})
  @IsPositive({message: 'El valor del campo Cliente debe ser un numero positivo'})
  @Min(1, {message: 'El valor del campo Cliente debe ser minimo 1'})
  idCliente: number;
  
  @IsOptional()
  @IsNumber({}, {message: 'El valor del campo Cliente Facturacion debe ser un número'})
  @IsPositive({message: 'El valor del campo Cliente Facturacion debe ser un numero positivo'})
  @Min(1, {message: 'El valor del campo Cliente Facturacion debe ser minimo 1'})
  idClienteFacturacion?: number;

  // Array de correos (mínimo 1)
  @IsArray()
  @ArrayMinSize(1, { message: 'La locación debe tener al menos un correo' })
  @ValidateNested({ each: true })
  @Type(() => CreateCorreoDto)
  correos: CreateCorreoDto[];

}