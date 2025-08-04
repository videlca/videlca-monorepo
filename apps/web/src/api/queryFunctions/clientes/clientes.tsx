import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createCliente,
  deleteCliente,
  getClienteById,
  getClientes,
  getClientesActivo,
  updateCliente,
} from "../../functions/clientes/clientes";
import type { ApiResponse } from "../../types";
import type { Cliente } from "../../../types";
import type { CreateClienteDto, UpdateClienteDto } from "../../dtos/clientes";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useClientes = (): UseQueryResult<
  ApiResponse<Cliente[]>,
  Error
> => {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: () => getClientes({ pagination: false }),
  });
};

export const useClienteById = (): UseMutationResult<
  ApiResponse<Cliente | null>,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => getClienteById(id),
    onSuccess: (data, id) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.setQueryData(["cliente", id], data.data);
      } else {
        throw new Error(data.message || "Error al obtener cliente");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al obtener cliente");
    },
  });
};

export const useClientesActivo = (): UseQueryResult<
  ApiResponse<Cliente[]>,
  Error
> => {
  return useQuery({
    queryKey: ["clientes-activo"],
    queryFn: () => getClientesActivo({ pagination: false }),
  });
};

export const useCreateCliente = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateClienteDto
> => {
  return useMutation({
    mutationFn: (data: CreateClienteDto) => createCliente(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["clientes"] });
        toast.success("Cliente creado exitosamente", {
          description: "El cliente ha sido creado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear cliente");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear cliente");
    },
  });
};

export const useUpdateCliente = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateClienteDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClienteDto }) =>
      updateCliente(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["clientes"] });
        toast.success("Cliente actualizado exitosamente", {
          description: "El cliente ha sido actualizado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar cliente");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar cliente");
    },
  });
};

export const useDeleteCliente = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationFn: (id: number) => deleteCliente(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["clientes"] });
        toast.success("Cliente eliminado exitosamente", {
          description: "El cliente ha sido eliminado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al eliminar cliente");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar cliente");
    },
  });
};
