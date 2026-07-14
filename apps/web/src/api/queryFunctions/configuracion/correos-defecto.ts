import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { createCorreoDefault, getCorreoDefaultById, getCorreosDefault } from "../../functions/configuracion";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { CorreoDefaultDto, CreateCorreoDefaultDto } from "../../dtos";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useCorreosDefault = (): UseQueryResult<ApiResponse<PaginatedResponse<CreateCorreoDefaultDto[]>>, Error> => {
  return useQuery({
    queryKey: ["correos-default"],
    queryFn: () => getCorreosDefault({ pagination: 'false' }),
  });
};

export const useCreateCorreoDefault = (): UseMutationResult<ApiResponse<CreateCorreoDefaultDto>, Error, CorreoDefaultDto> => {
  return useMutation({
    mutationFn: (correos: CorreoDefaultDto) => createCorreoDefault(correos),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["correos-default"] });
        toast.success("Correos default creados correctamente");
      } else {
        showErrorToast(data.message, "Error al crear correos default");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear correos default");
    },
  });
};

export const useGetCorreoDefaultById = (id: number): UseQueryResult<ApiResponse<CreateCorreoDefaultDto>, Error> => {
  return useQuery({
    queryKey: ["correo-default", id],
    queryFn: () => getCorreoDefaultById(id),
    enabled: !!id,
  });
};
