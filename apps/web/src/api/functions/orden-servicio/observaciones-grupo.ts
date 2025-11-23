import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { ApiResponse } from "../../types";
import type { CreateObservacionGrupoOrdenServicioDto, UpdateObservacionGrupoOrdenServicioDto } from "../../dtos";
import type { ObservacionGrupoOrdenServicio } from "../../types/orden-servicio";

export const createObservacionGrupoOrdenServicio = async (data: CreateObservacionGrupoOrdenServicioDto): Promise<ApiResponse<ObservacionGrupoOrdenServicio>> => {
  return await apiPost<ObservacionGrupoOrdenServicio>("/observaciones-grupo-orden-servicio", data);
}

export const getObservacionesGrupoOrdenServicio = async (idGrupoOrdenServicio: number): Promise<ApiResponse<ObservacionGrupoOrdenServicio[]>> => {
  return await apiGet<ObservacionGrupoOrdenServicio[]>(`/observaciones-grupo-orden-servicio/obtener-comentarios/${idGrupoOrdenServicio}?pagination`);
}

export const updateObservacionGrupoOrdenServicio = async (idGrupoOrdenServicio: number, data: UpdateObservacionGrupoOrdenServicioDto): Promise<ApiResponse<ObservacionGrupoOrdenServicio>> => {
  return await apiPatch<ObservacionGrupoOrdenServicio>(`/observaciones-grupo-orden-servicio/${idGrupoOrdenServicio}`, data);
}

export const deleteObservacionGrupoOrdenServicio = async (idGrupoOrdenServicio: number): Promise<ApiResponse<any>> => {
  return await apiDelete<any>(`/observaciones-grupo-orden-servicio/${idGrupoOrdenServicio}`);
}
