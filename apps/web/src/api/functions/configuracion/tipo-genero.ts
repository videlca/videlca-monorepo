import type { TipoGenero } from "../../../types";
import { axiosClient } from "../../config";
import type { ActualizarTipoGenero, CreateTipoGenero } from "../../types";
import type { ApiResponse } from "../../types/common";
import type { PaginationDto } from "../../dtos/common";

export const getTipoGenero = async (pagination: PaginationDto): Promise<ApiResponse<TipoGenero[]>> => {
  const response = await axiosClient.get("/tipo-genero", { params: pagination }).then((res) => {
    return {
      status: res.status,
      data: res.data,
    };
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || "Error de conexión",
    };
  });
  return response;
};

export const createTipoGenero = async (data: CreateTipoGenero): Promise<ApiResponse> => {
  const response = await axiosClient.post("/tipo-genero", data).then((res) => {
    return {
      status: res.status,
      data: res.data,
    };
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || "Error de conexión",
    };
  });
  return response;
};

export const updateTipoGenero = async (id: number, data: ActualizarTipoGenero): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/tipo-genero/${id}`, data).then((res) => {
    return {
      status: res.status,
      data: res.data,
    };
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || "Error de conexión",
    };
  });
  return response;
};

