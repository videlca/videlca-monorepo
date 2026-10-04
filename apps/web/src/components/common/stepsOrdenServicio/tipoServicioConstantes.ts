// Nombre exacto (Servicio.idTipoServicio.nombre) del tipo de servicio "Monitoreo de Alarmas": el unico tipo
// que en los pasos de configurar horarios y de vista previa se agrupa en una sola tarjeta para todas sus
// unidades en vez de mostrar/pedir un horario por unidad (ver ConfigurarHorariosServicios y
// PreviewInformacionOrden)
export const TIPO_SERVICIO_MONITOREO_ALARMAS = "Monitoreo de alarmas";

// Nombre exacto del tipo de servicio "Vigilancia y escolta": a diferencia de "Monitoreo de alarmas" (que
// siempre se asigna directo a un cliente), este tipo acepta asignarse a un puesto (idLocacion) O directo a un
// cliente (idCliente) - el usuario elige en el paso de SeleccionarPuestoCliente (ver backend commit
// 8cd811e "orden de vigilancia y escolta acepta cliente directo ademas de locacion")
export const TIPO_SERVICIO_VIGILANCIA_Y_ESCOLTA = "Vigilancia y escolta";
