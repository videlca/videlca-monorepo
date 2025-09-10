import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createPosicion,
  deletePosicion,
  getPosicionById,
  getPosiciones,
  getPosicionesActivo,
  getPosicionesByCliente,
  updatePosicion,
} from "../../functions/clientes/posiciones";
import type { ApiResponse } from "../../types";
import type { Posicion } from "../../../types";
import { queryClient } from "../../../App";
import { toast } from "sonner";
import type { CreatePosicionDto, UpdatePosicionDto } from "../../dtos";

export const usePosiciones = (): UseQueryResult<
  ApiResponse<Posicion[]>,
  Error
> => {
  return useQuery({
    queryKey: ["posiciones"],
    queryFn: () => getPosiciones({ pagination: false }),
  });
};

export const usePosicionesByCliente = (
  idCliente: number,
): UseQueryResult<ApiResponse<Posicion[]>, Error> => {
  return useQuery({
    queryKey: ["posiciones-by-cliente"],
    queryFn: () => getPosicionesByCliente(idCliente, { pagination: false }),
  });
};
export const usePosicionById = (): UseMutationResult<
  ApiResponse<Posicion | null>,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => getPosicionById(id),
    onSuccess: (data, id) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.setQueryData(["posicion", id], data);
        toast.success("Posición obtenida exitosamente", {
          description: "La posición ha sido obtenida correctamente",
        });
      } else {
        throw new Error(data.message || "Error al obtener posición");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al obtener posición");
    },
  });
};

export const usePosicionesActivo = (): UseQueryResult<
  ApiResponse<Posicion[]>,
  Error
> => {
  return useQuery({
    queryKey: ["posiciones-activo"],
    queryFn: () => getPosicionesActivo({ pagination: false }),
  });
};

export const useCreatePosicion = (): UseMutationResult<
  ApiResponse,
  Error,
  CreatePosicionDto
> => {
  return useMutation({
    mutationFn: (data: CreatePosicionDto) => createPosicion(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["posiciones"] });
        toast.success("Posición creada exitosamente", {
          description: "La posición ha sido creada correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear posición");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear posición");
    },
  });
};

export const useUpdatePosicion = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdatePosicionDto }
> => {
  return useMutation({
    mutationFn: (data: { id: number; data: UpdatePosicionDto }) =>
      updatePosicion(data.id, data.data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201 || data.status === 204) {
        queryClient.invalidateQueries({ queryKey: ["posiciones"] });
        queryClient.invalidateQueries({
          queryKey: ["posiciones-by-cliente"],
        });
        toast.success("Posición actualizada exitosamente", {
          description: "La posición ha sido actualizada correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar posición");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar posición");
    },
  });
};

export const useDeletePosicion = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => deletePosicion(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["posiciones"] });
        toast.success("Posición eliminada exitosamente", {
          description: "La posición ha sido eliminada correctamente",
        });
      } else {
        throw new Error(data.message || "Error al eliminar posición");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar posición");
    },
  });
};
