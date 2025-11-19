import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, Matches, IsNumber, IsPositive, Min, IsNotEmpty, MaxLength, IsDate, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdatePersonalServicioDto {
    
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

export class UpdateOrdenServicioTarifaDto {

    @ApiProperty({ description: 'Id de tarifa', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tarifa debe ser un número'})
    @IsPositive({message: 'El valor del campo tarifa debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tarifa debe ser minimo 1'})
    idTarifa: number;
    
    @ApiProperty({ description: 'cantidad personal', example: 1, required:true})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo cantidad personal debe ser un número'})
    cantidadPersonal?: number | null;

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
    
    @ApiProperty({ description: 'Precio del servicio de la orden de servicio', example: 14000000, required: false}) 
    @IsOptional()   
    @IsNumber({}, {message: 'El valor del campo precio debe ser un número'})
    precio?: number | null;
    
    // Array de servicios para una orden (opcional)
    @ApiProperty({ 
        description: 'Lista de personal asignado al servicio', 
        type: [UpdatePersonalServicioDto],
        required: false,
        example: [
            { idPersonal: 1, horaInicio: '06:00:00', horaFin: '18:00:00'},
            { idPersonal: 2, horaInicio: '06:00:00', horaFin: '18:00:00' }
        ]
    })
    @IsArray()
    @IsOptional()   
    @ValidateNested({ each: true })
    @Type(() => UpdatePersonalServicioDto)
    personal?: UpdatePersonalServicioDto[];

}

export class UpdateOrdenServicioDto {

    @ApiProperty({ description: 'Fecha de inicio de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicio: Date;
    
    @ApiProperty({ description: 'Fecha de fin de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false}) 
    @IsOptional()   
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fechaFin?: Date | null;
    
    @ApiProperty({ description: 'Precio total de la orden de servicio', example: 14000000, required: false}) 
    @IsOptional()   
    @IsNumber({}, {message: 'El valor del campo precio total debe ser un número'})
    precioTotal?: number | null;

    @ApiProperty({ description: 'Fecha de Actualizacion de la orden de servicio, se toma desde el front para tomar fecha del sistema', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaActualizacion: Date;

    // Array de servicios para una orden (mínimo 1)
    // @ApiProperty({ 
    //     description: 'Lista de servicios de la orden', 
    //     type: [UpdateOrdenServicioTarifaDto],
    //     required: true,
    //     example: [
    //         {
    //             idTarifa: 1,
    //             cantidadPersonal: 2,
    //             horaInicio: '06:00:00',
    //             horaFin: '18:00:00',
    //             personal: [
    //                 { idPersonal: 1, horaInicio: '06:00:00', horaFin: '18:00:00'},
    //                 { idPersonal: 2, horaInicio: '06:00:00', horaFin: '18:00:00' }
    //             ]
    //         }
    //     ]
    // })
    // @IsArray()
    // @ArrayMinSize(1, { message: 'La orden de servicio debe tener al menos un servicio' })
    // @ValidateNested({ each: true })
    // @Type(() => UpdateOrdenServicioTarifaDto)
    // servicios: UpdateOrdenServicioTarifaDto[];

}