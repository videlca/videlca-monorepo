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
  // El backend ya no acepta este campo al crear una tarifa (se removio del DTO en el refactor de
  // tarifas/servicios; el ValidationPipe global usa forbidNonWhitelisted, asi que enviarlo rompe la
  // petición). Se deja opcional solo por compatibilidad con UpdateTarifaDto (que lo extiende y todavia
  // lo usa en la pantalla ver-tarifas) — no incluir este campo al armar una tarifa nueva.
  idTipoTarifa?: number;
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
  precio: number;
}

export interface SaveTarifaHoraDto {
  idPeriodo: number;
  tarifas: CreateTarifaHoraDto[];
}

// calcular precios de servicios a partir de la tarifa hora de un periodo
export interface CalcularPrecioServicioDto {
  idServicio: number;
  // Obligatorio cuando el tipo de servicio es "Monitoreo de alarmas" o el tipo de tarifa del
  // servicio es "por servicio" (Recogida de dinero), ya que en esos casos el precio no se puede
  // derivar de la tarifa por hora del periodo
  costosDirectos?: number;
}

export interface CalcularPreciosDto {
  idPeriodo: number;
  servicios: CalcularPrecioServicioDto[];
}

