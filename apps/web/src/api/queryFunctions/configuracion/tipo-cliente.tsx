import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTipoCliente,
  deleteTipoCliente,
  getTipoCliente,
  updateTipoCliente,
} from "../../functions/configuracion";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { TipoCliente } from "../../../types";
import type { ActualizarTipoCliente, CreateTipoCliente } from "../../types";
import { queryClient } from "../../../App";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";

export const useTipoCliente = (): UseQueryResult<
  ApiResponse<PaginatedResponse<TipoCliente[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-cliente"],
    queryFn: () => getTipoCliente({ pagination: 'false' }),
  });
};

export const useCrearTipoCliente = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTipoCliente
> => {
  return useMutation({
    mutationFn: (data: CreateTipoCliente) => createTipoCliente(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-cliente"] });
        toast.success("Tipo de cliente creado exitosamente", {
          description: "El tipo de cliente ha sido creado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al crear tipo de cliente");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear tipo de cliente");
    },
  });
};

export const useActualizarTipoCliente = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: ActualizarTipoCliente }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarTipoCliente }) =>
      updateTipoCliente(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-cliente"] });
        toast.success("Tipo de cliente actualizado exitosamente", {
          description: "El tipo de cliente ha sido actualizado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al actualizar tipo de cliente");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar tipo de cliente");
    },
  });
};

export const useEliminarTipoCliente = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number }
> => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteTipoCliente(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-cliente"] });
        toast.success("Tipo de cliente eliminado exitosamente", {
          description: "El tipo de cliente ha sido eliminado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al eliminar tipo de cliente");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar tipo de cliente");
    },
  });
};
