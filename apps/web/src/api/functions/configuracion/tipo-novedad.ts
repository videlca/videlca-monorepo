import type { TipoNovedad } from "../../../types";
import { axiosClient } from "../../config";
import type { ActualizarTipoNovedad, CreateTipoNovedad } from "../../types";
import type { ApiResponse } from "../../types/common";
import type { PaginationDto } from "../../dtos/common";

export const getTipoNovedad = async (pagination: PaginationDto): Promise<ApiResponse<TipoNovedad[]>> => {
  const response = await axiosClient.get("/tipo-novedad", { params: pagination }).then((res) => {
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

export const createTipoNovedad = async (data: CreateTipoNovedad): Promise<ApiResponse> => {
  const response = await axiosClient.post("/tipo-novedad", data).then((res) => {
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

export const updateTipoNovedad = async (id: number, data: ActualizarTipoNovedad): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/tipo-novedad/${id}`, data).then((res) => {
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

