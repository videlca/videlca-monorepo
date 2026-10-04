import { IsEnum, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export enum TipoServicioFilterColumn {
  NOMBRE = 'nombre',
  DESCRIPCION = 'descripcion',
  PREFIJO = 'prefijo',
}

export class FilterTipoServicioDto extends PaginationDto {
  @IsEnum(TipoServicioFilterColumn)
  column: TipoServicioFilterColumn;

  @IsString()
  query: string;
}
