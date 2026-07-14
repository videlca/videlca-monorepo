import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";
import type { CreateObservacionGrupoOrdenServicioDto, UpdateObservacionGrupoOrdenServicioDto } from "../../dtos";
import type { ObservacionGrupoOrdenServicio } from "../../types/orden-servicio";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import { createObservacionGrupoOrdenServicio, deleteObservacionGrupoOrdenServicio, getObservacionesGrupoOrdenServicio, updateObservacionGrupoOrdenServicio } from "../../functions/orden-servicio/observaciones-grupo";

export const useCreateObservacionGrupoOrdenServicio = (): UseMutationResult<ApiResponse<ObservacionGrupoOrdenServicio>, Error, CreateObservacionGrupoOrdenServicioDto> => {
  return useMutation({
    mutationFn: (data: CreateObservacionGrupoOrdenServicioDto) => createObservacionGrupoOrdenServicio(data),
    onSuccess: (data, variables) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Observación agregada correctamente");
        // Invalidate the specific query for this orden servicio
        queryClient.invalidateQueries({
          queryKey: ["observaciones-grupo-orden-servicio", variables.idGrupoOrdenServicio],
        });
        // Also invalidate the general list to refresh any other views
        queryClient.invalidateQueries({
          queryKey: ["observaciones-grupo-orden-servicio"],
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

export const useGetObservacionesGrupoOrdenServicio = (idGrupoOrdenServicio: number): UseQueryResult<ApiResponse<PaginatedResponse<ObservacionGrupoOrdenServicio[]>>, Error> => {
  return useQuery({
    queryKey: ["observaciones-grupo-orden-servicio", idGrupoOrdenServicio],
    queryFn: () => getObservacionesGrupoOrdenServicio(idGrupoOrdenServicio),
    // enabled sirve para que no se ejecute la query si el idGrupoOrdenServicio es 0
    enabled: !!idGrupoOrdenServicio,
  });
}

export const useUpdateObservacionGrupoOrdenServicio = (): UseMutationResult<ApiResponse<ObservacionGrupoOrdenServicio>, Error, { idGrupoOrdenServicio: number, data: UpdateObservacionGrupoOrdenServicioDto }> => {
  return useMutation({
    mutationFn: ({ idGrupoOrdenServicio, data }: { idGrupoOrdenServicio: number, data: UpdateObservacionGrupoOrdenServicioDto }) => updateObservacionGrupoOrdenServicio(idGrupoOrdenServicio, data),
    onSuccess: (data, variables) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Observación actualizada correctamente");
        // Invalidate the specific query for this orden servicio
        queryClient.invalidateQueries({
          queryKey: ["observaciones-grupo-orden-servicio", variables.idGrupoOrdenServicio],
        });
        // Also invalidate the general list to refresh any other views
        queryClient.invalidateQueries({
          queryKey: ["observaciones-grupo-orden-servicio"],
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

export const useDeleteObservacionGrupoOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, { idGrupoOrdenServicio: number }> => {
  return useMutation({
    mutationFn: ({ idGrupoOrdenServicio }: { idGrupoOrdenServicio: number }) => deleteObservacionGrupoOrdenServicio(idGrupoOrdenServicio),
    onSuccess: (data, variables) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Observación eliminada correctamente");
        // Invalidate the specific query for this orden servicio
        queryClient.invalidateQueries({
          queryKey: ["observaciones-grupo-orden-servicio", variables.idGrupoOrdenServicio],
        });
        // Also invalidate the general list to refresh any other views
        queryClient.invalidateQueries({
          queryKey: ["observaciones-grupo-orden-servicio"],
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
