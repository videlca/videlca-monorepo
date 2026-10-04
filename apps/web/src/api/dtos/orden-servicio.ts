// Origen de la orden de servicio (ver GET /origen-servicio). "catalogo": uno o mas servicios ya tarifados del
// catalogo del periodo. "a_medida": el cliente pide un horario especifico y el precio se calcula dia por dia
// (solo aplica para tipo de servicio "Vigilancia y escolta"; "Monitoreo de alarmas" siempre es "catalogo")
export enum OrigenServicioEnum {
  CATALOGO = 'catalogo',
  A_MEDIDA = 'a_medida',
}

export interface CreateOrdenServicioDto {
  origenServicio: OrigenServicioEnum;
  numeroOrdenServicio: string;
  // Vigilancia y escolta envia idLocacion, Monitoreo de alarmas envia idCliente (nunca ambos)
  idLocacion?: number;
  idCliente?: number;
  fechaInicio: string;
  fechaFin: string | null;
  // Cobro parcial mensual: solo ordenes indefinidas de catalogo; se envian los dos o ninguno
  diaInicioCobro?: number;
  diaFinCobro?: number;
  // Solo se usa en el front para mostrar el total en el paso de vista previa (PreviewInformacionOrden):
  // el backend ya no lo recibe, por eso es opcional y no se incluye en el payload al crear la orden
  precioTotal?: number;
  fechaCreacion: string;
  servicios: CreateOrdenServicioDetalleDto[];
}

// Forma exacta que espera el backend en el arreglo "servicios" al actualizar la orden (solo aplica orden
// origen "catalogo"): el catalogo de servicios de la orden no cambia al editar, solo se reenvia el horario ya
// existente de cada uno para que el backend recalcule el precio con las nuevas fechas. idTarifa debe ser
// exactamente el mismo conjunto que ya tiene la orden, o el backend rechaza la actualizacion
export interface UpdateOrdenServicioDetalleDto {
  idTarifa: number;
  horaInicio: string;
  horaFin: string;
}

export interface UpdateOrdenServicioDto {
  fechaInicio: string;
  fechaFin: string | null;
  fechaActualizacion: string;
  // Obligatorio (para el backend) solo cuando fechaFin no es null y la orden es de origen "catalogo": el
  // horario ya existente de cada servicio, para recalcular el precio con las nuevas fechas
  servicios?: UpdateOrdenServicioDetalleDto[];
  // Obligatorio (para el backend) solo cuando fechaFin no es null y la orden es de origen "a_medida": unico
  // horario ya existente de toda la orden, para recalcular el precio dia por dia con las nuevas fechas
  horaInicio?: string;
  horaFin?: string;
}

// Dias de la semana en que se presta un servicio de catalogo (ver PatronDiasSemana en el backend). Solo aplica
// para ordenes de origen "catalogo" (en "a_medida" es un rango continuo de fechas/horas, no se seleccionan dias
// sueltos). Todos opcionales, quedan en true por defecto si no se envian (equivale a "todos los dias")
export interface PatronDiasSemanaDto {
  lunes?: boolean;
  martes?: boolean;
  miercoles?: boolean;
  jueves?: boolean;
  viernes?: boolean;
  sabado?: boolean;
  domingo?: boolean;
  // Ademas de los dias de semana marcados arriba, cuenta tambien cualquier dia festivo sin importar en que
  // dia de la semana caiga
  incluyeFestivos?: boolean;
}

// Forma exacta que espera el backend en el arreglo "servicios" al crear la orden. El desglose completo
// (horaInicio/horaFin, cantidadHoras, fecha y los campos de precio) se obtiene tal cual desde la respuesta de
// POST /orden-servicio/obtener-precio y se reenvia sin modificar, no se vuelve a calcular nada en el front
export interface CreateOrdenServicioDetalleDto extends PatronDiasSemanaDto {
  idTarifa: number;
  horaInicio: string;
  horaFin: string;
  // Solo trae valor en modo "a_medida" (cada fila es un dia del rango)
  cantidadHoras?: number | null;
  fecha?: string | null;
  costosDirectos?: number | null;
  seguroVida?: number | null;
  costosDirectosSeguroVida?: number | null;
  aui?: number | null;
  precioAntesIva?: number | null;
  iva?: number | null;
  precio?: number | null;
}

// idServicio es solo para uso interno del front (matchear contra selectedServices en los pasos de seleccion de
// servicio y vista previa), se elimina antes de enviar el arreglo al backend (ver handleSaveOrder en el index
// de ordenes de servicio)
export interface CreateOrdenServicioTarifaDto extends CreateOrdenServicioDetalleDto {
  idServicio?: number;
}

