import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { ApiResponse } from "../../types";
import type { CreateObservacionOrdenServicioDto, UpdateObservacionOrdenServicioDto } from "../../dtos";
import type { ObservacionOrdenServicio } from "../../types/orden-servicio";

export const createObservacionOrdenServicio = async (data: CreateObservacionOrdenServicioDto): Promise<ApiResponse<ObservacionOrdenServicio>> => {
  return await apiPost<ObservacionOrdenServicio>("/observaciones-orden-servicio", data);
}

export const getObservacionesOrdenServicio = async (idOrdenServicio: number): Promise<ApiResponse<ObservacionOrdenServicio[]>> => {
  return await apiGet<ObservacionOrdenServicio[]>(`/observaciones-orden-servicio/obtener-comentarios/${idOrdenServicio}?pagination`);
}

export const updateObservacionOrdenServicio = async (id: number, data: UpdateObservacionOrdenServicioDto): Promise<ApiResponse<ObservacionOrdenServicio>> => {
  return await apiPatch<ObservacionOrdenServicio>(`/observaciones-orden-servicio/${id}`, data);
}

export const deleteObservacionOrdenServicio = async (id: number): Promise<ApiResponse<any>> => {
  return await apiDelete<any>(`/observaciones-orden-servicio/${id}`);
}
