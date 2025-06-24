import { IsOptional, IsBoolean, IsNumber, IsPositive } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QuerySubSegmentacionesDto {
    
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'segmentacionId debe ser un número' })
  @IsPositive({ message: 'segmentacionId debe ser un numero positivo' })
  segmentacionId?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  soloActivos?: boolean;

}