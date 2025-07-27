import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTarifa,
  deleteTarifa,
  getTarifaById,
  getTarifasActivo,
  getTarifasByPeriodo,
  updateTarifa,
} from "../../functions/tarifas/tarifa";
import type { CreateTarifaDto, UpdateTarifaDto } from "../../dtos/tarifas";
import type { ApiResponse } from "../../types";
import type { Tarifa } from "../../types/periodo";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useTarifas = (
  idPeriodo: number,
): UseQueryResult<ApiResponse<Tarifa[]>, Error> => {
  return useQuery({
    queryKey: ["tarifas", idPeriodo],
    queryFn: () => getTarifasByPeriodo(idPeriodo, { pagination: false }),
  });
};

export const useTarifasActivo = (
  idPeriodo: number,
): UseQueryResult<ApiResponse<Tarifa[]>, Error> => {
  return useQuery({
    queryKey: ["tarifas-activo", idPeriodo],
    queryFn: () => getTarifasActivo(idPeriodo, { pagination: false }),
  });
};

export const useTarifaById = (
  id: number,
): UseMutationResult<ApiResponse<Tarifa>, Error, number> => {
  return useMutation({
    mutationKey: ["tarifa-by-id", id],
    mutationFn: (id: number) => getTarifaById(id),
  });
};

export const useCrearTarifa = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTarifaDto
> => {
  return useMutation({
    mutationKey: ["crear-tarifa"],
    mutationFn: (data: CreateTarifaDto) => createTarifa(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tarifa creada correctamente");
        queryClient.invalidateQueries({
          queryKey: ["tarifas", data.data.idPeriodo],
        });
      } else {
        throw new Error(data.message || "Error al crear la tarifa");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear la tarifa");
    },
  });
};

export const useActualizarTarifa = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateTarifaDto }
> => {
  return useMutation({
    mutationKey: ["actualizar-tarifa"],
    mutationFn: ({ id, data }: { id: number; data: UpdateTarifaDto }) =>
      updateTarifa(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tarifa actualizada correctamente");
        queryClient.invalidateQueries({
          queryKey: ["tarifas", data.data.idPeriodo],
        });
      } else {
        throw new Error(data.message || "Error al actualizar la tarifa");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar la tarifa");
    },
  });
};

export const useEliminarTarifa = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["eliminar-tarifa"],
    mutationFn: (id: number) => deleteTarifa(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tarifa eliminada correctamente");
        queryClient.invalidateQueries({
          queryKey: ["tarifas", data.data.idPeriodo],
        });
      } else {
        throw new Error(data.message || "Error al eliminar la tarifa");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar la tarifa");
    },
  });
};
