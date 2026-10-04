import { IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// ORDEN A LIQUIDAR CON SU PROPIO MES: permite meter en el grupo de un mes (ej: septiembre) meses anteriores que quedaron
// pendientes (ej: agosto) de esa misma orden u otras. Una misma orden puede venir varias veces con meses distintos
export class OrdenMesLiquidarDto {
  @Type(() => Number) @IsInt() @Min(1)
  idOrdenServicio: number;

  @Type(() => Number) @IsInt() @Min(2000)
  anio: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(12)
  mes: number; // 1-12
}

// IGUAL QUE OrdenMesLiquidarDto PERO PARA ADICIONALES
export class AdicionalMesLiquidarDto {
  @Type(() => Number) @IsInt() @Min(1)
  idAdicional: number;

  @Type(() => Number) @IsInt() @Min(2000)
  anio: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(12)
  mes: number; // 1-12
}

export class CrearGrupoMensualDto {
  // Mes/anio DEL GRUPO (el mes en que se esta liquidando, va en la descripcion del grupo). Cada item de
  // ordenes/adicionales trae su propio mes, que puede ser este o uno anterior pendiente
  @Type(() => Number) @IsInt() @Min(2000)
  anio: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(12)
  mes: number; // 1-12

  // Cliente al que pertenece este grupo de liquidacion (un grupo es siempre de un solo cliente)
  @Type(() => Number) @IsInt() @Min(1)
  idCliente: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  // Al menos uno de ordenes/adicionales debe traer datos (validado en el servicio, ya que aca ambos son opcionales
  // por separado para poder generar un grupo con solo ordenes, solo adicionales, o una mezcla de ambos)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdenMesLiquidarDto)
  ordenes?: OrdenMesLiquidarDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdicionalMesLiquidarDto)
  adicionales?: AdicionalMesLiquidarDto[];
}
