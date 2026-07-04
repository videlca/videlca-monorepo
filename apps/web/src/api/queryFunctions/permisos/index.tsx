import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createRole,
  deleteRole,
  getActiveRoles,
  getPermissionsRole,
  getRoles,
  getRolesWithPermissions,
  updateRole,
} from "../../functions/permisos";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { Rol } from "../../../types";
import type { CreateRoleDto, UpdateRoleDto } from "../../dtos";
import { queryClient } from "../../../App";
import { toast } from "sonner";
import type { RolesWithPermissions } from "../../types/permisos";

export const useActiveRoles = (): UseQueryResult<ApiResponse<PaginatedResponse<Rol[]>>, Error> => {
  return useQuery({
    queryKey: ["active-roles"],
    queryFn: () => getActiveRoles({ pagination: 'false' }),
  });
};

export const useRoles = (): UseQueryResult<ApiResponse<PaginatedResponse<Rol[]>>, Error> => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => getRoles({ pagination: 'false' }),
  });
};

export const useCreateRole = (): UseMutationResult<
  ApiResponse<Rol>,
  Error,
  CreateRoleDto
> => {
  return useMutation({
    mutationFn: (data: CreateRoleDto) => createRole(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["roles"] });
        queryClient.invalidateQueries({ queryKey: ["active-roles"] });
        toast.success("Rol creado exitosamente", {
          description: "El rol ha sido creado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear rol");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear rol");
    },
  });
};

export const useUpdateRole = (): UseMutationResult<
  ApiResponse<Rol>,
  Error,
  { id: number; data: UpdateRoleDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleDto }) =>
      updateRole(id, data),
    onSuccess: (data, { id }) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["roles"] });
        queryClient.invalidateQueries({ queryKey: ["active-roles"] });
        queryClient.invalidateQueries({ queryKey: ["permissions-role", id] });
        queryClient.invalidateQueries({ queryKey: ["roles-with-permissions"] });
        toast.success("Rol actualizado exitosamente", {
          description: "El rol ha sido actualizado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar rol");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar rol");
    },
  });
};

export const useDeleteRole = (): UseMutationResult<
  ApiResponse<Rol>,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["roles"] });
        queryClient.invalidateQueries({ queryKey: ["active-roles"] });
        queryClient.invalidateQueries({ queryKey: ["roles-with-permissions"] });
        toast.success("Rol eliminado exitosamente", {
          description: "El rol ha sido eliminado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al eliminar rol");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar rol");
    },
  });
};

export const useGetRolesWithPermissions = (): UseQueryResult<
  ApiResponse<PaginatedResponse<RolesWithPermissions>>,
  Error
> => {
  return useQuery({
    queryKey: ["roles-with-permissions"],
    queryFn: () => getRolesWithPermissions({ pagination: 'false' }),
  });
};

export const useGetPermissionsRole = (
  id: number,
): UseQueryResult<ApiResponse<Rol>, Error> => {
  return useQuery({
    queryKey: ["permissions-role", id],
    queryFn: () => getPermissionsRole(id),
  });
};
