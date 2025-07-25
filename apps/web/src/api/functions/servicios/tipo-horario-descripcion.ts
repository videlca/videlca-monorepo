import { apiGet } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types/common";
import type { TipoHorarioDescripcion } from "../../types/servicio";

export const getTipoHorarioDescripcion = async (pagination: PaginationDto): Promise<ApiResponse<TipoHorarioDescripcion[]>> => {
  return await apiGet<TipoHorarioDescripcion[]>("/tipo-horario-descripcion", pagination);
};