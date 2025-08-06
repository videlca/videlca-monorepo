import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { createOrdenServicio, getOrdenesServicio, getOrdenServicioById, getPrecioOrdenServicio, validateHorariosOrdenServicio } from "../../functions/orden-servicio";
import type { CreateOrdenServicioDto, PaginationDto, PrecioOrdenDto, TercerPasoDto } from "../../dtos";
import type { OrdenServicio } from "../../types/orden-servicio";
import type { ApiResponse } from "../../types";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useCreateOrdenServicio = (): UseMutationResult<ApiResponse<OrdenServicio>, Error, CreateOrdenServicioDto> => {
  return useMutation({
    mutationFn: createOrdenServicio,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Orden de servicio creada correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
      } else {
        throw new Error(data.message || "Error al crear la orden de servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear la orden de servicio");
    },
  });
}

export const useGetOrdenesServicio = (): UseQueryResult<ApiResponse<OrdenServicio[]>, Error> => {
  return useQuery({
    queryKey: ["orden-servicio"],
    queryFn: () => getOrdenesServicio({ pagination: false }),
  });
}

export const useGetOrdenServicioById = (id: number): UseMutationResult<ApiResponse<OrdenServicio>, Error, number> => {
  return useMutation({
    mutationFn: (id: number) => getOrdenServicioById(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Orden de servicio obtenida correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio", id],
        });
      } else {
        throw new Error(data.message || "Error al obtener la orden de servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al obtener la orden de servicio");
    },
  });
}

export const useValidateHorariosOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, TercerPasoDto> => {
  return useMutation({
    mutationFn: validateHorariosOrdenServicio,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Horarios validados correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
      } else {
        throw new Error(data.message || "Error al validar los horarios");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al validar los horarios");
    },
  });
}

export const useGetPrecioOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, PrecioOrdenDto> => {
  return useMutation({
    mutationFn: getPrecioOrdenServicio,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Precio de orden de servicio obtenido correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
      } else {
        throw new Error(data.message || "Error al obtener el precio de la orden de servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al obtener el precio de la orden de servicio");
    },
  });
}