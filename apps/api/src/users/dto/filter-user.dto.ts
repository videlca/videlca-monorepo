import { IsEnum, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto';

export enum UserFilterColumn {
  NUMERO_IDENTIFICACION = 'numeroIdentificacion',
  NOMBRE = 'nombre',
  EMAIL = 'email',
  ROL = 'rol',
}

export class FilterUserDto extends PaginationDto {

  @IsEnum(UserFilterColumn)
  column: UserFilterColumn;

  @IsString()
  query: string;

}
