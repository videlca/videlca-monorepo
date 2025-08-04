import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { ApiResponse } from "../../types/common";
import type { CreateNovedadDto } from "../../dtos/personal";
import type { Novedad } from "../../types/personal";
import {
  createPersonalNovedad,
  getPersonalNovedad,
} from "../../functions/personal";
import { queryClient } from "../../../App";
import { toast } from "sonner";

export const useCreatePersonalNovedad = (): UseMutationResult<
  ApiResponse<Novedad>,
  Error,
  { idPersonal: number; data: CreateNovedadDto }
> => {
  return useMutation({
    mutationFn: ({
      idPersonal,
      data,
    }: {
      idPersonal: number;
      data: CreateNovedadDto;
    }) => createPersonalNovedad(idPersonal, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201 || data.status === 204) {
        queryClient.invalidateQueries({ queryKey: ["personal-novedad"] });
        toast.success("Novedad creada correctamente");
      } else {
        throw new Error(data.message || "Error al crear la novedad");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useGetPersonalNovedad = (
  idPersonal: number,
): UseQueryResult<ApiResponse<Novedad[]>, Error> => {
  return useQuery({
    queryKey: ["personal-novedad", idPersonal],
    queryFn: () => getPersonalNovedad(idPersonal, { pagination: false }),
  });
};
