import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createPeriodo,
  deletePeriodo,
  getPeriodoById,
  getPeriodos,
  getPeriodosActivo,
  updatePeriodo,
} from "../../functions/tarifas/periodo";
import type { ApiResponse } from "../../types";
import type { Periodo } from "../../types/periodo";
import type { CreatePeriodoDto, UpdatePeriodoDto } from "../../dtos";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const usePeriodos = (): UseQueryResult<
  ApiResponse<Periodo[]>,
  Error
> => {
  return useQuery({
    queryKey: ["periodos"],
    queryFn: () => getPeriodos({ pagination: false }),
  });
};

export const usePeriodosActivo = (): UseQueryResult<
  ApiResponse<Periodo[]>,
  Error
> => {
  return useQuery({
    queryKey: ["periodos-activo"],
    queryFn: () => getPeriodosActivo(),
  });
};

export const usePeriodoById = (
  id: number,
): UseQueryResult<ApiResponse<Periodo>, Error> => {
  return useQuery({
    queryKey: ["periodo-by-id", id],
    queryFn: () => getPeriodoById(id),
  });
};

export const useCrearPeriodo = (): UseMutationResult<
  ApiResponse,
  Error,
  CreatePeriodoDto
> => {
  return useMutation({
    mutationKey: ["crear-periodo"],
    mutationFn: (data: CreatePeriodoDto) => createPeriodo(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Periodo creado correctamente");
        queryClient.invalidateQueries({ queryKey: ["periodos"] });
      } else {
        throw new Error(data.message || "Error al crear el periodo");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear el periodo");
    },
  });
};

export const useActualizarPeriodo = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdatePeriodoDto }
> => {
  return useMutation({
    mutationKey: ["actualizar-periodo"],
    mutationFn: ({ id, data }: { id: number; data: UpdatePeriodoDto }) =>
      updatePeriodo(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Periodo actualizado correctamente");
        queryClient.invalidateQueries({ queryKey: ["periodos"] });
      } else {
        throw new Error(data.message || "Error al actualizar el periodo");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar el periodo");
    },
  });
};

export const useEliminarPeriodo = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["eliminar-periodo"],
    mutationFn: (id: number) => deletePeriodo(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Periodo eliminado correctamente");
        queryClient.invalidateQueries({ queryKey: ["periodos"] });
      } else {
        throw new Error(data.message || "Error al eliminar el periodo");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar el periodo");
    },
  });
};
