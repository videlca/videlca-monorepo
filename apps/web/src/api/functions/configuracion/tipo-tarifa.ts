import { axiosClient } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { UpdateTipoTarifaDto } from "../../dtos/configuracion";
import type { TipoTarifa } from "../../types";
import type { ApiResponse } from "../../types/common";

export const getTipoTarifa = async (pagination: PaginationDto): Promise<ApiResponse<TipoTarifa[]>> => {
  const response = await axiosClient.get("/tipo-tarifa", { params: pagination }).then((res) => {
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

export const updateTipoTarifa = async (id: number, data: UpdateTipoTarifaDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/tipo-tarifa/${id}`, data).then((res) => {
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