import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearGrupoMensualDto {
  @Type(() => Number) @IsInt() @Min(2000)
  anio: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(12)
  mes: number; // 1-12

  @IsOptional()
  @IsString()
  descripcion?: string;

  // Al menos uno de ordenIds/adicionalIds debe traer datos (validado en el servicio, ya que aca ambos son opcionales
  // por separado para poder generar un grupo con solo ordenes, solo adicionales, o una mezcla de ambos)
  @IsOptional()
  @IsArray()
  @Type(() => Number) @IsInt({ each: true })
  ordenIds?: number[];

  @IsOptional()
  @IsArray()
  @Type(() => Number) @IsInt({ each: true })
  adicionalIds?: number[];
}