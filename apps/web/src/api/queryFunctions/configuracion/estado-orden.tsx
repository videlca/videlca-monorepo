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
import { queryClient } from "../../../App";
import type { CreateEstadoOrdenDto, UpdateEstadoOrdenDto } from "../../dtos";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { EstadoOrden } from "../../../types";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";

export const useEstadoOrden = (): UseQueryResult<
  ApiResponse<PaginatedResponse<EstadoOrden[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["estados-orden"],
    queryFn: () => getEstadosOrden({ pagination: 'false' }),
  });
};

export const useCrearEstadoOrden = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateEstadoOrdenDto
> => {
  return useMutation({
    mutationFn: (data: CreateEstadoOrdenDto) => createEstadoOrden(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["estados-orden"] });
        toast.success("Estado de orden creado exitosamente", {
          description: "El estado de orden ha sido creado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al crear estado de orden");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear estado de orden");
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
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["estados-orden"] });
        toast.success("Estado de orden actualizado exitosamente", {
          description: "El estado de orden ha sido actualizado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al actualizar estado de orden");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar estado de orden");
    },
  });
};
