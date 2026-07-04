import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { AnularIdOrdenServicioDto, PaginationDto, UpdateOrdenServicioIdDto } from "../../dtos";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { OrdenServicioId, OrdenServicioIdAnulados } from "../../types/orden-servicio";

export const getIdsOrdenServicio = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<OrdenServicioId[]>>> => {
  return await apiGet<PaginatedResponse<OrdenServicioId[]>>("/orden-servicio-id", pagination);
}

export const getIdsAnuladosOrdenServicio = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<OrdenServicioIdAnulados[]>>> => {
  return await apiGet<PaginatedResponse<OrdenServicioIdAnulados[]>>("/orden-servicio-id/anulados", pagination);
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

export const getNextIdOrdenServicio = async (): Promise<ApiResponse<number>> => {
  return await apiGet<number>("/orden-servicio-id/next-id");
}
