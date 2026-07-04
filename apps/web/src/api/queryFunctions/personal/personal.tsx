import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createPersonal,
  deletePersonal,
  getPersonal,
  getPersonalActivo,
  getPersonalById,
  updatePersonal,
  getFilteredPersonal,
} from "../../functions/personal";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { Personal } from "../../types/personal";
import { queryClient } from "../../../App";
import { toast } from "sonner";
import type { CreatePersonalDto, UpdatePersonalDto } from "../../dtos/personal";

import type { PaginationDto } from "../../dtos/common";

export const usePersonal = (paginationParams: PaginationDto = { pagination: 'false' }): UseQueryResult<
  ApiResponse<PaginatedResponse<Personal[]>>,
  Error
> => {
  return useQuery<ApiResponse<PaginatedResponse<Personal[]>>, Error>({
    queryKey: ["personal", paginationParams],
    queryFn: () => getPersonal(paginationParams),
  });
};

export const useFilterPersonal = (): UseMutationResult<
  ApiResponse<PaginatedResponse<Personal[]>>,
  Error,
  any
> => {
  return useMutation({
    mutationFn: (filter: any) => getFilteredPersonal(filter),
    onError: (error) => {
      toast.error(error.message || "Error al filtrar personal");
    },
  });
};

export const usePersonalById = (): UseMutationResult<
  ApiResponse<Personal>,
  Error,
  number
> => {
  return useMutation<ApiResponse<Personal>, Error, number>({
    mutationKey: ["personal-by-id"],
    mutationFn: (id: number) => getPersonalById(id),
  });
};

export const usePersonalActivo = (): UseQueryResult<
  ApiResponse<PaginatedResponse<Personal[]>>,
  Error
> => {
  return useQuery<ApiResponse<PaginatedResponse<Personal[]>>, Error>({
    queryKey: ["personal-activo"],
    queryFn: () => getPersonalActivo({ pagination: 'false' }),
  });
};

export const useCreatePersonal = (): UseMutationResult<
  ApiResponse<Personal>,
  Error,
  CreatePersonalDto
> => {
  return useMutation<ApiResponse<Personal>, Error, CreatePersonalDto>({
    mutationKey: ["create-personal"],
    mutationFn: (data: CreatePersonalDto) => createPersonal(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["personal"] });
        toast.success("Personal creado correctamente");
      } else {
        throw new Error(data.message || "Error al crear el personal");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdatePersonal = (): UseMutationResult<
  ApiResponse<Personal>,
  Error,
  { id: number; data: UpdatePersonalDto }
> => {
  return useMutation<
    ApiResponse<Personal>,
    Error,
    { id: number; data: UpdatePersonalDto }
  >({
    mutationKey: ["update-personal"],
    mutationFn: ({ id, data }) => updatePersonal(id, data),
    onSuccess: (data) => {
      if (data.status === 200) {
        queryClient.invalidateQueries({ queryKey: ["personal"] });
        toast.success("Personal actualizado correctamente");
      } else {
        throw new Error(data.message || "Error al actualizar el personal");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useDeletePersonal = (): UseMutationResult<
  ApiResponse<Personal>,
  Error,
  number
> => {
  return useMutation<ApiResponse<Personal>, Error, number>({
    mutationKey: ["delete-personal"],
    mutationFn: (id: number) => deletePersonal(id),
    onSuccess: (data) => {
      if (data.status === 200) {
        queryClient.invalidateQueries({ queryKey: ["personal"] });
        toast.success("Personal eliminado correctamente");
      } else {
        throw new Error(data.message || "Error al eliminar el personal");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
