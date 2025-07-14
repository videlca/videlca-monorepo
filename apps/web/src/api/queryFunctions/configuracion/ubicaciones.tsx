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
  getCiudad,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pais"] });
    },
    onError: (error) => {
      console.log(error);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pais"] });
    },
    onError: (error) => {
      console.log(error);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departamento"] });
    },
    onError: (error) => {
      console.log(error);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departamento"] });
    },
    onError: (error) => {
      console.log(error);
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

export const useCrearCiudad = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateCiudadDto
> => {
  return useMutation({
    mutationFn: (data: CreateCiudadDto) => createCiudad(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ciudad"] });
    },
    onError: (error) => {
      console.log(error);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ciudad"] });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
