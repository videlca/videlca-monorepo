import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { AnularIdOrdenServicioDto, PaginationDto, UpdateOrdenServicioIdDto } from "../../dtos";
import type { ApiResponse } from "../../types";
import type { OrdenServicioId } from "../../types/orden-servicio";

export const getIdsOrdenServicio = async (pagination: PaginationDto): Promise<ApiResponse<OrdenServicioId[]>> => {
  return await apiGet<OrdenServicioId[]>("/orden-servicio-id", pagination);
}

export const updateIdOrdenServicio = async (id: number, data: UpdateOrdenServicioIdDto): Promise<ApiResponse<any>> => {
  return await apiPatch<any>(`/orden-servicio-id/${id}`, data);
}

// Anular orden servicio id
export const anularOrdenServicioId = async (data: AnularIdOrdenServicioDto): Promise<ApiResponse<OrdenServicioId>> => {
  return await apiPost<OrdenServicioId>("/orden-servicio-id/anular-id", data);
}

export const deleteIdOrdenServicio = async (id: number): Promise<ApiResponse<any>> => {
  return await apiDelete<any>(`/orden-servicio-id/${id}`);
}
