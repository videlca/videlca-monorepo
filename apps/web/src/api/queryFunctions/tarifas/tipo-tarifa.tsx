import { useMutation, useQuery } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { getTipoTarifa, updateTipoTarifa } from "../../functions/tarifas";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { TipoTarifa } from "../../types/periodo";
import type { UpdateTipoTarifaDto } from "../../dtos/tarifas";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useTipoTarifa = (): UseQueryResult<
  ApiResponse<PaginatedResponse<TipoTarifa[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-tarifa"],
    queryFn: () => getTipoTarifa({ pagination: 'false' }),
  });
};

export const useActualizarTipoTarifa = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateTipoTarifaDto }
> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoTarifaDto }) =>
      updateTipoTarifa(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({ queryKey: ["tipo-tarifa"] });
        toast.success("Tipo de tarifa actualizado exitosamente", {
          description: "El tipo de tarifa ha sido actualizado correctamente",
        });
      } else {
        showErrorToast(data.message, "Error al actualizar tipo de tarifa");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar tipo de tarifa");
    },
  });
};
