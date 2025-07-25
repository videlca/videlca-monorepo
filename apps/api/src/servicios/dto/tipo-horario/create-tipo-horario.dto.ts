import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, Matches, IsNumber, IsPositive, Min, IsNotEmpty, MaxLength, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTipoHorarioDto {

    @ApiProperty({ description: 'Id del tipo de horario descripcion', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo Tipo de horario descripcion debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de horario descripcion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de horario descripcion debe ser minimo 1'})
    idTipoHorarioDescripcion: number;
    
    @ApiProperty({ description: 'Hora de inicio del tipo de horario', example: '06:00:00', required:true})
    @IsString({ message: 'El campo Hora de inicio debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaInicio debe tener formato HH:mm:ss'
    })
    horaInicio: string;
    
    @ApiProperty({ description: 'Hora de finalizacion del tipo de horario', example: '18:00:00', required:true})
    @IsString({ message: 'El campo Hora de fin debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaFin debe tener formato HH:mm:ss'
    })
    horaFin: string;

    @ApiProperty({ description: 'Fecha de inicio de la vigencia del horario', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaVigenciaInicio: Date;
    
    @ApiProperty({ description: 'Fecha de fin de la vigencia del horario', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false}) 
    @IsOptional()   
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaVigenciaFin?: Date;

}