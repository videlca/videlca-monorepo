import { apiGet, apiPatch } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { UpdateTipoTarifaDto } from "../../dtos/tarifas";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import type { TipoTarifa } from "../../types/periodo";

export const getTipoTarifa = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoTarifa[]>>> => {
  return await apiGet<PaginatedResponse<TipoTarifa[]>>("/tipo-tarifa", pagination);
};

export const updateTipoTarifa = async (id: number, data: UpdateTipoTarifaDto): Promise<ApiResponse> => {
  return await apiPatch<TipoTarifa>(`/tipo-tarifa/${id}`, data);
};