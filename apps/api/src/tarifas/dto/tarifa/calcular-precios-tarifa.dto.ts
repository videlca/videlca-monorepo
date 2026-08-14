import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsInt, IsNumber, IsPositive, Min } from "class-validator";

export class CalcularPreciosTarifaDto {

    @ApiProperty({ description: 'Id del periodo para el cual se van a calcular los precios (se usan las tarifas por hora de este periodo)', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo periodo debe ser un número'})
    @IsPositive({message: 'El valor del campo periodo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo periodo debe ser minimo 1'})
    idPeriodo: number;

    @ApiProperty({ description: 'Ids de los servicios seleccionados a los que se les va a calcular el precio', example: [1, 2, 3], required:true})
    @IsArray({message: 'Los servicios deben ser un arreglo'})
    @ArrayMinSize(1, {message: 'Debe enviar al menos un servicio'})
    @IsInt({each: true, message: 'Cada id de servicio debe ser un número entero'})
    @IsPositive({each: true, message: 'Cada id de servicio debe ser un numero positivo'})
    idsServicios: number[];

}
