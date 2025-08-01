import type { TipoPersonal } from "../../../types";
import { apiGet, apiPatch, apiPost } from "../../config";
import type { UpdateTipoPersonalDto } from "../../dtos";
import type { PaginationDto } from "../../dtos/common";
import type { CreateTipoPersonal } from "../../types";
import type { ApiResponse } from "../../types/common";


export const getTipoPersonal = async (): Promise<ApiResponse<TipoPersonal[]>> => {
  return await apiGet<TipoPersonal[]>("/tipo-personal", { pagination: false })
};

export const getTipoPersonalActivo = async (): Promise<ApiResponse<TipoPersonal[]>> => {
  return await apiGet<TipoPersonal[]>("/tipo-personal/actives", { pagination: false })
}

export const createTipoPersonal = async (data: CreateTipoPersonal): Promise<ApiResponse> => {
  return await apiPost<TipoPersonal>("/tipo-personal/", data)
}

export const updateTipoPersonal = async (id: number, data: UpdateTipoPersonalDto): Promise<ApiResponse> => {
  return await apiPatch<TipoPersonal>(`/tipo-personal/${id}`, data)
}