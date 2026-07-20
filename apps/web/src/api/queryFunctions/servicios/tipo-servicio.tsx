import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTipoServicio,
  deleteTipoServicio,
  getFilteredTipoServicios,
  getPrefijosTipoServicio,
  getTipoServicioById,
  getTipoServicios,
  getTipoServiciosActivo,
  updateTipoServicio,
} from "../../functions/servicios";
import type { TipoServicio } from "../../types/servicio";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";
import type { CreateTipoServicioDto, UpdateTipoServicioDto, FilterTipoServicioDto } from "../../dtos";
import type { PaginationDto } from "../../dtos/common";

export const useTipoServicios = (
  paginationParams: PaginationDto = { pagination: "false" }
): UseQueryResult<ApiResponse<PaginatedResponse<TipoServicio[]>>, Error> => {
  return useQuery({
    queryKey: ["tipo-servicios", paginationParams],
    queryFn: () => getTipoServicios(paginationParams),
  });
};

export const useTipoServiciosActivo = (): UseQueryResult<
  ApiResponse<PaginatedResponse<TipoServicio[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-servicios-activo"],
    queryFn: () => getTipoServiciosActivo({ pagination: "false" }),
  });
};

export const usePrefijosTipoServicio = (): UseQueryResult<
  ApiResponse<{ idTipoServicio: number; prefijo: string }[]>,
  Error
> => {
  return useQuery({
    queryKey: ["prefijos-tipo-servicio"],
    queryFn: () => getPrefijosTipoServicio({ pagination: "false" }),
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
        showErrorToast(data.message, "Error al obtener el tipo servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al obtener el tipo servicio");
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
        showErrorToast(data.message, "Error al crear el tipo servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear el tipo servicio");
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
        showErrorToast(data.message, "Error al actualizar el tipo servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar el tipo servicio");
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
        showErrorToast(data.message, "Error al eliminar el tipo servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar el tipo servicio");
    },
  });
};

export const useFilterTipoServicio = (): UseMutationResult<
  ApiResponse<PaginatedResponse<TipoServicio[]>>,
  Error,
  FilterTipoServicioDto
> => {
  return useMutation({
    mutationFn: (filter: FilterTipoServicioDto) => getFilteredTipoServicios(filter),
    onError: (error) => {
      showErrorToast(error.message, "Error al filtrar tipos de servicio");
    },
  });
};
