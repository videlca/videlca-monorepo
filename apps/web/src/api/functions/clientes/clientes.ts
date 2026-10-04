import type { Cliente } from "../../../types";
import type { PaginationDto, EnviarCorreoDto } from "../../dtos/common";
import type { CreateClienteDto, UpdateClienteDto, FilterClienteDto } from "../../dtos/clientes";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import { apiDelete, apiGet, apiPatch, apiPost, axiosClient } from "../../config";


export const getClientes = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Cliente[]>>> => {
  return await apiGet<PaginatedResponse<Cliente[]>>("/clientes", pagination);
};

export const getFilteredClientes = async (filter: FilterClienteDto): Promise<ApiResponse<PaginatedResponse<Cliente[]>>> => {
  return await apiGet<PaginatedResponse<Cliente[]>>("/clientes/filter", filter);
};

export const getClienteById = async (id: number): Promise<ApiResponse<Cliente | null>> => {
  return await apiGet<Cliente>(`/clientes/${id}`);
};

export const getClientesActivo = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Cliente[]>>> => {
  return await apiGet<PaginatedResponse<Cliente[]>>("/clientes/actives", pagination);
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

export const descargarExcelClientes = async (filter?: FilterClienteDto): Promise<{ blob: Blob; filename: string }> => {
  let url = "/clientes/descargar-clientes";

  if (filter?.column && filter?.query) {
    const params = new URLSearchParams({
      column: filter.column,
      query: filter.query,
    });
    if (filter.pagination !== undefined) {
      params.append('pagination', String(filter.pagination));
    }
    url += `?${params.toString()}`;
  }

  const response = await axiosClient.get(url, {
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"];
  let filename = `clientes_puestos_${new Date().toISOString()}.xlsx`;

  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, "");
    }
  }

  return { blob: response.data, filename };
};

export const enviarExcelClientes = async (data: EnviarCorreoDto, filter?: FilterClienteDto): Promise<ApiResponse> => {
  let url = "/clientes/enviar-excel-clientes";

  if (filter?.column && filter?.query) {
    const params = new URLSearchParams({
      column: filter.column,
      query: filter.query,
    });
    if (filter.pagination !== undefined) {
      params.append('pagination', String(filter.pagination));
    }
    url += `?${params.toString()}`;
  }

  return await apiPost(url, data);
};