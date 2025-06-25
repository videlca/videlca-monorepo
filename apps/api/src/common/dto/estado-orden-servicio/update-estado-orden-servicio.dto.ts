import { IsInt, Min, Max } from 'class-validator'
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstadoOrdenDto {
    
    @ApiProperty({ description: 'Número de días', example: 3, required:true})
    @Transform(({ value }) => parseInt(value))
    @IsInt({ message: 'Los días deben ser un número entero' })
    @Min(0, { message: 'Los días no pueden ser negativos' })
    @Max(10, { message: 'Los días no pueden exceder 20' })
    dias: number;

}