import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { CreateServicioDto, UpdateServicioDto } from "../../dtos";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types/common";
import type { Servicio } from "../../types/servicio";

export const getServicios = async (pagination: PaginationDto): Promise<ApiResponse<Servicio[]>> => {
  return await apiGet<Servicio[]>("/servicios", pagination);
};

export const getServiciosByPeriodo = async (idPeriodo: number, pagination: PaginationDto): Promise<ApiResponse<Servicio[]>> => {
  return await apiGet<Servicio[]>(`/servicios/periodo/${idPeriodo}`, pagination);
};

export const getServicioById = async (id: number): Promise<ApiResponse<Servicio>> => {
  return await apiGet<Servicio>(`/servicios/${id}`);
};

export const getServiciosActivo = async (pagination: PaginationDto): Promise<ApiResponse<Servicio[]>> => {
  return await apiGet<Servicio[]>("/servicios/actives", pagination);
}

export const createServicio = async (data: CreateServicioDto): Promise<ApiResponse> => {
  return await apiPost<Servicio>("/servicios", data);
}

export const updateServicio = async (id: number, data: UpdateServicioDto): Promise<ApiResponse> => {
  return await apiPatch<Servicio>(`/servicios/${id}`, data);
}

export const deleteServicio = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<Servicio>(`/servicios/${id}`);
}