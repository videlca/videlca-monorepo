import type { Cliente } from "../../../types";
import type { PaginationDto } from "../../dtos/common";
import type { CreateClienteDto, UpdateClienteDto } from "../../dtos/clientes";
import type { ApiResponse } from "../../types";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";


export const getClientes = async (pagination: PaginationDto): Promise<ApiResponse<Cliente[]>> => {
  return await apiGet<Cliente[]>("/clientes", pagination);
};

export const getClienteById = async (id: number): Promise<ApiResponse<Cliente | null>> => {
  return await apiGet<Cliente>(`/clientes/${id}`);
};

export const getClientesActivo = async (pagination: PaginationDto): Promise<ApiResponse<Cliente[]>> => {
  return await apiGet<Cliente[]>("/clientes/actives", pagination);
};

export const createCliente = async (data: CreateClienteDto): Promise<ApiResponse> => {
  return await apiPost<Cliente>("/clientes", data);
}

export const updateCliente = async (id: number, data: UpdateClienteDto): Promise<ApiResponse> => {
  return await apiPatch<Cliente>(`/clientes/${id}`, data);
}

export const deleteCliente = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<Cliente>(`/clientes/${id}`);
}