export interface UpdateOrdenServicioTarifaDto {
  idTarifa: number;
  cantidadPersonal: number;
  horaInicio: string;
  horaFin: string;
  precio: number;
  personal: UpdatePersonalServicioDto[];
  // Uso interno del front (ver CreateOrdenServicioTarifaDto): idServicio para matchear contra selectedServices,
  // fecha solo aplica a filas "a la medida". Nunca se envian al backend (servicios va comentado en el update)
  idServicio?: number;
  fecha?: string | null;
}

export interface CreatePersonalServicioDto {
  idPersonal: number;
  horaInicio: string;
  horaFin: string;
}

export interface UpdatePersonalServicioDto extends CreatePersonalServicioDto { }

// validaciones
export interface ValidarFechasOrdenServicioDto {
  fechaInicio: string;
  fechaFin: string | null;
}

export interface UpdateValidarFechaOrdenServicioDto {
  fechaActualizacion: string;
  fechaInicio: string;
  fechaFin: string | null;
}

// Solo aplica (y es obligatorio) cuando origenServicio es "catalogo". En "a_medida" no se llama a este
// endpoint: no hay servicio de catalogo contra el cual validar el horario elegido
export interface ValidarHorarioServicioDto extends PatronDiasSemanaDto {
  origenServicio: OrigenServicioEnum;
  idTarifa?: number;
  horaInicio: string;
  horaFin: string;
}

// CATALOGO: cada servicio ya tiene una tarifa (idTarifa) elegida del catalogo del periodo
export interface PrecioOrdenServicioItemDto extends PatronDiasSemanaDto {
  idTarifa: number;
  horaInicio: string;
  horaFin: string;
}

export interface PrecioOrdenDto {
  origenServicio: OrigenServicioEnum;
  fechaInicio: string;
  fechaFin: string | null;
  // CATALOGO: obligatorio, uno o mas servicios del catalogo a los que se les calcula el precio
  servicios?: PrecioOrdenServicioItemDto[];
  // A LA MEDIDA: obligatorio, un unico rango horario continuo (aplica el primer y el ultimo dia del rango,
  // los dias intermedios se calculan completos automaticamente) — no va arreglo "servicios"
  horaInicio?: string;
  horaFin?: string;
}

export interface CreateObservacionOrdenServicioDto {
  descripcion: string;
  idOrdenServicio: number;
}

export interface UpdateObservacionOrdenServicioDto {
  descripcion: string;
}

export interface ValidarIdOrdenServicioDto {
  descripcionId: string;
}

// orden servicio personal
export interface ValidarEmpleadosDisponiblesDto {
  fechaInicio: string;
  fechaFin: string | null;
  horaInicio: string;
  horaFin: string;
}

export interface ValidarRangoHorarioPersonalOrdenDto {
  horaInicio: string;
  horaFin: string;
  personal: CreatePersonalServicioDto[];
}

// orden de servicio id
export interface UpdateOrdenServicioIdDto {
  descripcionId: string;
  motivo?: string;
  consecutivo: number;
}

export interface AnularIdOrdenServicioDto {
  descripcionId: string;
  motivo?: string;
  consecutivo: number;
}

// observaciones orden servicio
export interface CreateObservacionOrdenServicioDto {
  descripcion: string;
  idOrdenServicio: number;
}

export interface UpdateObservacionOrdenServicioDto {
  descripcion: string;
}

// observaciones grupo orden servicio
export interface CreateObservacionGrupoOrdenServicioDto {
  descripcion: string;
  idGrupoOrdenServicio: number;
}

export interface UpdateObservacionGrupoOrdenServicioDto {
  descripcion: string;
}

// dashboard

export type MonthsAvailable = 0 | 3 | 6 | 12;

export interface GetDashboardInicioDto {
  months: MonthsAvailable;
}

export interface ReportesInicioResponse {
  rango: { from: string; to: string };

  totales: {
    totalOrdenes: number;
    ordenesTerminadas: number;
  };

  /** Ej: { "INICIADO": 5, "TERMINADO": 3, "PROGRAMADO": 2 } */
  distribucionEstados: Record<string, number>;

  /** Ej: { "enero": { "INICIADO": 3, "TERMINADO": 1 }, "febrero": { ... } } */
  ordenesPorMes: Record<string, Record<string, number>>;

  topServicios: { nombre: string; total: number }[];
  topClientes: { nombre: string; total: number }[];
}

// Filter
export enum OrdenServicioFilterColumn {
  NUMERO_ORDEN = 'numeroOrden',
  LOCACION = 'locacion',
  CLIENTE = 'cliente',
  ESTADO = 'estado',
}

export interface FilterOrdenServicioDto {
  column: OrdenServicioFilterColumn;
  query: string;
  limit?: number;
  offset?: number;
  pagination?: boolean;
}