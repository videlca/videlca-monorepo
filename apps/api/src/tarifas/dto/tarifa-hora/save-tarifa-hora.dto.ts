import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize, IsNumber, IsPositive, Min } from "class-validator";
import { Type } from "class-transformer";
import { CreateTarifaHoraDto } from "./create-tarifa-hora.dto";

export class SaveTarifaHoraDto {

    @ApiProperty({
        description: 'Id del periodo para el cual se van a crear/actualizar las tarifas por hora',
        example: 1,
        required: true
    })
    @IsNumber({}, {message: 'El valor del campo periodo debe ser un número'})
    @IsPositive({message: 'El valor del campo periodo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo periodo debe ser minimo 1'})
    idPeriodo: number;

    @ApiProperty({
        description: 'Lista de las 5 tarifas por hora del periodo (diurna, diurna dominical/festiva, nocturna, nocturna dominical/festiva, seguro de vida)',
        type: [CreateTarifaHoraDto],
        required: true
    })
    @IsArray({message: 'Las tarifas por hora deben ser un arreglo'})
    @ArrayMinSize(5, {message: 'Debe enviar el valor de las 5 tarifas por hora'})
    @ArrayMaxSize(5, {message: 'Debe enviar el valor de las 5 tarifas por hora'})
    @ValidateNested({ each: true })
    @Type(() => CreateTarifaHoraDto)
    tarifas: CreateTarifaHoraDto[];

}
