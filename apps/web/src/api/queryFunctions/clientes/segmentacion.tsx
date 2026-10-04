import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createSegmentacion,
  createSubSegmentacion,
  deleteSegmentacion,
  deleteSubSegmentacion,
  getSegmentacionById,
  getSegmentaciones,
  getSubSegmentaciones,
  updateSegmentacion,
  updateSubSegmentacion,
} from "../../functions/clientes/segmentacion";
import type {
  CreateSegmentacionDto,
  CreateSubSegmentacionDto,
  UpdateSegmentacionDto,
} from "../../dtos";
import { queryClient } from "../../../App";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { Segmentacion, SubSegmentacion } from "../../../types";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";

export const useSegmentaciones = (): UseQueryResult<
  ApiResponse<PaginatedResponse<Segmentacion[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["segmentaciones"],
    queryFn: () => getSegmentaciones({ pagination: 'false' }),
  });
};

export const useSegmentacionById = (): UseMutationResult<
  ApiResponse<Segmentacion>,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => getSegmentacionById(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
        toast.success("Segmentación obtenida exitosamente", {
          description: "La segmentación ha sido obtenida correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al obtener segmentación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al obtener segmentación");
    },
  });
};

export const useCrearSegmentacion = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateSegmentacionDto
> => {
  return useMutation({
    mutationFn: (data: CreateSegmentacionDto) => createSegmentacion(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
        toast.success("Segmentación creada exitosamente", {
          description: "La segmentación ha sido creada correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al crear segmentación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear segmentación");
    },
  });
};

export const useActualizarSegmentacion = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateSegmentacionDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSegmentacionDto }) =>
      updateSegmentacion(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
        toast.success("Segmentación actualizada exitosamente", {
          description: "La segmentación ha sido actualizada correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al actualizar segmentación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar segmentación");
    },
  });
};

export const useEliminarSegmentacion = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => deleteSegmentacion(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
        toast.success("Segmentación eliminada exitosamente", {
          description: "La segmentación ha sido eliminada correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al eliminar segmentación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar segmentación");
    },
  });
};

// Subsegmentaciones
export const useSubSegmentaciones = (): UseQueryResult<
  ApiResponse<PaginatedResponse<SubSegmentacion[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["subsegmentaciones"],
    queryFn: () => getSubSegmentaciones({ pagination: 'false' }),
  });
};

export const useCrearSubSegmentacion = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: CreateSubSegmentacionDto }
> => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: CreateSubSegmentacionDto;
    }) => createSubSegmentacion(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
        toast.success("Subsegmentación creada exitosamente", {
          description: "La subsegmentación ha sido creada correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al crear subsegmentación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear subsegmentación");
    },
  });
};

export const useActualizarSubSegmentacion = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: { descripcion?: string; estado?: boolean } }
> => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { descripcion?: string; estado?: boolean };
    }) => updateSubSegmentacion(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
        toast.success("Subsegmentación actualizada exitosamente", {
          description: "La subsegmentación ha sido actualizada correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al actualizar subsegmentación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar subsegmentación");
    },
  });
};

export const useEliminarSubSegmentacion = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => deleteSubSegmentacion(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["segmentaciones"] });
        toast.success("Subsegmentación eliminada exitosamente", {
          description: "La subsegmentación ha sido eliminada correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al eliminar subsegmentación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar subsegmentación");
    },
  });
};
