import type { PaginationDto } from "./common";

export interface CreateAdicionalDto {
  idTipoAdicional: number;
  idCliente: number;
  idCiudad: number;
  mesInicio: string;
  mesFin?: string | null;
  costosDirectos?: number;
  seguroVida?: number;
  aui?: number;
  // Se calculan automaticamente si no se envian (ver AdicionalesService.calcularTotales en el backend).
  // El frontend siempre los calcula y los envia, pero el usuario puede editarlos antes de guardar
  costosDirectosSeguroVida?: number;
  precioAntesIva?: number;
  iva?: number;
  precioTotal?: number;
}

export interface UpdateAdicionalDto {
  idTipoAdicional?: number;
  idCiudad?: number;
  mesInicio?: string;
  mesFin?: string | null;
  costosDirectos?: number;
  seguroVida?: number;
  aui?: number;
  costosDirectosSeguroVida?: number;
  precioAntesIva?: number;
  iva?: number;
  precioTotal?: number;
  estado?: boolean;
}

export interface FindAdicionalesDto extends PaginationDto {
  idCliente?: number;
}
