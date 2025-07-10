import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createEstadoOrden,
  getEstadosOrden,
  updateEstadoOrden,
} from "../../functions/configuracion";
import type { CrearEstadoOrden } from "../../types";
import { queryClient } from "../../../App";
import type { UpdateEstadoOrdenDto } from "../../dtos";
import type { ApiResponse } from "../../types/common";
import type { TipoOrdenServicio } from "../../../types";

export const useEstadoOrden = (): UseQueryResult<
  ApiResponse<TipoOrdenServicio[]>,
  Error
> => {
  return useQuery({
    queryKey: ["estados-orden"],
    queryFn: () => getEstadosOrden({ pagination: false }),
  });
};

export const useCrearEstadoOrden = (): UseMutationResult<
  ApiResponse,
  Error,
  CrearEstadoOrden
> => {
  return useMutation({
    mutationFn: (data: CrearEstadoOrden) => createEstadoOrden(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estados-orden"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};

export const useActualizarEstadoOrden = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateEstadoOrdenDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEstadoOrdenDto }) =>
      updateEstadoOrden(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estados-orden"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
