import { apiGet } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types";

export const getProgramacionPersonal = async (pagination: PaginationDto): Promise<ApiResponse<any[]>> => {
  return await apiGet<any[]>("/programacion-personal", pagination);
};