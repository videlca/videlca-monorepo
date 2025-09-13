import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createPuesto,
  deletePuesto,
  getPuestoById,
  getPuestos,
  getPuestosActivo,
  getPuestosByCliente,
  updatePuesto,
} from "../../functions/clientes/puestos";
import type { ApiResponse } from "../../types";
import type { Puesto } from "../../../types";
import { queryClient } from "../../../App";
import { toast } from "sonner";
import type { CreatePuestoDto, UpdatePuestoDto } from "../../dtos";

export const usePuestos = (): UseQueryResult<ApiResponse<Puesto[]>, Error> => {
  return useQuery({
    queryKey: ["puestos"],
    queryFn: () => getPuestos({ pagination: false }),
  });
};

export const usePuestosByCliente = (
  idCliente: number,
): UseQueryResult<ApiResponse<Puesto[]>, Error> => {
  return useQuery({
    queryKey: ["puestos-by-cliente"],
    queryFn: () => getPuestosByCliente(idCliente, { pagination: false }),
  });
};
export const usePuestoById = (): UseMutationResult<
  ApiResponse<Puesto | null>,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => getPuestoById(id),
    onSuccess: (data, id) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.setQueryData(["puesto", id], data);
        toast.success("Puesto obtenido exitosamente", {
          description: "El puesto ha sido obtenido correctamente",
        });
      } else {
        throw new Error(data.message || "Error al obtener puesto");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al obtener puesto");
    },
  });
};

export const usePuestosActivo = (): UseQueryResult<
  ApiResponse<Puesto[]>,
  Error
> => {
  return useQuery({
    queryKey: ["puestos-activo"],
    queryFn: () => getPuestosActivo({ pagination: false }),
  });
};

export const useCreatePuesto = (): UseMutationResult<
  ApiResponse,
  Error,
  CreatePuestoDto
> => {
  return useMutation({
    mutationFn: (data: CreatePuestoDto) => createPuesto(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["puestos"] });
        toast.success("Puesto creado exitosamente", {
          description: "El puesto ha sido creado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear puesto");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear puesto");
    },
  });
};

export const useUpdatePuesto = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdatePuestoDto }
> => {
  return useMutation({
    mutationFn: (data: { id: number; data: UpdatePuestoDto }) =>
      updatePuesto(data.id, data.data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201 || data.status === 204) {
        queryClient.invalidateQueries({ queryKey: ["puestos"] });
        queryClient.invalidateQueries({
          queryKey: ["puestos-by-cliente"],
        });
        toast.success("Puesto actualizado exitosamente", {
          description: "El puesto ha sido actualizado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar puesto");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar puesto");
    },
  });
};

export const useDeletePuesto = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => deletePuesto(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["puestos"] });
        toast.success("Puesto eliminado exitosamente", {
          description: "El puesto ha sido eliminado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al eliminar puesto");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar puesto");
    },
  });
};
