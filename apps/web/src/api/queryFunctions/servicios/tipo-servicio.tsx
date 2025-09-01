import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTipoServicio,
  deleteTipoServicio,
  getPrefijosTipoServicio,
  getTipoServicioById,
  getTipoServicios,
  getTipoServiciosActivo,
  updateTipoServicio,
} from "../../functions/servicios";
import type { TipoServicio } from "../../types/servicio";
import type { ApiResponse } from "../../types/common";
import { toast } from "sonner";
import { queryClient } from "../../../App";
import type { CreateTipoServicioDto, UpdateTipoServicioDto } from "../../dtos";

export const useTipoServicios = (): UseQueryResult<
  ApiResponse<TipoServicio[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-servicios"],
    queryFn: () => getTipoServicios({ pagination: false }),
  });
};

export const useTipoServiciosActivo = (): UseQueryResult<
  ApiResponse<TipoServicio[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-servicios-activo"],
    queryFn: () => getTipoServiciosActivo({ pagination: false }),
  });
};

export const usePrefijosTipoServicio = (): UseQueryResult<
  ApiResponse<{ idTipoServicio: number; prefijo: string }[]>,
  Error
> => {
  return useQuery({
    queryKey: ["prefijos-tipo-servicio"],
    queryFn: () => getPrefijosTipoServicio({ pagination: false }),
  });
};

export const useTipoServiciosById = (): UseMutationResult<
  ApiResponse<TipoServicio>,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["tipo-servicios-by-id"],
    mutationFn: (id: number) => getTipoServicioById(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tipo servicio obtenido correctamente");
      } else {
        throw new Error(data.message || "Error al obtener el tipo servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al obtener el tipo servicio");
    },
  });
};

export const useCreateTipoServicio = (): UseMutationResult<
  ApiResponse<TipoServicio>,
  Error,
  CreateTipoServicioDto
> => {
  return useMutation({
    mutationKey: ["create-tipo-servicio"],
    mutationFn: (data: CreateTipoServicioDto) => createTipoServicio(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tipo servicio creado correctamente");
        queryClient.invalidateQueries({ queryKey: ["tipo-servicios"] });
      } else {
        throw new Error(data.message || "Error al crear el tipo servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear el tipo servicio");
    },
  });
};

export const useUpdateTipoServicio = (): UseMutationResult<
  ApiResponse<TipoServicio>,
  Error,
  { id: number; data: UpdateTipoServicioDto }
> => {
  return useMutation({
    mutationKey: ["update-tipo-servicio"],
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoServicioDto }) =>
      updateTipoServicio(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tipo servicio actualizado correctamente");
        queryClient.invalidateQueries({ queryKey: ["tipo-servicios"] });
      } else {
        throw new Error(data.message || "Error al actualizar el tipo servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar el tipo servicio");
    },
  });
};

export const useDeleteTipoServicio = (): UseMutationResult<
  ApiResponse<TipoServicio>,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["delete-tipo-servicio"],
    mutationFn: (id: number) => deleteTipoServicio(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tipo servicio eliminado correctamente");
        queryClient.invalidateQueries({ queryKey: ["tipo-servicios"] });
      } else {
        throw new Error(data.message || "Error al eliminar el tipo servicio");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar el tipo servicio");
    },
  });
};
