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
import type { ApiResponse } from "../../types/common";
import type { TipoGenero } from "../../../types";
import type { ActualizarTipoGenero, CreateTipoGenero } from "../../types";
import { queryClient } from "../../../App";

export const useTipoGenero = (): UseQueryResult<
  ApiResponse<TipoGenero[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-genero"],
    queryFn: () => getTipoGenero({ pagination: false }),
  });
};

export const useCrearTipoGenero = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTipoGenero
> => {
  return useMutation({
    mutationFn: (data: CreateTipoGenero) => createTipoGenero(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipo-genero"] });
    },
    onError: (error) => {
      console.log(error);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipo-genero"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
