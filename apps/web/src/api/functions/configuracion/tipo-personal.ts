import type { TipoPersonal } from "../../../types";
import { axiosClient } from "../../config";
import type { UpdateTipoPersonalDto } from "../../dtos";
import type { PaginationDto } from "../../dtos/common";
import type { CreateTipoPersonal } from "../../types";
import type { ApiResponse } from "../../types/common";


export const getTipoPersonal = async (pagination: PaginationDto): Promise<ApiResponse<TipoPersonal[]>> => {
  const response = await axiosClient.get("/tipo-personal", { params: pagination }).then((res) => {
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
};

export const createTipoPersonal = async (data: CreateTipoPersonal): Promise<ApiResponse> => {
  const response = await axiosClient.post("/tipo-personal/", data).then((res) => {
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

export const updateTipoPersonal = async (id: number, data: UpdateTipoPersonalDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/tipo-personal/${id}`, data).then((res) => {
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