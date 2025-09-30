export interface CreatePeriodoDto {
  fechaInicio: string;
  fechaFin: string;
  periodoActivoFacturacion: boolean;
}

export interface UpdatePeriodoDto {
  fechaInicio: string;
  fechaFin: string;
  periodoActivoFacturacion: boolean;
}

// tipo tarifa
export interface UpdateTipoTarifaDto {
  cantidadTiempo: number;
}

export interface SaveTarifaDto {
  idPeriodo: number;
  tarifas: CreateTarifaDto[];
}

export interface CreateTarifaDto {
  idPeriodo: number;
  idServicio: number;
  idTipoTarifa: number;
  costosDirectos: number | string;
  seguroVida: number | string;
  costosDirectosSeguroVida: number | string;
  aui: number | string;
  precioAntesIva: number | string;
  iva: number | string;
  precioTotal: number | string;
}

export interface UpdateTarifaDto extends Partial<CreateTarifaDto> {
  estado?: boolean;
}

