import type { Puesto } from "../../../types";
import { apiGet, axiosClient } from "../../config";
import type { SearchPuestosDto } from "../../dtos";
import type { CreatePuestoDto, FilterLocacionDto, UpdatePuestoDto } from "../../dtos/clientes";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse , PaginatedResponse } from "../../types/common";

  export const getPuestos = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Puesto[]>>> => {
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

export const getPuestosByCliente = async (idCliente: number, pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Puesto[]>>> => {
  const response = await axiosClient.get(`/locaciones`, { params: pagination }).then((res) => {
    const clientesFiltrados = res.data.data.filter((cliente: Puesto) => cliente.idCliente.idCliente === idCliente);
    return {
      status: res.status,
      data: {
        data: clientesFiltrados,
        pagination: {
          ...res.data.pagination,
          total: clientesFiltrados.length,
          limit: clientesFiltrados.length,
        }
      },
    };
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || "Error de conexión",
    };
  });
  return response;
};

export const getPuestoById = async (id: number): Promise<ApiResponse<Puesto | null>> => {
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

export const searchPuestos = async (query: SearchPuestosDto): Promise<ApiResponse<PaginatedResponse<Puesto[]>>> => {
  return await apiGet<PaginatedResponse<Puesto[]>>(`/locaciones/search?column=${query.column}&text=${query.text}`);
};

export const getFilteredPuestos = async (filter: FilterLocacionDto): Promise<ApiResponse<PaginatedResponse<Puesto[]>>> => {
  return await apiGet<PaginatedResponse<Puesto[]>>("/locaciones/filter", filter);
};

export const getPuestosActivo = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Puesto[]>>> => {
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

export const createPuesto = async (data: CreatePuestoDto): Promise<ApiResponse> => {
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

export const updatePuesto = async (id: number, data: UpdatePuestoDto): Promise<ApiResponse> => {
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

export const deletePuesto = async (id: number): Promise<ApiResponse> => {
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
