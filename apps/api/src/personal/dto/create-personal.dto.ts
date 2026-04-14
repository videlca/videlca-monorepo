import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsPositive, IsString, MaxLength, Min, IsDateString, IsDate, MinLength } from "class-validator";

export class CreatePersonalDto {
    
    @ApiProperty({ description: 'Primer nombre del personal', example: 'Pepito', required:true})
    @IsString({ message: 'El campo primer nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo primer nombre no puede estar vacío' })
    @MaxLength(50, { message: 'El campo primer nombre no puede exceder los 50 caracteres' })
    primerNombre: string;
    
    @ApiProperty({ description: 'Segundo nombre del personal', example: 'Pedro', required:false})
    @IsString({ message: 'El campo segundo nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo segundo nombre no puede exceder los 50 caracteres' })
    @IsOptional()
    segundoNombre?: string;
    
    @ApiProperty({ description: 'Primer apellido del personal', example: 'Perez', required:true})
    @IsString({ message: 'El campo primer apellido debe ser un string'})
    @IsNotEmpty({ message: 'El campo primer apellido no puede estar vacío' })
    @MaxLength(50, { message: 'El campo primer apellido no puede exceder los 50 caracteres' })
    primerApellido: string

    @ApiProperty({ description: 'Segundo apellido del personal', example: 'Garcia', required:false})
    @IsString({ message: 'El campo segundo nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo segundo nombre no puede exceder los 50 caracteres' })
    @IsOptional()
    segundoApellido?: string;

    @ApiProperty({ description: 'Número de identificación del personal', example: '111222333', required:true})
    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero de identificacion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo numero de identificacion no puede exceder los 50 caracteres' })
    @IsNumberString({}, { message: 'Solo números permitidos' })
    numeroIdentificacion: string;
    
    @ApiProperty({ description: 'Tipo de identificación del personal', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo Tipo de identificacion debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de identificacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de identificacion debe ser minimo 1'})
    idTipoIdentificacion: number;

    @ApiProperty({ description: 'Fecha de inicio de la vigencia del contrato', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicioContrato: Date;
    
    @ApiProperty({ description: 'Fecha de inicio de la vigencia del contrato', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fechaFinContrato?: Date | null;

    @ApiProperty({ description: 'Fecha de nacimiento del personal', example: '15/01/1995', required:true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaNacimiento: Date;
    
    @ApiProperty({ description: 'Fecha actual', example: '15/01/1995', required:true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaActual: Date;
    
    @ApiProperty({ description: 'Dirección de residencia del personal', example: 'Calle 1 # 2 - 3', required:true})
    @IsString({ message: 'El campo direccion residencia debe ser un string'})
    @IsNotEmpty({ message: 'El campo direccion residencia no puede estar vacío' })
    @MaxLength(100, { message: 'El campo direccion residencia no puede exceder los 50 caracteres' })
    direccionResidencia: string;
    
    @ApiProperty({ description: 'Telefono del personal', example: '3014445566', required:true})
    @IsString({ message: 'El campo telefono debe ser un string'})
    @IsNotEmpty({ message: 'El campo telefono no puede estar vacío' })
    @MaxLength(10, { message: 'El campo telefono no puede exceder los 10 caracteres' })
    @MinLength(10, { message: 'El campo telefono debe tener 10 caracteres' })
    telefono: string;
    
    @ApiProperty({ description: 'El personal posee Arma?', example: false, required:true})
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    arma: boolean;

    @ApiProperty({ description: 'Id de la ciudad', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo ciudad debe ser un número'})
    @IsPositive({message: 'El valor del ciudad debe ser un numero positivo'})
    @Min(1, {message: 'El valor del ciudad debe ser minimo 1'})
    idCiudad: number;

    @ApiProperty({ description: 'Id del genero del personal', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tipo genero debe ser un número'})
    @IsPositive({message: 'El valor del tipo genero debe ser un numero positivo'})
    @Min(1, {message: 'El valor del tipo genero debe ser minimo 1'})
    idTipoGenero: number;

    @ApiProperty({ description: 'Id del tipo de personal', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tipo personal debe ser un número'})
    @IsPositive({message: 'El valor del tipo personal debe ser un numero positivo'})
    @Min(1, {message: 'El valor del tipo personal debe ser minimo 1'})
    idTipoPersonal: number;   
    
    @ApiProperty({ description: 'Id del tipo de contrato', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tipo contrato debe ser un número'})
    @IsPositive({message: 'El valor del tipo contrato debe ser un numero positivo'})
    @Min(1, {message: 'El valor del tipo contrato debe ser minimo 1'})
    idTipoContrato: number;   
    
}
