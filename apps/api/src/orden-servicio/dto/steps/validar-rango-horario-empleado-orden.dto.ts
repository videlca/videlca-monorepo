import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsString, Matches, IsNumber, IsPositive, Min, IsNotEmpty, MaxLength, IsOptional, IsDate, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';

export class CreatePersonalServicioDto {
    
    @ApiProperty({ description: 'Id de personal', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo id personal debe ser un número'})
    @IsPositive({message: 'El valor del campo id personal debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo id personal debe ser minimo 1'})
    idPersonal: number;

    @ApiProperty({ description: 'Hora de inicio por dia del empleado para este servicio en una orden', example: '06:00:00', required:true})
    @IsString({ message: 'El campo Hora de inicio debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaInicio debe tener formato HH:mm:ss'
    })
    horaInicio: string;
    
    @ApiProperty({ description: 'Hora de finalizacion por dia del empleado para este servicio en una orden', example: '18:00:00', required:true})
    @IsString({ message: 'El campo Hora de fin debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaFin debe tener formato HH:mm:ss'
    })
    horaFin: string;  

}

export class ValidarRangoHorarioPersonalOrdenDto {
    
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

    // Array de servicios para una orden (opcional)
    @ApiProperty({ 
        description: 'Lista de personal asignado al servicio', 
        type: [CreatePersonalServicioDto],
        required: true,
        example: [
            { idPersonal: 1, horaInicio: '06:00:00', horaFin: '18:00:00'},
            { idPersonal: 2, horaInicio: '06:00:00', horaFin: '18:00:00' }
        ]
    })
    @IsArray()  
    @ArrayMinSize(1, { message: 'el servicio debe tener al menos un personal' })
    @ValidateNested({ each: true })
    @Type(() => CreatePersonalServicioDto)
    personal: CreatePersonalServicioDto[];

}