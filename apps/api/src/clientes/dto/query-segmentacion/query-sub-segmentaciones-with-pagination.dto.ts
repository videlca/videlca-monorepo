import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationDto } from '../../../common/dto'
import { QuerySubSegmentacionesDto } from './query-sub-segmentaciones.dto';

export class QuerySubSegmentacionesWithPaginationDto extends IntersectionType(
  PaginationDto,
  QuerySubSegmentacionesDto,
) {}