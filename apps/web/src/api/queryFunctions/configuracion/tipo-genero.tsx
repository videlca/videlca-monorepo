import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTipoGenero,
  getTipoGenero,
  updateTipoGenero,
} from "../../functions/configuracion/";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { TipoGenero } from "../../../types";
import type { ActualizarTipoGenero, CreateTipoGenero } from "../../types";
import { queryClient } from "../../../App";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";

export const useTipoGenero = (): UseQueryResult<
  ApiResponse<PaginatedResponse<TipoGenero[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-genero"],
    queryFn: () => getTipoGenero({ pagination: 'false' }),
  });
};

export const useCrearTipoGenero = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTipoGenero
> => {
  return useMutation({
    mutationFn: (data: CreateTipoGenero) => createTipoGenero(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-genero"] });
        toast.success("Tipo de género creado exitosamente", {
          description: "El tipo de género ha sido creado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al crear tipo de género");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear tipo de género");
    },
  });
};

export const useActualizarTipoGenero = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: ActualizarTipoGenero }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarTipoGenero }) =>
      updateTipoGenero(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-genero"] });
        toast.success("Tipo de género actualizado exitosamente", {
          description: "El tipo de género ha sido actualizado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al actualizar tipo de género");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar tipo de género");
    },
  });
};
