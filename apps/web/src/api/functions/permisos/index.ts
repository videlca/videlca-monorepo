
import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { CreateRoleDto, UpdateRoleDto } from "../../dtos/permisos";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import type { Modulos, Rol, RolesWithPermissions } from "../../types/permisos";

export const getActiveRoles = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Rol[]>>> => {
  return await apiGet<PaginatedResponse<Rol[]>>("/permissions/roles/activos", pagination);
}

export const getRoles = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Rol[]>>> => {
  return await apiGet<PaginatedResponse<Rol[]>>("/permissions/roles", pagination);
}

export const createRole = async (data: CreateRoleDto): Promise<ApiResponse<Rol>> => {
  return await apiPost<Rol>("/permissions/role", data);
}

export const updateRole = async (id: number, data: UpdateRoleDto): Promise<ApiResponse<Rol>> => {
  return await apiPatch<Rol>(`/permissions/role/${id}`, data);
}

export const deleteRole = async (id: number): Promise<ApiResponse<Rol>> => {
  return await apiDelete<Rol>(`/permissions/role/${id}`);
}

// Modulos
export const getModulos = async (pagination?: PaginationDto): Promise<ApiResponse<PaginatedResponse<Modulos>>> => {
  return await apiGet<PaginatedResponse<Modulos>>("/permissions", pagination);
}

// Permisos

export const getRolesWithPermissions = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<RolesWithPermissions>>> => {
  return await apiGet<PaginatedResponse<RolesWithPermissions>>("/permissions/roles-permissions", pagination);
}

export const getPermissionsRole = async (id: number): Promise<ApiResponse<Rol>> => {
  return await apiGet<Rol>(`/permissions/role/${id}`);
}