import { axiosClient } from "../../config";
import type { ApiResponse } from "../../types/common";
import type { Ciudad, Departamento, Pais } from "../../../types";
import type { CreateCiudadDto, CreateDepartamentoDto, CreatePaisDto, UpdateCiudadDto, UpdateDepartamentoDto, UpdatePaisDto } from "../../dtos/configuracion";
import type { PaginationDto } from "../../dtos/common";


// Paises
export const getPais = async (pagination: PaginationDto): Promise<ApiResponse<Pais[]>> => {
  const response = await axiosClient.get("/ubicacion/pais", { params: pagination }).then((res) => {
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

export const createPais = async (data: CreatePaisDto): Promise<ApiResponse> => {
  const response = await axiosClient.post("/ubicacion/pais", data).then((res) => {
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

export const updatePais = async (id: number, data: UpdatePaisDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/ubicacion/pais/${id}`, data).then((res) => {
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

// Departamentos
export const getDepartamento = async (pagination: PaginationDto): Promise<ApiResponse<Departamento[]>> => {
  const response = await axiosClient.get("/ubicacion/departamento", { params: pagination }).then((res) => {
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

export const createDepartamento = async (data: CreateDepartamentoDto): Promise<ApiResponse> => {
  const response = await axiosClient.post("/ubicacion/departamento", data).then((res) => {
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

export const updateDepartamento = async (id: number, data: UpdateDepartamentoDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/ubicacion/departamento/${id}`, data).then((res) => {
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

// Ciudades
export const getCiudad = async (pagination: PaginationDto): Promise<ApiResponse<Ciudad[]>> => {
  const response = await axiosClient.get("/ubicacion/ciudad", { params: pagination }).then((res) => {
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

export const createCiudad = async (data: CreateCiudadDto): Promise<ApiResponse> => {
  const response = await axiosClient.post("/ubicacion/ciudad", data).then((res) => {
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

export const updateCiudad = async (id: number, data: UpdateCiudadDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/ubicacion/ciudad/${id}`, data).then((res) => {
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