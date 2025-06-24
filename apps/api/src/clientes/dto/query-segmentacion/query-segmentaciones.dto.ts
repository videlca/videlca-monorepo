import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class QuerySegmentacionesDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeSubSegmentaciones?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  soloActivos?: boolean;
}