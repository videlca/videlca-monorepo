import { IsEnum, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export enum LocacionFilterColumn {
  NOMBRE = 'nombre',
  DIRECCION = 'direccion',
  CLIENTE = 'cliente',
  CIUDAD = 'ciudad',
}

export class FilterLocacionDto extends PaginationDto {

  @IsEnum(LocacionFilterColumn)
  column: LocacionFilterColumn;

  @IsString()
  query: string;

}
