import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGrupoLiquidacionDto {
  @IsString()
  @MaxLength(255)
  descripcion: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean = true;

  @IsOptional()
  @IsNumber()
  total?: number = 0;
}