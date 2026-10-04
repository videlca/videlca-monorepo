import { apiGet } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { TipoHorarioDescripcion } from "../../types/servicio";

export const getTipoHorarioDescripcion = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoHorarioDescripcion[]>>> => {
  return await apiGet<PaginatedResponse<TipoHorarioDescripcion[]>>("/tipo-horario-descripcion", pagination);
};

export const getTipoHorarioDescripcionDiurnoNocturno = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoHorarioDescripcion[]>>> => {
  return await apiGet<PaginatedResponse<TipoHorarioDescripcion[]>>("/tipo-horario-descripcion/horario-diurno-nocturno", pagination);
};