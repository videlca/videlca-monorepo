// CLIENTE
export { CreateClienteDto } from "./cliente/create-cliente.dto";
export { UpdateClienteDto } from "./cliente/update-cliente.dto";
export { FilterClienteDto, ClienteFilterColumn } from './cliente/filter-cliente.dto';

// SEGMENTACION
export { CreateSegmentacionDto } from "./segmentacion/create-segmentacion.dto";
export { UpdateSegmentacionDto } from "./segmentacion/update-segmentacion.dto";

// LOCACION
export { CreateLocacionDto } from "./locacion/create-locacion.dto";
export { UpdateLocacionDto } from "./locacion/update-locacion.dto";
export { CreateCorreoDto } from "./locacion/create-locacion.dto";
export { LocacionSearchDto } from "./locacion/search-location.dto";
export { FilterLocacionDto, LocacionFilterColumn } from './locacion/filter-locacion.dto';

// QUERY SEGMENTACIONES
export { QuerySegmentacionesWithPaginationDto } from "./query-segmentacion/query-segmentaciones-with-pagination.dto";
export { QuerySegmentacionesDto } from "./query-segmentacion/query-segmentaciones.dto";
export { QuerySubSegmentacionesDto } from "./query-segmentacion/query-sub-segmentaciones.dto";
export { QuerySubSegmentacionesWithPaginationDto } from "./query-segmentacion/query-sub-segmentaciones-with-pagination.dto";