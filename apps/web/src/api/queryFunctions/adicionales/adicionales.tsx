import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  getAdicionales,
  getAdicionalById,
  getTiposAdicional,
  createAdicional,
  updateAdicional,
  cancelarAdicional,
  deleteAdicional,
} from "../../functions/adicionales/adicionales";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import type { Adicional, TipoAdicional } from "../../types/adicionales";
import type {
  CreateAdicionalDto,
  UpdateAdicionalDto,
  FindAdicionalesDto,
} from "../../dtos/adicionales";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useAdicionales = (
  params: FindAdicionalesDto = { pagination: "false" },
): UseQueryResult<ApiResponse<PaginatedResponse<Adicional[]>>, Error> => {
  return useQuery({
    queryKey: ["adicionales", params],
    queryFn: () => getAdicionales(params),
  });
};

// Tipos de adicional activos, para el dropdown al crear/editar un adicional
export const useTiposAdicional = (): UseQueryResult<ApiResponse<TipoAdicional[]>, Error> => {
  return useQuery({
    queryKey: ["tipos-adicional"],
    queryFn: () => getTiposAdicional(),
  });
};

export const useAdicionalById = (): UseMutationResult<
  ApiResponse<Adicional | null>,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => getAdicionalById(id),
    onError: (error) => {
      showErrorToast(error.message, "Error al obtener el adicional");
    },
  });
};

export const useCreateAdicional = (): UseMutationResult<
  ApiResponse<Adicional>,
  Error,
  CreateAdicionalDto
> => {
  return useMutation({
    mutationFn: (data: CreateAdicionalDto) => createAdicional(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["adicionales"] });
        toast.success("Adicional creado exitosamente", {
          description: "El adicional ha sido creado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al crear el adicional");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear el adicional");
    },
  });
};

export const useUpdateAdicional = (): UseMutationResult<
  ApiResponse<Adicional>,
  Error,
  { id: number; data: UpdateAdicionalDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAdicionalDto }) =>
      updateAdicional(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["adicionales"] });
        toast.success("Adicional actualizado exitosamente", {
          description: "El adicional ha sido actualizado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al actualizar el adicional");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar el adicional");
    },
  });
};

export const useCancelarAdicional = (): UseMutationResult<
  ApiResponse<Adicional>,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => cancelarAdicional(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["adicionales"] });
        toast.success("Adicional cancelado exitosamente", {
          description: "El adicional dejará de cobrarse desde este momento",
        });
      } else {
        showErrorToast(data.message, "Error al cancelar el adicional");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al cancelar el adicional");
    },
  });
};

export const useDeleteAdicional = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => deleteAdicional(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["adicionales"] });
        toast.success("Adicional eliminado exitosamente", {
          description: "El adicional ha sido eliminado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al eliminar el adicional");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar el adicional");
    },
  });
};
