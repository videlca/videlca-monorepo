import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { CreatePersonalDto, UpdatePersonalDto } from "../../dtos/personal";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types/common";
import type { Personal } from "../../types/personal";

export const getPersonal = async (pagination: PaginationDto): Promise<ApiResponse<Personal[]>> => {
  return await apiGet<Personal[]>("/personal", pagination);
};

export const getPersonalById = async (id: number): Promise<ApiResponse<Personal>> => {
  return await apiGet<Personal>(`/personal/${id}`);
};

export const getPersonalActivo = async (pagination: PaginationDto): Promise<ApiResponse<Personal[]>> => {
  return await apiGet<Personal[]>("/personal/actives", pagination);
};

export const createPersonal = async (data: CreatePersonalDto): Promise<ApiResponse> => {
  return await apiPost<Personal>("/personal", data);
};

export const updatePersonal = async (id: number, data: UpdatePersonalDto): Promise<ApiResponse> => {
  return await apiPatch<Personal>(`/personal/${id}`, data);
};

export const deletePersonal = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<Personal>(`/personal/${id}`);
};