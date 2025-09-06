import { apiGet } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse, PersonalAsignado } from "../../types";

export const getProgramacionPersonal = async (pagination: PaginationDto): Promise<ApiResponse<PersonalAsignado[]>> => {
  return await apiGet<PersonalAsignado[]>("/programacion-personal", pagination);
};