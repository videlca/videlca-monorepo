import { apiGet } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { PersonalAsignado } from "../../types";
import type { ApiResponse, PaginatedResponse } from "../../types/common";

export const getProgramacionPersonal = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<PersonalAsignado[]>>> => {
  return await apiGet<PaginatedResponse<PersonalAsignado[]>>("/programacion-personal", pagination);
};