import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTipoCliente,
  getTipoCliente,
  updateTipoCliente,
} from "../../functions/configuracion";
import type { ApiResponse } from "../../types/common";
import type { TipoCliente } from "../../../types";
import type { ActualizarTipoCliente, CreateTipoCliente } from "../../types";
import { queryClient } from "../../../App";

export const useTipoCliente = (): UseQueryResult<
  ApiResponse<TipoCliente[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-cliente"],
    queryFn: () => getTipoCliente({ pagination: false }),
  });
};

export const useCrearTipoCliente = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTipoCliente
> => {
  return useMutation({
    mutationFn: (data: CreateTipoCliente) => createTipoCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipo-cliente"] });
    },
    onError: (error) => {
      console.log(error);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipo-cliente"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
