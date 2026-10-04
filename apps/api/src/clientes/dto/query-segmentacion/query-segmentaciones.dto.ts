import { IsOptional, IsEnum } from 'class-validator';
import { QueryOption } from '../../../common/interfaces/query-activos.interface';

export class QuerySegmentacionesDto {
  @IsOptional()
  @IsEnum(QueryOption, {
    message: 'includeSubSegmentaciones debe ser "true" o "false"',
  })
  includeSubSegmentaciones?: QueryOption;

  @IsOptional()
  @IsEnum(QueryOption, {
    message: 'soloActivos debe ser "true" o "false"',
  })
  soloActivos?: QueryOption;
}