import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { anularOrdenServicioId, deleteIdOrdenServicio, getIdsAnuladosOrdenServicio, getIdsOrdenServicio, getNextIdOrdenServicio, updateIdOrdenServicio } from "../../functions/orden-servicio/orden-servicio-id";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { OrdenServicioId, OrdenServicioIdAnulados } from "../../types/orden-servicio";
import type { AnularIdOrdenServicioDto, UpdateOrdenServicioIdDto, PaginationDto } from "../../dtos";
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
    mutationFn: async ({ id, data }) => {
      const response = await updateIdOrdenServicio(id, data);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.message || "Error al actualizar el identificador de orden de servicio");
      }
      return response;
    },
    onSuccess: () => {
      toast.success("Identificador de orden de servicio actualizado correctamente");
      queryClient.invalidateQueries({
        queryKey: ["ids-anulados-orden-servicio"],
      });
      queryClient.invalidateQueries({
        queryKey: ["ids-orden-servicio"],
      });
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
    mutationFn: async (data) => {
      const response = await anularOrdenServicioId(data);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.message || "Error al anular el identificador de la orden de servicio");
      }
      return response;
    },
    onSuccess: () => {
      toast.success("Identificador de orden de servicio anulado correctamente");
      queryClient.invalidateQueries({
        queryKey: ["ids-anulados-orden-servicio"],
      });
      queryClient.invalidateQueries({
        queryKey: ["ids-orden-servicio"],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Error al anular el identificador de la orden de servicio");
    },
  });
}

export const useDeleteIdOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, { id: number }> => {
  return useMutation({
    mutationFn: async ({ id }) => {
      const response = await deleteIdOrdenServicio(id);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.message || "Error al eliminar el identificador de orden de servicio");
      }
      return response;
    },
    onSuccess: () => {
      toast.success("Identificador de orden de servicio eliminado correctamente");
      queryClient.invalidateQueries({
        queryKey: ["ids-anulados-orden-servicio"],
      });
      queryClient.invalidateQueries({
        queryKey: ["ids-orden-servicio"],
      });
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