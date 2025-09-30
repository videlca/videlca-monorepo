
import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { CreatePeriodoDto, UpdatePeriodoDto } from "../../dtos";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types";
import type { Periodo } from "../../types/periodo";

export const getPeriodos = async (pagination: PaginationDto): Promise<ApiResponse<Periodo[]>> => {
  return await apiGet<Periodo[]>("/periodos", pagination);
};

export const getPeriodosActivo = async (): Promise<ApiResponse<Periodo[]>> => {
  return await apiGet<Periodo[]>("/periodos/activo");
};

export const getPeriodoById = async (id: number): Promise<ApiResponse<Periodo>> => {
  return await apiGet<Periodo>(`/periodos/${id}`);
};

export const createPeriodo = async (data: CreatePeriodoDto): Promise<ApiResponse> => {
  return await apiPost<Periodo>("/periodos", data);
};

export const updatePeriodo = async (id: number, data: UpdatePeriodoDto): Promise<ApiResponse> => {
  return await apiPatch<Periodo>(`/periodos/${id}`, data);
};

export const deletePeriodo = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<Periodo>(`/periodos/${id}`);
};
