import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";

export class CreateUserDto {

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

    @IsEmail({}, {message: "Debe ser un email válido"})
    @IsNotEmpty()
    @MaxLength(100, { message: 'El campo email no puede exceder los 100 caracteres' })
    email: string;

    @IsOptional()
    @IsString({ message: 'El campo clave debe ser un string' })
    @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La clave no puede exceder los 50 caracteres' })
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La clave debe tener una letra mayúscula, una minúscula y un número'
    })
    clave?: string;

    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero de identificacion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo numero de identificacion no puede exceder los 50 caracteres' })
    numeroIdentificacion: string;
    
    @IsNumber({}, {message: 'El valor del campo Tipo de de identificacion debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de identificacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de identificacion debe ser minimo 1'})
    idTipoIdentificacion: number;
    
    @IsNumber({}, {message: 'El valor del campo Id Rol debe ser un número'})
    @IsPositive({message: 'El valor del campo Id Rol debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Id Rol debe ser minimo 1'})
    idRol: number;
    
}
