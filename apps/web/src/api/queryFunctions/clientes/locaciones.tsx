import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createLocacion,
  deleteLocacion,
  getLocacionById,
  getLocaciones,
  getLocacionesActivo,
  updateLocacion,
} from "../../functions/clientes/locaciones";
import type { ApiResponse } from "../../types";
import type { Locacion } from "../../../types";
import { queryClient } from "../../../App";
import { toast } from "sonner";
import type { CreateLocacionDto, UpdateLocacionDto } from "../../dtos";

export const useLocaciones = (): UseQueryResult<
  ApiResponse<Locacion[]>,
  Error
> => {
  return useQuery({
    queryKey: ["locaciones"],
    queryFn: () => getLocaciones({ pagination: false }),
  });
};

export const useLocacionById = (): UseMutationResult<
  ApiResponse<Locacion | null>,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => getLocacionById(id),
    onSuccess: (data, id) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.setQueryData(["locacion", id], data);
        toast.success("Locación obtenida exitosamente", {
          description: "La locación ha sido obtenida correctamente",
        });
      } else {
        throw new Error(data.message || "Error al obtener locación");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al obtener locación");
    },
  });
};

export const useLocacionesActivo = (): UseQueryResult<
  ApiResponse<Locacion[]>,
  Error
> => {
  return useQuery({
    queryKey: ["locaciones-activo"],
    queryFn: () => getLocacionesActivo({ pagination: false }),
  });
};

export const useCreateLocacion = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateLocacionDto
> => {
  return useMutation({
    mutationFn: (data: CreateLocacionDto) => createLocacion(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["locaciones"] });
        toast.success("Locación creada exitosamente", {
          description: "La locación ha sido creada correctamente",
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear locación");
    },
  });
};

export const useUpdateLocacion = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateLocacionDto }
> => {
  return useMutation({
    mutationFn: (data: { id: number; data: UpdateLocacionDto }) =>
      updateLocacion(data.id, data.data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["locaciones"] });
        toast.success("Locación actualizada exitosamente", {
          description: "La locación ha sido actualizada correctamente",
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar locación");
    },
  });
};

export const useDeleteLocacion = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => deleteLocacion(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["locaciones"] });
        toast.success("Locación eliminada exitosamente", {
          description: "La locación ha sido eliminada correctamente",
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar locación");
    },
  });
};
