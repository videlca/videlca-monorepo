import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, Matches, IsNotEmpty, MaxLength, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTipoHorarioDto {

    @ApiProperty({ description: 'Hora de inicio del horario diurno', example: '06:00:00', required:true})
    @IsString({ message: 'El campo Hora de inicio diurno debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio diurno no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio diurno no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaInicioDiurno debe tener formato HH:mm:ss'
    })
    horaInicioDiurno: string;

    @ApiProperty({ description: 'Hora de finalizacion del horario diurno', example: '19:00:00', required:true})
    @IsString({ message: 'El campo Hora de fin diurno debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin diurno no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin diurno no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaFinDiurno debe tener formato HH:mm:ss'
    })
    horaFinDiurno: string;

    @ApiProperty({ description: 'Hora de inicio del horario nocturno', example: '19:00:00', required:true})
    @IsString({ message: 'El campo Hora de inicio nocturno debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio nocturno no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio nocturno no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaInicioNocturno debe tener formato HH:mm:ss'
    })
    horaInicioNocturno: string;

    @ApiProperty({ description: 'Hora de finalizacion del horario nocturno', example: '06:00:00', required:true})
    @IsString({ message: 'El campo Hora de fin nocturno debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin nocturno no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin nocturno no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaFinNocturno debe tener formato HH:mm:ss'
    })
    horaFinNocturno: string;

    @ApiProperty({ description: 'Fecha de inicio de la vigencia del horario', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaVigenciaInicio: Date;

    @ApiProperty({ description: 'Fecha de fin de la vigencia del horario', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false})
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fechaVigenciaFin?: Date | null;

}
