import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createSegmentacion,
  getSegmentaciones,
  updateSegmentacion,
} from "../../functions/clientes/segmentacion";
import type { CreateSegmentacionDto, UpdateSegmentacionDto } from "../../dtos";
import { queryClient } from "../../../App";
import type { ApiResponse } from "../../types/common";
import type { Segmentacion } from "../../../types";
import { toast } from "sonner";

export const useSegmentaciones = (): UseQueryResult<
  ApiResponse<Segmentacion[]>,
  Error
> => {
  return useQuery({
    queryKey: ["segmentaciones"],
    queryFn: () => getSegmentaciones({ pagination: false }),
  });
};

export const useCrearSegmentacion = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateSegmentacionDto
> => {
  return useMutation({
    mutationFn: (data: CreateSegmentacionDto) => createSegmentacion(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
        toast.success("Segmentación creada exitosamente", {
          description: "La segmentación ha sido creada correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear segmentación");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear segmentación");
    },
  });
};

export const useActualizarSegmentacion = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateSegmentacionDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSegmentacionDto }) =>
      updateSegmentacion(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
        toast.success("Segmentación actualizada exitosamente", {
          description: "La segmentación ha sido actualizada correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar segmentación");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar segmentación");
    },
  });
};
