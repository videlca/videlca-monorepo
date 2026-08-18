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

// tarifa hora
export interface CreateTarifaHoraDto {
  idPeriodo: number;
  idTarifaHoraDescripcion: number;
  costosDirectos: number;
  seguroVida?: number;
  aui: number;
}

export interface SaveTarifaHoraDto {
  idPeriodo: number;
  tarifas: CreateTarifaHoraDto[];
}

// calcular precios de servicios a partir de la tarifa hora de un periodo
export interface CalcularPreciosDto {
  idPeriodo: number;
  idsServicios: number[];
}

