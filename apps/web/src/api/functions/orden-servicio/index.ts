import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { CreateObservacionOrdenServicioDto, CreateOrdenServicioDto, PaginationDto, PrecioOrdenDto, UpdateObservacionOrdenServicioDto, ValidarEmpleadosDisponiblesDto, ValidarFechasOrdenServicioDto, ValidarHorarioServicioDto, ValidarIdOrdenServicioDto, ValidarRangoHorarioPersonalOrdenDto } from "../../dtos"
import type { ApiResponse, Personal } from "../../types";
import type { OrdenServicio, OrdenServicioId } from "../../types/orden-servicio";

export const createOrdenServicio = async (data: CreateOrdenServicioDto): Promise<ApiResponse<OrdenServicio>> => {
  return await apiPost<OrdenServicio>("/orden-servicio", data);
}

export const getOrdenesServicio = async (pagination: PaginationDto): Promise<ApiResponse<OrdenServicio[]>> => {
  return await apiGet<OrdenServicio[]>("/orden-servicio", pagination);
}

// TODO: revisar respuesta
export const validateFechasOrdenServicio = async (data: ValidarFechasOrdenServicioDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/orden-servicio/validacion-fechas", data);
}

export const getOrdenServicioById = async (id: number): Promise<ApiResponse<OrdenServicio>> => {
  return await apiGet<OrdenServicio>(`/orden-servicio/${id}`);
}

export const getPrecioOrdenServicio = async (data: PrecioOrdenDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/orden-servicio/obtener-precio", data);
}

// Observaciones orden servicio
export const createObservacionOrdenServicio = async (data: CreateObservacionOrdenServicioDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/observaciones-orden-servicio", data);
}

export const getComentariosOrdenServicio = async (id: number): Promise<ApiResponse<any>> => {
  return await apiGet<any>(`/observaciones-orden-servicio/obtener-comentarios/${id}`);
}

export const getObservacionOrdenServicioById = async (id: number): Promise<ApiResponse<any>> => {
  return await apiGet<any>(`/observaciones-orden-servicio/${id}`);
}

export const updateObservacionOrdenServicio = async (id: number, data: UpdateObservacionOrdenServicioDto): Promise<ApiResponse<any>> => {
  return await apiPatch<any>(`/observaciones-orden-servicio/${id}`, data);
}

export const deleteObservacionOrdenServicio = async (id: number): Promise<ApiResponse<any>> => {
  return await apiDelete<any>(`/observaciones-orden-servicio/${id}`);
}

// Identificadores orden servicio
export const validarIdOrdenServicio = async (data: ValidarIdOrdenServicioDto): Promise<ApiResponse<OrdenServicioId>> => {
  return await apiPost<OrdenServicioId>("/orden-servicio/validacion-id", data);
}
// Validar empleados disponibles
export const validarEmpleadosDisponibles = async (data: ValidarEmpleadosDisponiblesDto): Promise<ApiResponse> => {
  return await apiPost<Personal[]>("/orden-servicio/empleados-disponibles", data);
};

// Validacion horarios servicio orden de servicio
export const validarHorarioServicioOrdenServicio = async (data: ValidarHorarioServicioDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/orden-servicio/validacion-horarios", data);
}

export const validarRangoHorarioPersonalOrdenServicio = async (data: ValidarRangoHorarioPersonalOrdenDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/orden-servicio/validar-rango-horarios-orden", data);
}