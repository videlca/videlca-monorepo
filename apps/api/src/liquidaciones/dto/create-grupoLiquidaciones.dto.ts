import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGrupoLiquidacionDto {


  @IsOptional()
  @IsBoolean()
  estado?: boolean = true;

  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  total?: number = 0;

  @IsOptional()
  @IsBoolean()
  consolidacion_orden?: boolean;

  @IsOptional()
  @IsBoolean()
  generacion_interfase?: boolean;

  @IsOptional()
  @IsBoolean()
  generacion_anexo?: boolean;
}