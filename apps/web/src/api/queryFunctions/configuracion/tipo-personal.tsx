import { useMutation, useQuery } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import {
  createTipoPersonal,
  getTipoPersonal,
  getTipoPersonalActivo,
  updateTipoPersonal,
} from "../../functions/configuracion/tipo-personal";
import type { ApiResponse } from "../../types/common";
import type { TipoPersonal } from "../../../types";
import type { CreateTipoPersonal } from "../../types";
import { queryClient } from "../../../App";
import type { UpdateTipoPersonalDto } from "../../dtos";
import { toast } from "sonner";

export const useTipoPersonal = (): UseQueryResult<
  ApiResponse<TipoPersonal[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-personal"],
    queryFn: () => getTipoPersonal(),
  });
};

export const useTipoPersonalActivo = (): UseQueryResult<
  ApiResponse<TipoPersonal[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-personal-activo"],
    queryFn: () => getTipoPersonalActivo(),
  });
};

export const useCrearTipoPersonal = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTipoPersonal
> => {
  return useMutation({
    mutationFn: (data: CreateTipoPersonal) => createTipoPersonal(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-personal"] });
        toast.success("Tipo de personal creado exitosamente", {
          description: "El tipo de personal ha sido creado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear tipo de personal");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear tipo de personal");
    },
  });
};

export const useActualizarTipoPersonal = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateTipoPersonalDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoPersonalDto }) =>
      updateTipoPersonal(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-personal"] });
        toast.success("Tipo de personal actualizado exitosamente", {
          description: "El tipo de personal ha sido actualizado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar tipo de personal");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar tipo de personal");
    },
  });
};
