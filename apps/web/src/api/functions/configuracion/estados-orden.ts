import type { EstadoOrden } from "../../../types"
import { apiGet, apiPatch, apiPost } from "../../config"
import type { CreateEstadoOrdenDto, UpdateEstadoOrdenDto } from "../../dtos"
import type { PaginationDto } from "../../dtos/common"
import type { ApiResponse } from "../../types/common"


export const getEstadosOrden = async (pagination: PaginationDto): Promise<ApiResponse<EstadoOrden[]>> => {
  return await apiGet<EstadoOrden[]>("/estado-orden", pagination);
}

export const createEstadoOrden = async (data: CreateEstadoOrdenDto): Promise<ApiResponse> => {
  return await apiPost<EstadoOrden>("/estado-orden", data);
}

export const updateEstadoOrden = async (id: number, data: UpdateEstadoOrdenDto): Promise<ApiResponse> => {
  return await apiPatch<EstadoOrden>(`/estado-orden/${id}`, data);
}

// TODO: Eliminar estado de orden