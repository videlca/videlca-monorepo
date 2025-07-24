import type { Locacion } from "../../../types";
import { axiosClient } from "../../config";
import type { CreateLocacionDto, UpdateLocacionDto } from "../../dtos/clientes";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types";

export const getLocaciones = async (pagination: PaginationDto): Promise<ApiResponse<Locacion[]>> => {
  const response = await axiosClient.get("/locaciones", { params: pagination }).then((res) => {
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

export const getLocacionById = async (id: number): Promise<ApiResponse<Locacion | null>> => {
  const response = await axiosClient.get(`/locaciones/${id}`).then((res) => {
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

export const getLocacionesActivo = async (pagination: PaginationDto): Promise<ApiResponse<Locacion[]>> => {
  const response = await axiosClient.get("/locaciones/actives", { params: pagination }).then((res) => {
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

export const createLocacion = async (data: CreateLocacionDto): Promise<ApiResponse> => {
  const response = await axiosClient.post("/locaciones", data).then((res) => {
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

export const updateLocacion = async (id: number, data: UpdateLocacionDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/locaciones/${id}`, data).then((res) => {
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

export const deleteLocacion = async (id: number): Promise<ApiResponse> => {
  const response = await axiosClient.delete(`/locaciones/${id}`).then((res) => {
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
