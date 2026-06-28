import { IsEnum, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export enum OrdenServicioFilterColumn {
  NUMERO_ORDEN = 'numeroOrden',
  LOCACION = 'locacion',
  CLIENTE = 'cliente',
  ESTADO = 'estado',
}

export class FilterOrdenServicioDto extends PaginationDto {

  @IsEnum(OrdenServicioFilterColumn)
  column: OrdenServicioFilterColumn;

  @IsString()
  query: string;

}
