import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { createUsuario, deleteUsuario, getUsuarioByCookie, getUsuarios, updateUsuario, updateUsuarioPerfil, getFilteredUsuarios } from "../../functions/usuarios";
import type { ApiResponse } from "../../types/common";
import type { Usuario } from "../../../types";
import type { CreateUserDto, UpdateUserDto, UpdateUserStatusDto } from "../../dtos";
import { queryClient } from "../../../App";
import { toast } from "sonner";

export const useGetUsuarios = (): UseQueryResult<ApiResponse<Usuario[]>, Error> => {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: () => getUsuarios({ pagination: false }),
  })
}

export const useFilterUsuarios = (): UseMutationResult<ApiResponse<Usuario[]>, Error, any> => {
  return useMutation({
    mutationFn: (filter: any) => getFilteredUsuarios(filter),
    onError: (error) => {
      toast.error(error.message || "Error al filtrar usuarios");
    },
  });
};

export const useCreateUsuario = (): UseMutationResult<ApiResponse, Error, CreateUserDto> => {
  return useMutation({ 
    mutationFn: (data: CreateUserDto) => createUsuario(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['usuarios'] })
        toast.success('Usuario creado correctamente', {
          description: 'El usuario ha sido creado correctamente'
        })
      } else {
        throw new Error(data.message || 'Error al crear usuario')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear usuario')
    }
  })
}

export const useUpdateUsuario = (): UseMutationResult<ApiResponse, Error, { id: number; data: UpdateUserDto | UpdateUserStatusDto }> => {
  return useMutation({
    mutationFn: ({ id, data }) => updateUsuario(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['usuarios'] })
        toast.success('Usuario actualizado correctamente', {
          description: 'El usuario ha sido actualizado correctamente'
        })
      } else {
        throw new Error(data.message || 'Error al actualizar usuario')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar usuario')
    }
  })
}

export const useDeleteUsuario = (): UseMutationResult<ApiResponse, Error, { id: number }> => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteUsuario(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['usuarios'] })
        toast.success('Usuario eliminado correctamente', {
          description: 'El usuario ha sido eliminado correctamente'
        })
      } else {
        throw new Error(data.message || 'Error al eliminar usuario')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar usuario')
    }
  })
}

export const useGetUsuarioByCookie = (): UseQueryResult<ApiResponse<Usuario>, Error> => {
  return useQuery({
    queryKey: ['usuario'],
    queryFn: () => getUsuarioByCookie(),
    staleTime: 60000,
  })
}

export const useUpdateUsuarioPerfil = (): UseMutationResult<ApiResponse, Error, UpdateUserDto> => {
  return useMutation({
    mutationFn: (data: UpdateUserDto) => updateUsuarioPerfil(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['usuario'] })
        toast.success('Usuario actualizado correctamente', {
          description: 'El usuario ha sido actualizado correctamente'
        })
      } else {
        throw new Error(data.message || 'Error al actualizar usuario')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar usuario')
    }
  })
}