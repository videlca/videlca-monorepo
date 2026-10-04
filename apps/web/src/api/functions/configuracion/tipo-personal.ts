import type { TipoPersonal } from "../../../types";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { UpdateTipoPersonalDto } from "../../dtos";
import type { PaginationDto } from "../../dtos/common";
import type { CreateTipoPersonal } from "../../types";
import type { ApiResponse , PaginatedResponse } from "../../types/common";


export const getTipoPersonal = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoPersonal[]>>> => {
  return await apiGet<PaginatedResponse<TipoPersonal[]>>("/tipo-personal", pagination )
};

export const getTipoPersonalActivo = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoPersonal[]>>> => {
  return await apiGet<PaginatedResponse<TipoPersonal[]>>("/tipo-personal/actives", pagination)
}

export const createTipoPersonal = async (data: CreateTipoPersonal): Promise<ApiResponse> => {
  return await apiPost<TipoPersonal>("/tipo-personal/", data)
}

export const updateTipoPersonal = async (id: number, data: UpdateTipoPersonalDto): Promise<ApiResponse> => {
  return await apiPatch<TipoPersonal>(`/tipo-personal/${id}`, data)
}

export const deleteTipoPersonal = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<TipoPersonal>(`/tipo-personal/${id}`)
}