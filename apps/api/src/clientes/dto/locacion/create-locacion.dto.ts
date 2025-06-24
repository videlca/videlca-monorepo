import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, Length, ValidateNested, ArrayMinSize, IsNumber, IsPositive, Min } from 'class-validator';
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

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  telefono: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  segundo_telefono?: string;

  @IsNumber({}, {message: 'El valor del campo Cliente debe ser un número'})
  @IsPositive({message: 'El valor del campo Cliente debe ser un numero positivo'})
  @Min(1, {message: 'El valor del campo Cliente debe ser minimo 1'})
  idCliente: number;

  // Array de correos (mínimo 1)
  @IsArray()
  @ArrayMinSize(1, { message: 'La locación debe tener al menos un correo' })
  @ValidateNested({ each: true })
  @Type(() => CreateCorreoDto)
  correos: CreateCorreoDto[];

}