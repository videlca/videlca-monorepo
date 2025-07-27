import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { CreateTarifaDto, UpdateTarifaDto } from "../../dtos/tarifas";
import type { ApiResponse } from "../../types";
import type { Tarifa } from "../../types/periodo";

export const createTarifa = async (data: CreateTarifaDto): Promise<ApiResponse> => {
  return await apiPost<Tarifa>("/tarifas", data);
};

export const getTarifasByPeriodo = async (idPeriodo: number, pagination: PaginationDto): Promise<ApiResponse<Tarifa[]>> => {
  return await apiGet<Tarifa[]>(`/tarifas/periodo/${idPeriodo}`, pagination);
};

export const getTarifasActivo = async (idPeriodo: number, pagination: PaginationDto): Promise<ApiResponse<Tarifa[]>> => {
  return await apiGet<Tarifa[]>(`/tarifas/actives/${idPeriodo}`, pagination);
};

export const getTarifaById = async (id: number): Promise<ApiResponse<Tarifa>> => {
  return await apiGet<Tarifa>(`/tarifas/${id}`);
};

export const updateTarifa = async (id: number, data: UpdateTarifaDto): Promise<ApiResponse> => {
  return await apiPatch<Tarifa>(`/tarifas/${id}`, data);
};

export const deleteTarifa = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<Tarifa>(`/tarifas/${id}`);
};