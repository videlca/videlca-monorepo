import { IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReporteInicioDto {
  @Type(() => Number)
  @IsIn([0, 3, 6, 12], { message: 'El parámetro months debe ser uno de: 0, 3, 6, 12' })
  months: number = 0;
}
