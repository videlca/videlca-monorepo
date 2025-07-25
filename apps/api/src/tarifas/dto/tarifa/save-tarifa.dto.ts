import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ValidateNested, ArrayMinSize, IsNumber, IsPositive, Min } from "class-validator";
import { Type } from "class-transformer";
import { CreateTarifaDto } from "./create-tarifa.dto";

export class SaveTarifaDto {
    
    @ApiProperty({ 
        description: 'Id del periodo para el cual se van a crear/actualizar las tarifas', 
        example: 1, 
        required: true 
    })
    @IsNumber({}, {message: 'El valor del campo periodo debe ser un número'})
    @IsPositive({message: 'El valor del campo periodo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo periodo debe ser minimo 1'})
    idPeriodo: number;

    @ApiProperty({ 
        description: 'Lista de tarifas a crear/actualizar', 
        type: [CreateTarifaDto],
        required: true 
    })
    @IsArray({message: 'Las tarifas deben ser un arreglo'})
    @ArrayMinSize(1, {message: 'Debe enviar al menos una tarifa'})
    @ValidateNested({ each: true })
    @Type(() => CreateTarifaDto)
    tarifas: CreateTarifaDto[];

}