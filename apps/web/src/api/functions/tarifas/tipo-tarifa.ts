import { apiGet, apiPatch } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { UpdateTipoTarifaDto } from "../../dtos/tarifas";
import type { TipoTarifa } from "../../types";
import type { ApiResponse } from "../../types/common";

export const getTipoTarifa = async (pagination: PaginationDto): Promise<ApiResponse<TipoTarifa[]>> => {
  return await apiGet<TipoTarifa[]>("/tipo-tarifa", pagination);
};

export const updateTipoTarifa = async (id: number, data: UpdateTipoTarifaDto): Promise<ApiResponse> => {
  return await apiPatch<TipoTarifa>(`/tipo-tarifa/${id}`, data);
};