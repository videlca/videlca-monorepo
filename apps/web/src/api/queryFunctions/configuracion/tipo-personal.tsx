import { useMutation, useQuery } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import {
  createTipoPersonal,
  getTipoPersonal,
  updateTipoPersonal,
} from "../../functions/configuracion/tipo-personal";
import type { ApiResponse } from "../../types/common";
import type { TipoPersonal } from "../../../types";
import type { CreateTipoPersonal } from "../../types";
import { queryClient } from "../../../App";
import type { UpdateTipoPersonalDto } from "../../dtos";

export const useTipoPersonal = (): UseQueryResult<
  ApiResponse<TipoPersonal[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-personal"],
    queryFn: () => getTipoPersonal({ pagination: false }),
  });
};

export const useCrearTipoPersonal = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTipoPersonal
> => {
  return useMutation({
    mutationFn: (data: CreateTipoPersonal) => createTipoPersonal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipo-personal"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};

export const useActualizarTipoPersonal = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateTipoPersonalDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoPersonalDto }) =>
      updateTipoPersonal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipo-personal"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
