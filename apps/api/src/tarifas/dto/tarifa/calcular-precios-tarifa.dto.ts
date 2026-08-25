import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsPositive, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CalcularPrecioServicioDto {

    @ApiProperty({ description: 'Id del servicio al que se le va a calcular el precio', example: 1, required:true})
    @IsInt({message: 'El valor del campo servicio debe ser un número entero'})
    @IsPositive({message: 'El valor del campo servicio debe ser un numero positivo'})
    idServicio: number;

    @ApiProperty({
        description: 'Costos directos ingresados manualmente. Obligatorio cuando el tipo de tarifa del servicio es "por servicio" o el tipo de servicio es "Monitoreo de alarmas", ya que en esos casos el precio no se puede derivar de la tarifa por hora',
        example: 100000,
        required: false
    })
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo costos directos debe ser un número'})
    @IsPositive({message: 'El valor del campo costos directos debe ser un numero positivo'})
    costosDirectos?: number;

}

export class CalcularPreciosTarifaDto {

    @ApiProperty({ description: 'Id del periodo para el cual se van a calcular los precios (se usan las tarifas por hora de este periodo)', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo periodo debe ser un número'})
    @IsPositive({message: 'El valor del campo periodo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo periodo debe ser minimo 1'})
    idPeriodo: number;

    @ApiProperty({
        description: 'Servicios seleccionados a los que se les va a calcular el precio (con costos directos manuales cuando aplique)',
        type: [CalcularPrecioServicioDto],
        required: true
    })
    @IsArray({message: 'Los servicios deben ser un arreglo'})
    @ArrayMinSize(1, {message: 'Debe enviar al menos un servicio'})
    @ValidateNested({ each: true })
    @Type(() => CalcularPrecioServicioDto)
    servicios: CalcularPrecioServicioDto[];

}
