import { IsInt, Min, Max } from 'class-validator'
import { Transform } from 'class-transformer';

export class UpdateEstadoOrdenDto {
    
    @Transform(({ value }) => parseInt(value))
    @IsInt({ message: 'Los días deben ser un número entero' })
    @Min(0, { message: 'Los días no pueden ser negativos' })
    @Max(10, { message: 'Los días no pueden exceder 20' })
    dias: number;

}