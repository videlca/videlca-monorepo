import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { createObservacionOrdenServicio, deleteObservacionOrdenServicio, getObservacionesOrdenServicio, updateObservacionOrdenServicio } from "../../functions/orden-servicio/observaciones";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";
import type { CreateObservacionOrdenServicioDto, UpdateObservacionOrdenServicioDto } from "../../dtos";
import type { ObservacionOrdenServicio } from "../../types/orden-servicio";
import type { ApiResponse , PaginatedResponse } from "../../types/common";

export const useCreateObservacionOrdenServicio = (): UseMutationResult<ApiResponse<ObservacionOrdenServicio>, Error, CreateObservacionOrdenServicioDto> => {
  return useMutation({
    mutationFn: (data: CreateObservacionOrdenServicioDto) => createObservacionOrdenServicio(data),
    onSuccess: (data, variables) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Observación agregada correctamente");
        // Invalidate the specific query for this orden servicio
        queryClient.invalidateQueries({
          queryKey: ["observaciones-orden-servicio", variables.idOrdenServicio],
        });
        // Also invalidate the general list to refresh any other views
        queryClient.invalidateQueries({
          queryKey: ["observaciones-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al agregar la observación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al agregar la observación");
    },
  });
}

export const useGetObservacionesOrdenServicio = (idOrdenServicio: number): UseQueryResult<ApiResponse<PaginatedResponse<ObservacionOrdenServicio[]>>, Error> => {
  return useQuery({
    queryKey: ["observaciones-orden-servicio", idOrdenServicio],
    queryFn: () => getObservacionesOrdenServicio(idOrdenServicio),
    // enabled sirve para que no se ejecute la query si el idOrdenServicio es 0
    enabled: !!idOrdenServicio,
  });
}

export const useUpdateObservacionOrdenServicio = (): UseMutationResult<ApiResponse<ObservacionOrdenServicio>, Error, { id: number, data: UpdateObservacionOrdenServicioDto, idOrdenServicio: number }> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateObservacionOrdenServicioDto, idOrdenServicio: number }) => updateObservacionOrdenServicio(id, data),
    onSuccess: (data, variables) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Observación actualizada correctamente");
        // Invalidate the specific query for this orden servicio
        queryClient.invalidateQueries({
          queryKey: ["observaciones-orden-servicio", variables.idOrdenServicio],
        });
        // Also invalidate the general list to refresh any other views
        queryClient.invalidateQueries({
          queryKey: ["observaciones-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al actualizar la observación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar la observación");
    },
  });
}

export const useDeleteObservacionOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, { id: number, idOrdenServicio: number }> => {
  return useMutation({
    mutationFn: ({ id }: { id: number, idOrdenServicio: number }) => deleteObservacionOrdenServicio(id),
    onSuccess: (data, variables) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Observación eliminada correctamente");
        // Invalidate the specific query for this orden servicio
        queryClient.invalidateQueries({
          queryKey: ["observaciones-orden-servicio", variables.idOrdenServicio],
        });
        // Also invalidate the general list to refresh any other views
        queryClient.invalidateQueries({
          queryKey: ["observaciones-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al eliminar la observación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar la observación");
    },
  });
}
