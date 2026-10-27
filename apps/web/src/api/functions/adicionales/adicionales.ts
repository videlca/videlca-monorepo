import { apiGet, apiPost, apiPatch, apiDelete } from "../../config";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import type { Adicional, TipoAdicional } from "../../types/adicionales";
import type { CreateAdicionalDto, UpdateAdicionalDto, FindAdicionalesDto } from "../../dtos/adicionales";

export const getAdicionales = async (params: FindAdicionalesDto): Promise<ApiResponse<PaginatedResponse<Adicional[]>>> =>
  apiGet<PaginatedResponse<Adicional[]>>("/adicionales", params);

export const getTiposAdicional = async (): Promise<ApiResponse<TipoAdicional[]>> =>
  apiGet<TipoAdicional[]>("/adicionales/tipos");

export const getAdicionalById = async (id: number): Promise<ApiResponse<Adicional | null>> =>
  apiGet<Adicional>(`/adicionales/${id}`);

export const createAdicional = async (data: CreateAdicionalDto): Promise<ApiResponse<Adicional>> =>
  apiPost<Adicional>("/adicionales", data);

export const updateAdicional = async (id: number, data: UpdateAdicionalDto): Promise<ApiResponse<Adicional>> =>
  apiPatch<Adicional>(`/adicionales/${id}`, data);

export const cancelarAdicional = async (id: number): Promise<ApiResponse<Adicional>> =>
  apiPatch<Adicional>(`/adicionales/cancelar/${id}`);

export const deleteAdicional = async (id: number): Promise<ApiResponse> =>
  apiDelete<Adicional>(`/adicionales/${id}`);
