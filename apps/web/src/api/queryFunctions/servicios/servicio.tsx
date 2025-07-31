import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createServicio,
  deleteServicio,
  getServicioById,
  getServicios,
  getServiciosActivo,
  getServiciosByPeriodo,
  updateServicio,
} from "../../functions/servicios";
import type { ApiResponse } from "../../types/common";
import type { Servicio } from "../../types/servicio";
import type { CreateServicioDto, UpdateServicioDto } from "../../dtos";
import { queryClient } from "../../../App";
import { toast } from "sonner";

export const useServicios = (): UseQueryResult<
  ApiResponse<Servicio[]>,
  Error
> => {
  return useQuery({
    queryKey: ["servicios"],
    queryFn: () => getServicios({ pagination: false }),
  });
};

export const useServiciosByPeriodo = (
  idPeriodo: number,
): UseQueryResult<ApiResponse<Servicio[]>, Error> => {
  return useQuery({
    queryKey: ["servicios-by-periodo", idPeriodo],
    queryFn: () => getServiciosByPeriodo(idPeriodo, { pagination: false }),
    // refetchOnMount: "always",
    // staleTime: 0,
  });
};

export const useServiciosActivo = (): UseQueryResult<
  ApiResponse<Servicio[]>,
  Error
> => {
  return useQuery({
    queryKey: ["servicios-activo"],
    queryFn: () => getServiciosActivo({ pagination: false }),
  });
};

export const useServicioById = (): UseMutationResult<
  ApiResponse<Servicio>,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["servicio-by-id"],
    mutationFn: (id: number) => getServicioById(id),
  });
};

export const useCreateServicio = (): UseMutationResult<
  ApiResponse<Servicio>,
  Error,
  CreateServicioDto
> => {
  return useMutation({
    mutationKey: ["create-servicio"],
    mutationFn: (data: CreateServicioDto) => createServicio(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Servicio creado correctamente");
        queryClient.invalidateQueries({ queryKey: ["servicios"] });
      } else {
        throw new Error(data.message || "Error al crear el servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear el servicio");
    },
  });
};

export const useUpdateServicio = (): UseMutationResult<
  ApiResponse<Servicio>,
  Error,
  { id: number; data: UpdateServicioDto }
> => {
  return useMutation({
    mutationKey: ["update-servicio"],
    mutationFn: ({ id, data }: { id: number; data: UpdateServicioDto }) =>
      updateServicio(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Servicio actualizado correctamente");
        queryClient.invalidateQueries({ queryKey: ["servicios"] });
      } else {
        throw new Error(data.message || "Error al actualizar el servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar el servicio");
    },
  });
};

export const useDeleteServicio = (): UseMutationResult<
  ApiResponse<Servicio>,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["delete-servicio"],
    mutationFn: (id: number) => deleteServicio(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Servicio eliminado correctamente");
        queryClient.invalidateQueries({ queryKey: ["servicios"] });
      } else {
        throw new Error(data.message || "Error al eliminar el servicio");
      }
    },
  });
};
