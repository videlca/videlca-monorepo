import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  deleteNovedad,
  getNovedades,
  updateNovedad,
} from "../../functions/personal/novedades";
import type { ApiResponse } from "../../types/common";
import type { Novedad } from "../../types/personal";
import type { UpdateNovedadDto } from "../../dtos/personal";
import { queryClient } from "../../../App";
import { toast } from "sonner";

export const useNovedades = (): UseQueryResult<ApiResponse<Novedad[]>> => {
  return useQuery({
    queryKey: ["novedades"],
    queryFn: () => getNovedades({ pagination: false }),
  });
};

export const useUpdateNovedad = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateNovedadDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNovedadDto }) =>
      updateNovedad(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201 || data.status === 204) {
        queryClient.invalidateQueries({ queryKey: ["novedades"] });
        toast.success("Novedad actualizada correctamente");
      } else {
        throw new Error(data.message || "Error al actualizar la novedad");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteNovedad = (): UseMutationResult<
  ApiResponse<Novedad>,
  Error,
  number
> => {
  return useMutation<ApiResponse<Novedad>, Error, number>({
    mutationKey: ["delete-novedad"],
    mutationFn: (id: number) => deleteNovedad(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201 || data.status === 204) {
        queryClient.invalidateQueries({ queryKey: ["novedades"] });
        toast.success("Novedad eliminada correctamente");
      } else {
        throw new Error(data.message || "Error al eliminar la novedad");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
