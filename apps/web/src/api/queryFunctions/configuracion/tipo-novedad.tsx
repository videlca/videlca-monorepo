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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipo-novedad"] });
    },
    onError: (error) => {
      console.log(error);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipo-novedad"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
