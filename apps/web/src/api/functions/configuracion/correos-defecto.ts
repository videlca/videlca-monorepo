import { apiGet, apiPost } from "../../config";
import type { CorreoDefaultDto, CreateCorreoDefaultDto, PaginationDto } from "../../dtos";
import type { ApiResponse , PaginatedResponse } from "../../types/common";

export const getCorreosDefault = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<CreateCorreoDefaultDto[]>>> => {
  const route = pagination.pagination ? `/correo-default?pagination=true` : "/correo-default?pagination=false";
  return await apiGet<PaginatedResponse<CreateCorreoDefaultDto[]>>(route);
};

export const createCorreoDefault = async (correos: CorreoDefaultDto): Promise<ApiResponse<CreateCorreoDefaultDto>> => {
  return await apiPost<CreateCorreoDefaultDto>("/correo-default", correos);
};

export const getCorreoDefaultById = async (id: number): Promise<ApiResponse<CreateCorreoDefaultDto>> => {
  return await apiGet<CreateCorreoDefaultDto>(`/correo-default/${id}`);
};