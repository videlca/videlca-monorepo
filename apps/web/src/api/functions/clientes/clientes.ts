import type { Cliente } from "../../../types";
import type { PaginationDto } from "../../dtos/common";
import type { CreateClienteDto, UpdateClienteDto } from "../../dtos/clientes";
import type { ApiResponse } from "../../types";
import { axiosClient } from "../../config";


export const getClientes = async (pagination: PaginationDto): Promise<ApiResponse<Cliente[]>> => {
  const response = await axiosClient.get("/clientes", { params: pagination }).then((res) => {
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

export const getClienteById = async (id: number): Promise<ApiResponse<Cliente | null>> => {
  const response = await axiosClient.get(`/clientes/${id}`).then((res) => {
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

export const getClientesActivo = async (pagination: PaginationDto): Promise<ApiResponse<Cliente[]>> => {
  const response = await axiosClient.get("/clientes/actives", { params: pagination }).then((res) => {
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

export const createCliente = async (data: CreateClienteDto): Promise<ApiResponse> => {
  const response = await axiosClient.post("/clientes", data).then((res) => {
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
}

export const updateCliente = async (id: number, data: UpdateClienteDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/clientes/${id}`, data).then((res) => {
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
}

export const deleteCliente = async (id: number): Promise<ApiResponse> => {
  const response = await axiosClient.delete(`/clientes/${id}`).then((res) => {
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
}