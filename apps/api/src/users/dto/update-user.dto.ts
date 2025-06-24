import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";

export class UpdateUserDto {
    
    @IsOptional()
    @IsString({ message: 'El campo primer nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo primer nombre no puede exceder los 50 caracteres' })
    primerNombre?: string;
    
    @IsOptional()
    @IsString({ message: 'El campo segundo nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo segundo nombre no puede exceder los 50 caracteres' })
    segundoNombre?: string;
    
    @IsOptional()
    @IsString({ message: 'El campo primer apellido debe ser un string'})
    @MaxLength(50, { message: 'El campo primer apellido no puede exceder los 50 caracteres' })
    primerApellido?: string
    
    @IsOptional()
    @IsString({ message: 'El campo segundo nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo segundo nombre no puede exceder los 50 caracteres' })
    segundoApellido?: string;
    
    @IsOptional()
    @IsEmail({}, {message: "Debe ser un email válido"})
    @MaxLength(100, { message: 'El campo email no puede exceder los 100 caracteres' })
    email?: string;

    @IsOptional()
    @IsString({ message: 'El campo clave debe ser un string' })
    @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La clave no puede exceder los 50 caracteres' })
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La clave debe tener una letra mayúscula, una minúscula y un número'
    })
    clave?: string;
    
    @IsOptional()
    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @MaxLength(50, { message: 'El campo numero de identificacion no puede exceder los 50 caracteres' })
    numeroIdentificacion?: string;
    
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo Tipo de de identificacion debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de identificacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de identificacion debe ser minimo 1'})
    idTipoIdentificacion?: number;

}
