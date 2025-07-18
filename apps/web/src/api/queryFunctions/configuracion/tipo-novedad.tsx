import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTipoNovedad,
  getTipoNovedad,
  updateTipoNovedad,
} from "../../functions/configuracion/";
import type { ApiResponse } from "../../types/common";
import type { TipoNovedad } from "../../../types";
import type { ActualizarTipoNovedad, CreateTipoNovedad } from "../../types";
import { queryClient } from "../../../App";
import { toast } from "sonner";

export const useTipoNovedad = (): UseQueryResult<
  ApiResponse<TipoNovedad[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-novedad"],
    queryFn: () => getTipoNovedad({ pagination: false }),
  });
};

export const useCrearTipoNovedad = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTipoNovedad
> => {
  return useMutation({
    mutationFn: (data: CreateTipoNovedad) => createTipoNovedad(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-novedad"] });
        toast.success("Tipo de novedad creado exitosamente", {
          description: "El tipo de novedad ha sido creado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear tipo de novedad");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear tipo de novedad");
    },
  });
};

export const useActualizarTipoNovedad = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: ActualizarTipoNovedad }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarTipoNovedad }) =>
      updateTipoNovedad(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-novedad"] });
        toast.success("Tipo de novedad actualizado exitosamente", {
          description: "El tipo de novedad ha sido actualizado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar tipo de novedad");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar tipo de novedad");
    },
  });
};
