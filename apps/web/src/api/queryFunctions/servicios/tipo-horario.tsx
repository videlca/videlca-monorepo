import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTipoHorario,
  deleteTipoHorario,
  getTipoHorarioById,
  getTipoHorarios,
  updateTipoHorario,
} from "../../functions/servicios";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { TipoHorario } from "../../types/servicio";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import type { CreateTipoHorarioDto, UpdateTipoHorarioDto } from "../../dtos";
import { queryClient } from "../../../App";

export const useTipoHorarios = (): UseQueryResult<
  ApiResponse<PaginatedResponse<TipoHorario[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-horarios"],
    queryFn: () => getTipoHorarios({ pagination: 'false' }),
  });
};

export const useTipoHorariosById = (): UseMutationResult<
  ApiResponse<TipoHorario>,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["tipo-horarios-by-id"],
    mutationFn: (id: number) => getTipoHorarioById(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tipo horario obtenido correctamente");
      } else {
        showErrorToast(data.message, "Error al obtener el tipo horario");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al obtener el tipo horario");
    },
  });
};

export const useCreateTipoHorario = (): UseMutationResult<
  ApiResponse<TipoHorario>,
  Error,
  CreateTipoHorarioDto
> => {
  return useMutation({
    mutationKey: ["create-tipo-horario"],
    mutationFn: (data: CreateTipoHorarioDto) => createTipoHorario(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201 || data.status === 204) {
        toast.success("Tipo horario creado correctamente");
        queryClient.invalidateQueries({ queryKey: ["tipo-horarios"] });
      } else {
        showErrorToast(data.message, "Error al crear el tipo horario");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear el tipo horario");
    },
  });
};

export const useUpdateTipoHorario = (): UseMutationResult<
  ApiResponse<TipoHorario>,
  Error,
  { id: number; data: UpdateTipoHorarioDto }
> => {
  return useMutation({
    mutationKey: ["update-tipo-horario"],
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoHorarioDto }) =>
      updateTipoHorario(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tipo horario actualizado correctamente");
        queryClient.invalidateQueries({ queryKey: ["tipo-horarios"] });
      } else {
        showErrorToast(data.message, "Error al actualizar el tipo horario");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar el tipo horario");
    },
  });
};

export const useDeleteTipoHorario = (): UseMutationResult<
  ApiResponse<TipoHorario>,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["delete-tipo-horario"],
    mutationFn: (id: number) => deleteTipoHorario(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tipo horario eliminado correctamente");
        queryClient.invalidateQueries({ queryKey: ["tipo-horarios"] });
      } else {
        showErrorToast(data.message, "Error al eliminar el tipo horario");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar el tipo horario");
    },
  });
};
