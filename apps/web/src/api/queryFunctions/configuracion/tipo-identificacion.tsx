import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTipoIdentificacion,
  deleteTipoIdentificacion,
  getTipoIdentificacion,
  getTipoIdentificacionActivo,
  updateTipoIdentificacion,
} from "../../functions/configuracion/";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import type { TipoIdentificacion } from "../../../types";
import type {
  ActualizarTipoIdentificacion,
  CreateTipoIdentificacion,
} from "../../types";
import { queryClient } from "../../../App";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";

export const useTipoIdentificacion = (): UseQueryResult<
  ApiResponse<PaginatedResponse<TipoIdentificacion[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-identificacion"],
    queryFn: () => getTipoIdentificacion({ pagination: 'false' }),
  });
};

export const useTipoIdentificacionActivo = (): UseQueryResult<
  ApiResponse<PaginatedResponse<TipoIdentificacion[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-identificacion-activo"],
    queryFn: () => getTipoIdentificacionActivo({ pagination: 'false' }),
  });
};

export const useCrearTipoIdentificacion = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTipoIdentificacion
> => {
  return useMutation({
    mutationFn: (data: CreateTipoIdentificacion) =>
      createTipoIdentificacion(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-identificacion"] });
        toast.success("Tipo de identificación creado exitosamente", {
          description: "El tipo de identificación ha sido creado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al crear tipo de identificación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear tipo de identificación");
    },
  });
};

export const useActualizarTipoIdentificacion = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: ActualizarTipoIdentificacion }
> => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: ActualizarTipoIdentificacion;
    }) => updateTipoIdentificacion(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-identificacion"] });
        toast.success("Tipo de identificación actualizado exitosamente", {
          description:
            "El tipo de identificación ha sido actualizado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al actualizar tipo de identificación");
      }
    },
    onError: (error) => {
      toast.error(
        error.message || "Error al actualizar tipo de identificación",
      );
    },
  });
};

export const useEliminarTipoIdentificacion = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number }
> => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteTipoIdentificacion(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-identificacion"] });
        toast.success("Tipo de identificación eliminado exitosamente", {
          description:
            "El tipo de identificación ha sido eliminado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al eliminar tipo de identificación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar tipo de identificación");
    },
  });
};
