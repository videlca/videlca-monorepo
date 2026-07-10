
import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { CreatePeriodoDto, UpdatePeriodoDto } from "../../dtos";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { Periodo, ComparativaPeriodosResponse } from "../../types/periodo";

export const getPeriodos = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Periodo[]>>> => {
  return await apiGet<PaginatedResponse<Periodo[]>>("/periodos", pagination);
};

export const getPeriodosActivo = async (): Promise<ApiResponse<PaginatedResponse<Periodo[]>>> => {
  return await apiGet<PaginatedResponse<Periodo[]>>("/periodos/activo");
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

export const getComparativaPeriodos = async (
  periodoA: number,
  periodoB: number,
): Promise<ApiResponse<ComparativaPeriodosResponse>> => {
  return await apiGet<ComparativaPeriodosResponse>("/periodos/comparativa", {
    periodoA,
    periodoB,
  });
};
