import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export enum ClienteFilterColumn {
  NUMERO_IDENTIFICACION = 'numeroIdentificacion',
  NOMBRE = 'nombre',
  TIPO_CLIENTE = 'tipoCliente',
  SUBSEGMENTACION = 'subsegmentacion',
}

export class FilterClienteDto extends PaginationDto {

  @IsEnum(ClienteFilterColumn)
  column: ClienteFilterColumn;

  @IsString()
  query: string;

}