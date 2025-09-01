import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { CreateTipoServicioDto, UpdateTipoServicioDto } from "../../dtos";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types/common";
import type { TipoServicio } from "../../types/servicio";

export const getTipoServicios = async (pagination: PaginationDto): Promise<ApiResponse<TipoServicio[]>> => {
  return await apiGet<TipoServicio[]>("/tipo-servicio", pagination);
};

export const getTipoServicioById = async (id: number): Promise<ApiResponse<TipoServicio>> => {
  return await apiGet<TipoServicio>(`/tipo-servicio/${id}`);
}

export const getTipoServiciosActivo = async (pagination: PaginationDto): Promise<ApiResponse<TipoServicio[]>> => {
  return await apiGet<TipoServicio[]>("/tipo-servicio/actives", pagination);
}

export const getPrefijosTipoServicio = async (pagination: PaginationDto): Promise<ApiResponse<{idTipoServicio: number, prefijo: string}[]>> => {
  return await apiGet<{idTipoServicio: number, prefijo: string}[]>("/tipo-servicio/prefixes", pagination);
}

export const createTipoServicio = async (data: CreateTipoServicioDto): Promise<ApiResponse> => {
  return await apiPost<TipoServicio>("/tipo-servicio", data);
}

export const updateTipoServicio = async (id: number, data: UpdateTipoServicioDto): Promise<ApiResponse> => {
  return await apiPatch<TipoServicio>(`/tipo-servicio/${id}`, data);
}

export const deleteTipoServicio = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<TipoServicio>(`/tipo-servicio/${id}`);
}