import { apiGet } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types/common";
import type { TipoDuracion } from "../../types/servicio";

export const getTipoDuracion = async (pagination: PaginationDto): Promise<ApiResponse<TipoDuracion[]>> => {
  return await apiGet<TipoDuracion[]>("/tipo-duracion", pagination);
};