import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { anularOrdenServicioId, deleteIdOrdenServicio, getIdsAnuladosOrdenServicio, getIdsOrdenServicio, getNextIdOrdenServicio, updateIdOrdenServicio } from "../../functions/orden-servicio/orden-servicio-id";
import type { ApiResponse } from "../../types";
import type { OrdenServicioId, OrdenServicioIdAnulados } from "../../types/orden-servicio";
import type { AnularIdOrdenServicioDto, UpdateOrdenServicioIdDto } from "../../dtos";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useGetIdsOrdenServicio = (): UseQueryResult<ApiResponse<OrdenServicioId[]>, Error> => {
  return useQuery({
    queryKey: ["ids-orden-servicio"],
    queryFn: () => getIdsOrdenServicio({ pagination: false }),
  });
}

export const useGetIdsAnuladosOrdenServicio = (): UseQueryResult<ApiResponse<OrdenServicioIdAnulados[]>, Error> => {
  return useQuery({
    queryKey: ["ids-anulados-orden-servicio"],
    queryFn: () => getIdsAnuladosOrdenServicio({ pagination: false }),
  });
}

export const useUpdateIdOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, { id: number, data: UpdateOrdenServicioIdDto }> => {
  return useMutation({
    mutationFn: ({ id, data }) => updateIdOrdenServicio(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Identificador de orden de servicio actualizado correctamente");
        queryClient.invalidateQueries({
          queryKey: ["ids-anulados-orden-servicio"],
        });
      } else {
        throw new Error(data.message || "Error al actualizar el identificador de orden de servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar el identificador de orden de servicio");
    },
  });
}

// Anular identificador orden servicio
export const useAnularIdOrdenServicio = (): UseMutationResult<ApiResponse<OrdenServicioId>, Error, AnularIdOrdenServicioDto> => {
  return useMutation({
    mutationKey: ["anular-id-orden-servicio"],
    mutationFn: anularOrdenServicioId,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Identificador de orden de servicio anulado correctamente");
        queryClient.invalidateQueries({
          queryKey: ["ids-anulados-orden-servicio"],
        });
      } else {
        throw new Error(data.message || "Error al anular el identificador de la orden de servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al anular el identificador de la orden de servicio");
    },
  });
}

export const useDeleteIdOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, { id: number }> => {
  return useMutation({
    mutationFn: ({ id }) => deleteIdOrdenServicio(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Identificador de orden de servicio eliminado correctamente");
        queryClient.invalidateQueries({
          queryKey: ["ids-anulados-orden-servicio"],
        });
      } else {
        throw new Error(data.message || "Error al eliminar el identificador de orden de servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar el identificador de orden de servicio");
    },
  });
}

export const useGetNextIdOrdenServicio = (): UseQueryResult<ApiResponse<number>, Error> => {
  return useQuery({
    queryKey: ["next-id-orden-servicio"],
    queryFn: () => getNextIdOrdenServicio(),
  });
}