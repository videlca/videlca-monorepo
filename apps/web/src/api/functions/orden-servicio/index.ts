import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { CreateObservacionOrdenServicioDto, CreateOrdenServicioDto, PaginationDto, PrecioOrdenDto, TercerPasoDto, UpdateObservacionOrdenServicioDto } from "../../dtos"
import type { ApiResponse } from "../../types";
import type { OrdenServicio } from "../../types/orden-servicio";

export const createOrdenServicio = async (data: CreateOrdenServicioDto): Promise<ApiResponse<OrdenServicio>> => {
  return await apiPost<OrdenServicio>("/orden-servicio", data);
}

export const getOrdenesServicio = async (pagination: PaginationDto): Promise<ApiResponse<OrdenServicio[]>> => {
  return await apiGet<OrdenServicio[]>("/orden-servicio", pagination);
}

// TODO: revisar respuesta
export const validateHorariosOrdenServicio = async (data: TercerPasoDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/orden-servicio/validacion-horarios", data);
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