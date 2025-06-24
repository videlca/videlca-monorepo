import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationDto } from '../../../common/dto'
import { QuerySegmentacionesDto } from './query-segmentaciones.dto';

export class QuerySegmentacionesWithPaginationDto extends IntersectionType(
  PaginationDto,
  QuerySegmentacionesDto,
) {}