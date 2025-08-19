// ORDEN SERVICIO
export { CreateOrdenServicioDto } from "./orden-servicio/create-orden-servicio.dto";
export { CreatePersonalServicioDto } from "./orden-servicio/create-orden-servicio.dto";
export { AnularIdOrdenServicioDto } from "./orden-servicio/anular-id-orden-servicio.dto";

// VALIDACIONES POR CADA PASO DE LA CREACION
export { ValidarIdOrdenServicioDto } from "./steps/validar-orden-servicio-id.dto";
export { ValidarHorarioServicioDto } from "./steps/validar-horario-servicio.dto";
export { PrecioOrdenDto } from "./steps/precio-orden.dto";
export { ValidarEmpleadosDisponiblesDto } from "./steps/validar-empleados-disponible.dto";
export { ValidarRangoHorarioPersonalOrdenDto } from "./steps/validar-rango-horario-empleado-orden.dto";

// OBSERVACIONES ORDEN
export { CreateObservacionOrdenServicioDto } from "./observacion-orden-servicio/create-observacion-orden-servicio.dto";
export { UpdateObservacionOrdenServicioDto } from "./observacion-orden-servicio/update-observacion-orden-servicio.dto";