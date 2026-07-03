import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class LocacionSearchDto {
    
  @IsString()
  @IsIn(['nombre', 'direccion', 'cliente'], { message: 'La columna de búsqueda no es válida' })
  column: string;

  @IsString({ message: 'El valor de búsqueda debe ser un string' })
  @IsNotEmpty()
  text: string;
}
