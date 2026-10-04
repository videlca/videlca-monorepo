import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createCliente,
  deleteCliente,
  descargarExcelClientes,
  enviarExcelClientes,
  getClienteById,
  getClientes,
  getClientesActivo,
  getFilteredClientes,
  updateCliente,
} from "../../functions/clientes/clientes";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import type { Cliente } from "../../../types";
import type { CreateClienteDto, FilterClienteDto, UpdateClienteDto } from "../../dtos/clientes";
import type { EnviarCorreoDto, PaginationDto } from "../../dtos/common";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useClientes = (paginationParams: PaginationDto = { pagination: 'false' }): UseQueryResult<
  ApiResponse<PaginatedResponse<Cliente[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["clientes", paginationParams],
    queryFn: () => getClientes(paginationParams),
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
        showErrorToast(data.message, "Error al obtener cliente");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al obtener cliente");
    },
  });
};

export const useClientesActivo = (paginationParams: PaginationDto = { pagination: 'false' }): UseQueryResult<
  ApiResponse<PaginatedResponse<Cliente[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["clientes-activo", paginationParams],
    queryFn: () => getClientesActivo(paginationParams),
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
        queryClient.invalidateQueries({ queryKey: ["clientes-activo"] });
        toast.success("Cliente creado exitosamente", {
          description: "El cliente ha sido creado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al crear cliente");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear cliente");
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
        queryClient.invalidateQueries({ queryKey: ["clientes-activo"] });
        toast.success("Cliente actualizado exitosamente", {
          description: "El cliente ha sido actualizado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al actualizar cliente");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar cliente");
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
        queryClient.invalidateQueries({ queryKey: ["clientes-activo"] });
        toast.success("Cliente eliminado exitosamente", {
          description: "El cliente ha sido eliminado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al eliminar cliente");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar cliente");
    },
  });
};

export const useDescargarExcelClientes = (): UseMutationResult<
  { blob: Blob; filename: string },
  Error,
  FilterClienteDto | undefined
> => {
  return useMutation({
    mutationFn: (filter?: FilterClienteDto) => descargarExcelClientes(filter),
    onSuccess: ({ blob, filename }) => {
      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Excel descargado correctamente");
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al descargar el Excel de clientes");
    },
  });
};

export const useEnviarExcelClientes = (): UseMutationResult<
  ApiResponse,
  Error,
  { data: EnviarCorreoDto, filter?: FilterClienteDto }
> => {
  return useMutation({
    mutationFn: ({ data, filter }: { data: EnviarCorreoDto, filter?: FilterClienteDto }) => enviarExcelClientes(data, filter),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Correo enviado correctamente", {
          description: "El Excel de clientes y puestos fue enviado al correo indicado",
        });
      } else {
        showErrorToast(data.message, "Error al enviar el correo");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al enviar el Excel de clientes por correo");
    },
  });
};

export const useFilterClientes = (): UseMutationResult<
  ApiResponse<PaginatedResponse<Cliente[]>>,
  Error,
  FilterClienteDto
> => {
  return useMutation({
    mutationFn: (filter: FilterClienteDto) => getFilteredClientes(filter),
    onError: (error) => {
      showErrorToast(error.message, "Error al filtrar clientes");
    },
  });
};
