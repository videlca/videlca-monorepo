import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min, IsDateString } from "class-validator";

export class CreatePersonalDto {

    @IsString({ message: 'El campo primer nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo primer nombre no puede estar vacío' })
    @MaxLength(50, { message: 'El campo primer nombre no puede exceder los 50 caracteres' })
    primerNombre: string;
    
    @IsString({ message: 'El campo segundo nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo segundo nombre no puede exceder los 50 caracteres' })
    @IsOptional()
    segundoNombre?: string;
    
    @IsString({ message: 'El campo primer apellido debe ser un string'})
    @IsNotEmpty({ message: 'El campo primer apellido no puede estar vacío' })
    @MaxLength(50, { message: 'El campo primer apellido no puede exceder los 50 caracteres' })
    primerApellido: string
    
    @IsString({ message: 'El campo segundo nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo segundo nombre no puede exceder los 50 caracteres' })
    @IsOptional()
    segundoApellido?: string;

    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero de identificacion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo numero de identificacion no puede exceder los 50 caracteres' })
    numeroIdentificacion: string;
    
    @IsNumber({}, {message: 'El valor del campo Tipo de identificacion debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de identificacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de identificacion debe ser minimo 1'})
    idTipoIdentificacion: number;

    @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida' })
    fechaInicioContrato: string;
    
    @IsDateString({}, { message: 'fechaFin debe ser una fecha válida' })
    @IsOptional()
    fechaFinContrato?: string;

    @IsDateString()
    fechaNacimiento: string;
    
    @IsString({ message: 'El campo direccion residencia debe ser un string'})
    @IsNotEmpty({ message: 'El campo direccion residencia no puede estar vacío' })
    @MaxLength(100, { message: 'El campo direccion residencia no puede exceder los 50 caracteres' })
    direccionResidencia: string;
    
    @IsString({ message: 'El campo telefono debe ser un string'})
    @IsNotEmpty({ message: 'El campo telefono no puede estar vacío' })
    @MaxLength(50, { message: 'El campo telefono no puede exceder los 50 caracteres' })
    telefono: string;
    
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    arma: boolean;

    @IsNumber({}, {message: 'El valor del campo ciudad debe ser un número'})
    @IsPositive({message: 'El valor del ciudad debe ser un numero positivo'})
    @Min(1, {message: 'El valor del ciudad debe ser minimo 1'})
    idCiudad: number;

    @IsNumber({}, {message: 'El valor del campo tipo genero debe ser un número'})
    @IsPositive({message: 'El valor del tipo genero debe ser un numero positivo'})
    @Min(1, {message: 'El valor del tipo genero debe ser minimo 1'})
    idTipoGenero: number;

    @IsNumber({}, {message: 'El valor del campo tipo personal debe ser un número'})
    @IsPositive({message: 'El valor del tipo personal debe ser un numero positivo'})
    @Min(1, {message: 'El valor del tipo personal debe ser minimo 1'})
    idTipoPersonal: number;   
    
}
