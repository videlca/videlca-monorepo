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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
    },
    onError: (error) => {
      console.log(error);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
