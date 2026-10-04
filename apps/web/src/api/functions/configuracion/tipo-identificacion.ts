import type { TipoIdentificacion } from "../../../types";
import { apiDelete, axiosClient } from "../../config";
import type { ActualizarTipoIdentificacion, CreateTipoIdentificacion } from "../../types";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { PaginationDto } from "../../dtos/common";

export const getTipoIdentificacion = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoIdentificacion[]>>> => {
  const response = await axiosClient.get("/tipo-id", { params: pagination }).then((res) => {
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

export const getTipoIdentificacionActivo = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<TipoIdentificacion[]>>> => {
  const response = await axiosClient.get("/tipo-id/actives", { params: pagination }).then((res) => {
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

export const createTipoIdentificacion = async (data: CreateTipoIdentificacion): Promise<ApiResponse> => {
  const response = await axiosClient.post("/tipo-id", data).then((res) => {
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

export const updateTipoIdentificacion = async (id: number, data: ActualizarTipoIdentificacion): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/tipo-id/${id}`, data).then((res) => {
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

export const deleteTipoIdentificacion = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<TipoIdentificacion>(`/tipo-id/${id}`)
}