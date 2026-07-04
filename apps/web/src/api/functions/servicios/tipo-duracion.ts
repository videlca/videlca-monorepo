import { apiGet } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { TipoDuracion } from "../../types/servicio";

export const getTipoDuracion = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoDuracion[]>>> => {
  return await apiGet<PaginatedResponse<TipoDuracion[]>>("/tipo-duracion", pagination);
};