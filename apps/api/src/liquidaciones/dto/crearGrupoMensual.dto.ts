import { ArrayNotEmpty, IsArray, IsInt, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearGrupoMensualDto {
  @Type(() => Number) @IsInt() @Min(2000)
  anio: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(12)
  mes: number; // 1-12

  @IsString()
  descripcion: string;

  @IsArray() @ArrayNotEmpty()
  @Type(() => Number) @IsInt({ each: true })
  ordenIds: number[];
}