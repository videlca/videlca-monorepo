// ORDEN SERVICIO
export { CreateOrdenServicioDto } from "./orden-servicio/create-orden-servicio.dto";
export { UpdateOrdenServicioDto } from "./orden-servicio/update-orden-servicio.dto";
export { CreatePersonalServicioDto } from "./orden-servicio/create-orden-servicio.dto";
export { AnularIdOrdenServicioDto } from "./orden-servicio/anular-id-orden-servicio.dto";

// VALIDACIONES POR CADA PASO DE LA CREACION
export { ValidarIdOrdenServicioDto } from "./steps/validar-orden-servicio-id.dto";
export { ValidarFechasOrdenServicioDto } from "./steps/validar-fecha-orden-servicio.dto";
export { ValidarHorarioServicioDto } from "./steps/validar-horario-servicio.dto";
export { PrecioOrdenDto } from "./steps/precio-orden.dto";
export { ValidarEmpleadosDisponiblesDto } from "./steps/validar-empleados-disponible.dto";
export { ValidarRangoHorarioPersonalOrdenDto } from "./steps/validar-rango-horario-empleado-orden.dto";

// VALIDACIONES POR CADA PASO DE LA ACTUALIZACION
export { UpdateValidarFechaOrdenServicioDto } from "./steps/update-validar-fecha-orden-servicio.dto";

// OBSERVACIONES ORDEN
export { CreateObservacionOrdenServicioDto } from "./observacion-orden-servicio/create-observacion-orden-servicio.dto";
export { UpdateObservacionOrdenServicioDto } from "./observacion-orden-servicio/update-observacion-orden-servicio.dto";

// ORDEN SERVICIO ID
export { UpdateOrdenServicioIdDto } from "./orden-servicio/update-id-orden-servicio.dto";

// INICIO
export { GetReporteInicioDto } from "./inicio/inicio.dto";