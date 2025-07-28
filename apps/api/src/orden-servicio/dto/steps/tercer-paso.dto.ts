import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, IsNumber, IsPositive, Min, IsNotEmpty, MaxLength } from 'class-validator';

export class TercerPasoDto {
    
    @ApiProperty({ description: 'Id de tarifa', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tarifa debe ser un número'})
    @IsPositive({message: 'El valor del campo tarifa debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tarifa debe ser minimo 1'})
    idTarifa: number;
    
    @ApiProperty({ description: 'Hora de inicio por dia del servicio', example: '06:00:00', required:true})
    @IsString({ message: 'El campo Hora de inicio debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaInicio debe tener formato HH:mm:ss'
    })
    horaInicio: string;
    
    @ApiProperty({ description: 'Hora de finalizacion por dia del servicio', example: '18:00:00', required:true})
    @IsString({ message: 'El campo Hora de fin debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaFin debe tener formato HH:mm:ss'
    })
    horaFin: string;

}