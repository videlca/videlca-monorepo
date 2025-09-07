import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTipoContrato,
  deleteTipoContrato,
  getTipoContrato,
  getTipoContratoActivo,
  updateTipoContrato,
} from "../../functions/configuracion/tipo-contrato";
import type { ApiResponse } from "../../types/common";
import type { TipoContrato } from "../../types";
import type { ActualizarTipoContrato, CreateTipoContrato } from "../../dtos";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useTipoContrato = (): UseQueryResult<
  ApiResponse<TipoContrato[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-contrato"],
    queryFn: () => getTipoContrato({ pagination: false }),
  });
};

export const useTipoContratoActivo = (): UseQueryResult<
  ApiResponse<TipoContrato[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-contrato-activo"],
    queryFn: () => getTipoContratoActivo({ pagination: false }),
  });
};

export const useCrearTipoContrato = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTipoContrato
> => {
  return useMutation({
    mutationFn: (data: CreateTipoContrato) => createTipoContrato(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-contrato"] });
        toast.success("Tipo de contrato creado exitosamente", {
          description: "El tipo de contrato ha sido creado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear tipo de contrato");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear tipo de contrato");
    },
  });
};

export const useActualizarTipoContrato = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: ActualizarTipoContrato }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarTipoContrato }) =>
      updateTipoContrato(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-contrato"] });
        toast.success("Tipo de contrato actualizado exitosamente", {
          description: "El tipo de contrato ha sido actualizado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar tipo de contrato");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar tipo de contrato");
    },
  });
};

export const useEliminarTipoContrato = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number }
> => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteTipoContrato(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-contrato"] });
        toast.success("Tipo de contrato eliminado exitosamente", {
          description: "El tipo de contrato ha sido eliminado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al eliminar tipo de contrato");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar tipo de contrato");
    },
  });
};
