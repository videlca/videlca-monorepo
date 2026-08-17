import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { anularOrdenServicioId, deleteIdOrdenServicio, getIdsAnuladosOrdenServicio, getIdsOrdenServicio, getNextIdOrdenServicio, updateIdOrdenServicio } from "../../functions/orden-servicio/orden-servicio-id";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import type { OrdenServicioId, OrdenServicioIdAnulados } from "../../types/orden-servicio";
import type { AnularIdOrdenServicioDto, UpdateOrdenServicioIdDto, PaginationDto } from "../../dtos";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useGetIdsOrdenServicio = (paginationParams: PaginationDto = { pagination: 'false' }): UseQueryResult<ApiResponse<PaginatedResponse<OrdenServicioId[]>>, Error> => {
  return useQuery({
    queryKey: ["ids-orden-servicio", paginationParams],
    queryFn: () => getIdsOrdenServicio(paginationParams),
  });
}

export const useGetIdsAnuladosOrdenServicio = (paginationParams: PaginationDto = { pagination: 'false' }): UseQueryResult<ApiResponse<PaginatedResponse<OrdenServicioIdAnulados[]>>, Error> => {
  return useQuery({
    queryKey: ["ids-anulados-orden-servicio", paginationParams],
    queryFn: () => getIdsAnuladosOrdenServicio(paginationParams),
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
        queryClient.invalidateQueries({
          queryKey: ["ids-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al actualizar el identificador de orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar el identificador de orden de servicio");
    },
  });
}

// Anular identificador orden servicio
export const useAnularIdOrdenServicio = (): UseMutationResult<ApiResponse<OrdenServicioId>, Error, AnularIdOrdenServicioDto> => {
  return useMutation({
    mutationKey: ["anular-id-orden-servicio"],
    mutationFn: (data) => anularOrdenServicioId(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Identificador de orden de servicio anulado correctamente");
        queryClient.invalidateQueries({
          queryKey: ["ids-anulados-orden-servicio"],
        });
        queryClient.invalidateQueries({
          queryKey: ["ids-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al anular el identificador de la orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al anular el identificador de la orden de servicio");
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
        queryClient.invalidateQueries({
          queryKey: ["ids-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al eliminar el identificador de orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar el identificador de orden de servicio");
    },
  });
}

export const useGetNextIdOrdenServicio = (): UseQueryResult<ApiResponse<number>, Error> => {
  return useQuery({
    queryKey: ["next-id-orden-servicio"],
    queryFn: () => getNextIdOrdenServicio(),
  });
}