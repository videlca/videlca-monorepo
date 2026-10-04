import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { CreateTipoHorarioDto, UpdateTipoHorarioDto } from "../../dtos";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { TipoHorario } from "../../types/servicio";

export const getTipoHorarios = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoHorario[]>>> => {
  return await apiGet<PaginatedResponse<TipoHorario[]>>("/tipo-horario", pagination);
};

export const getTipoHorarioById = async (id: number): Promise<ApiResponse<TipoHorario>> => {
  return await apiGet<TipoHorario>(`/tipo-horario/${id}`);
}

export const createTipoHorario = async (data: CreateTipoHorarioDto): Promise<ApiResponse> => {
  return await apiPost<TipoHorario>("/tipo-horario", data);
}

export const updateTipoHorario = async (id: number, data: UpdateTipoHorarioDto): Promise<ApiResponse> => {
  return await apiPatch<TipoHorario>(`/tipo-horario/${id}`, data);
}

export const deleteTipoHorario = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<TipoHorario>(`/tipo-horario/${id}`);
}