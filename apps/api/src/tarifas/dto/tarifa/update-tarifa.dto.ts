import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateTarifaDto {

    @ApiProperty({
        description: 'Costos directos ingresados manualmente. Solo se usa (y es obligatorio) cuando el tipo de tarifa del servicio de esta tarifa es "por servicio" o el tipo de servicio es Monitoreo de alarmas, ya que en esos casos el precio no se puede derivar de la tarifa por hora. El resto de campos de precio (seguro de vida, aui, iva, etc.) siempre se recalculan automaticamente segun las reglas vigentes',
        example: 100000,
        required: false
    })
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo costos directos debe ser un número'})
    @IsPositive({message: 'El valor del campo costos directos debe ser un numero positivo'})
    costosDirectos?: number;

    @ApiProperty({ description: 'Identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
