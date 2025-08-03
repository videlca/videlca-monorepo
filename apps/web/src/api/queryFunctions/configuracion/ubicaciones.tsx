import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createCiudad,
  createDepartamento,
  createPais,
  deleteCiudad,
  deleteDepartamento,
  getCiudad,
  getCiudadActiva,
  getDepartamento,
  getPais,
  updateCiudad,
  updateDepartamento,
  updatePais,
} from "../../functions/configuracion/";
import type { ApiResponse } from "../../types/common";
import type { Ciudad, Departamento, Pais } from "../../../types";
import { queryClient } from "../../../App";
import type {
  CreateDepartamentoDto,
  CreatePaisDto,
  CreateCiudadDto,
  UpdateDepartamentoDto,
  UpdatePaisDto,
  UpdateCiudadDto,
} from "../../dtos/configuracion";
import { toast } from "sonner";

// Paises
export const usePais = (): UseQueryResult<ApiResponse<Pais[]>, Error> => {
  return useQuery({
    queryKey: ["pais"],
    queryFn: () => getPais({ pagination: false }),
  });
};

export const useCrearPais = (): UseMutationResult<
  ApiResponse,
  Error,
  CreatePaisDto
> => {
  return useMutation({
    mutationFn: (data: CreatePaisDto) => createPais(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["pais"] });
        toast.success("País creado exitosamente", {
          description: "El país ha sido creado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear país");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar país");
    },
  });
};

export const useActualizarPais = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdatePaisDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaisDto }) =>
      updatePais(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["pais"] });
        toast.success("País actualizado exitosamente", {
          description: "El país ha sido actualizado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar país");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar país");
    },
  });
};

// Departamentos

export const useDepartamento = (): UseQueryResult<
  ApiResponse<Departamento[]>,
  Error
> => {
  return useQuery({
    queryKey: ["departamento"],
    queryFn: () => getDepartamento({ pagination: false }),
  });
};

export const useCrearDepartamento = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateDepartamentoDto
> => {
  return useMutation({
    mutationFn: (data: CreateDepartamentoDto) => createDepartamento(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["departamento"] });
        toast.success("Departamento creado exitosamente", {
          description: "El departamento ha sido creado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear departamento");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear departamento");
    },
  });
};

export const useActualizarDepartamento = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateDepartamentoDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDepartamentoDto }) =>
      updateDepartamento(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["departamento"] });
        toast.success("Departamento actualizado exitosamente", {
          description: "El departamento ha sido actualizado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar departamento");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar departamento");
    },
  });
};

export const useEliminarDepartamento = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number }
> => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteDepartamento(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["departamento"] });
        toast.success("Departamento eliminado exitosamente", {
          description: "El departamento ha sido eliminado correctamente",
        });
      } else {
        throw new Error(data.message || "Error al eliminar departamento");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar departamento");
    },
  });
};
// Ciudades
export const useCiudad = (): UseQueryResult<ApiResponse<Ciudad[]>, Error> => {
  return useQuery({
    queryKey: ["ciudad"],
    queryFn: () => getCiudad({ pagination: false }),
  });
};

export const useCiudadActiva = (): UseQueryResult<
  ApiResponse<Ciudad[]>,
  Error
> => {
  return useQuery({
    queryKey: ["ciudad-activa"],
    queryFn: () => getCiudadActiva(),
  });
};

export const useCrearCiudad = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateCiudadDto
> => {
  return useMutation({
    mutationFn: (data: CreateCiudadDto) => createCiudad(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["ciudad"] });
        toast.success("Ciudad creada exitosamente", {
          description: "La ciudad ha sido creada correctamente",
        });
      } else {
        throw new Error(data.message || "Error al crear ciudad");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear ciudad");
    },
  });
};

export const useActualizarCiudad = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateCiudadDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCiudadDto }) =>
      updateCiudad(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["ciudad"] });
        toast.success("Ciudad actualizada exitosamente", {
          description: "La ciudad ha sido actualizada correctamente",
        });
      } else {
        throw new Error(data.message || "Error al actualizar ciudad");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar ciudad");
    },
  });
};

export const useEliminarCiudad = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number }
> => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteCiudad(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["ciudad"] });
        toast.success("Ciudad eliminada exitosamente", {
          description: "La ciudad ha sido eliminada correctamente",
        });
      } else {
        throw new Error(data.message || "Error al eliminar ciudad");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar ciudad");
    },
  });
};
