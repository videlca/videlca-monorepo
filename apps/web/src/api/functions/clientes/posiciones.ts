import type { Posicion } from "../../../types";
import { axiosClient } from "../../config";
import type { CreatePosicionDto, UpdatePosicionDto } from "../../dtos/clientes";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types";

export const getPosiciones = async (pagination: PaginationDto): Promise<ApiResponse<Posicion[]>> => {
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

export const getPosicionesByCliente = async (idCliente: number, pagination: PaginationDto): Promise<ApiResponse<Posicion[]>> => {
  const response = await axiosClient.get(`/locaciones`, { params: pagination }).then((res) => {
    const clientesFiltrados = res.data.filter((cliente: Posicion) => cliente.idCliente.idCliente === idCliente);
    return {
      status: res.status,
      data: clientesFiltrados,
    };
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || "Error de conexión",
    };
  });
  return response;
};

export const getPosicionById = async (id: number): Promise<ApiResponse<Posicion | null>> => {
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

export const getPosicionesActivo = async (pagination: PaginationDto): Promise<ApiResponse<Posicion[]>> => {
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

export const createPosicion = async (data: CreatePosicionDto): Promise<ApiResponse> => {
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

export const updatePosicion = async (id: number, data: UpdatePosicionDto): Promise<ApiResponse> => {
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

export const deletePosicion = async (id: number): Promise<ApiResponse> => {
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
