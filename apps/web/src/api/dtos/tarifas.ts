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
  precioSinIva: number;
  iva: number;
  precioTotal: number;
}

export interface UpdateTarifaDto extends Partial<CreateTarifaDto> {
  estado?: boolean;
}