import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class LocacionSearchDto {
    
  @IsString()
  @IsIn(['nombre', 'direccion', 'cliente'])
  column: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
