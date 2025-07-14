import type { TipoCliente } from "../../../types";
import { axiosClient } from "../../config";
import type { ActualizarTipoCliente, CreateTipoCliente } from "../../types";
import type { ApiResponse } from "../../types/common";
import type { PaginationDto } from "../../dtos/common";

export const getTipoCliente = async (pagination: PaginationDto): Promise<ApiResponse<TipoCliente[]>> => {
  const response = await axiosClient.get("/tipo-cliente", { params: pagination }).then((res) => {
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

export const createTipoCliente = async (data: CreateTipoCliente): Promise<ApiResponse> => {
  const response = await axiosClient.post("/tipo-cliente", data).then((res) => {
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

export const updateTipoCliente = async (id: number, data: ActualizarTipoCliente): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/tipo-cliente/${id}`, data).then((res) => {
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

