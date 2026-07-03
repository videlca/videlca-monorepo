import { IsOptional, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryOption } from '../../../common/interfaces/query-activos.interface';

export class QuerySubSegmentacionesDto {
    
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'segmentacionId debe ser un número' })
  @IsPositive({ message: 'segmentacionId debe ser un numero positivo' })
  segmentacionId?: number;

  @IsOptional()
  @IsEnum(QueryOption, {
    message: 'soloActivos debe ser "true" o "false"',
  })
  soloActivos?: QueryOption;

}