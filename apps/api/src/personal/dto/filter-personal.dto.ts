import { IsEnum, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto';

export enum PersonalFilterColumn {
  NUMERO_IDENTIFICACION = 'numeroIdentificacion',
  NOMBRE = 'nombre',
  TIPO_PERSONAL = 'tipoPersonal',
  TIPO_CONTRATO = 'tipoContrato',
}

export class FilterPersonalDto extends PaginationDto {

  @IsEnum(PersonalFilterColumn)
  column: PersonalFilterColumn;

  @IsString()
  query: string;

}
