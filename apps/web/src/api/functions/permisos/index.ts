import type { Rol } from "../../../types";
import { axiosClient } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types/common";

export const getActiveRoles = async (pagination: PaginationDto): Promise<ApiResponse<Rol[]>> => {
  const response = await axiosClient.get('/permissions/roles/activos', { params: pagination }).then((res) => {
    return {
      status: res.status,
      data: res.data
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
}