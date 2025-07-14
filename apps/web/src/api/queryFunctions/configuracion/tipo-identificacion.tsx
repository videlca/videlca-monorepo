import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTipoIdentificacion,
  getTipoIdentificacion,
  updateTipoIdentificacion,
} from "../../functions/configuracion/";
import type { ApiResponse } from "../../types/common";
import type { TipoIdentificacion } from "../../../types";
import type {
  ActualizarTipoIdentificacion,
  CreateTipoIdentificacion,
} from "../../types";
import { queryClient } from "../../../App";

export const useTipoIdentificacion = (): UseQueryResult<
  ApiResponse<TipoIdentificacion[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-identificacion"],
    queryFn: () => getTipoIdentificacion({ pagination: false }),
  });
};

export const useCrearTipoIdentificacion = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTipoIdentificacion
> => {
  return useMutation({
    mutationFn: (data: CreateTipoIdentificacion) =>
      createTipoIdentificacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipo-identificacion"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};

export const useActualizarTipoIdentificacion = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: ActualizarTipoIdentificacion }
> => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: ActualizarTipoIdentificacion;
    }) => updateTipoIdentificacion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipo-identificacion"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
