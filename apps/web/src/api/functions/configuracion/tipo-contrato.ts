import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { ActualizarTipoContrato, CreateTipoContrato, PaginationDto } from "../../dtos";
import type { TipoContrato } from "../../types";
import type { ApiResponse, PaginatedResponse } from "../../types/common";

export const getTipoContrato = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoContrato[]>>> => {
  return await apiGet<PaginatedResponse<TipoContrato[]>>("/tipo-contrato", pagination);
};

export const getTipoContratoActivo = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoContrato[]>>> => {
  return await apiGet<PaginatedResponse<TipoContrato[]>>("/tipo-contrato/actives", pagination);
};

export const createTipoContrato = async (data: CreateTipoContrato): Promise<ApiResponse<TipoContrato>> => {
  return await apiPost<TipoContrato>("/tipo-contrato", data);
};

export const updateTipoContrato = async (id: number, data: ActualizarTipoContrato): Promise<ApiResponse<TipoContrato>> => {
  return await apiPatch<TipoContrato>(`/tipo-contrato/${id}`, data);
};

export const deleteTipoContrato = async (id: number): Promise<ApiResponse<TipoContrato>> => {
  return await apiDelete<TipoContrato>(`/tipo-contrato/${id}`);
};
