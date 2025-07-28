import { apiGet, apiPost } from "../../config";
import type { CreateOrdenServicioDto, PaginationDto, TercerPasoDto } from "../../dtos"
import type { ApiResponse } from "../../types";
import type { OrdenServicio } from "../../types/orden-servicio";

export const createOrdenServicio = async (data: CreateOrdenServicioDto): Promise<ApiResponse<OrdenServicio>> => {
  return await apiPost<OrdenServicio>("/orden-servicio", data);
}

export const getOrdenesServicio = async (pagination: PaginationDto): Promise<ApiResponse<OrdenServicio[]>> => {
  return await apiGet<OrdenServicio[]>("/orden-servicio", pagination);
}

// TODO: revisar respuesta
export const validateHorariosOrdenServicio = async (data: TercerPasoDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/orden-servicio/validacion-horarios", data);
}

export const getOrdenServicioById = async (id: number): Promise<ApiResponse<OrdenServicio>> => {
  return await apiGet<OrdenServicio>(`/orden-servicio/${id}`);
}