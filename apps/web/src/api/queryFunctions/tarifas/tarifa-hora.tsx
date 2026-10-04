import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  deleteTarifaHora,
  getTarifaHoraById,
  getTarifasHoraByPeriodo,
  guardarTarifasHora,
} from "../../functions/tarifas/tarifa-hora";
import type { ApiResponse } from "../../types/common";
import type { TarifaHora } from "../../types/periodo";
import type { SaveTarifaHoraDto } from "../../dtos/tarifas";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";

export const useTarifasHoraByPeriodo = (
  idPeriodo: number,
): UseQueryResult<ApiResponse<TarifaHora[]>, Error> => {
  return useQuery({
    queryKey: ["tarifas-hora-periodo", idPeriodo],
    queryFn: () => getTarifasHoraByPeriodo(idPeriodo),
    enabled: !!idPeriodo,
  });
};

export const useGuardarTarifasHora = (): UseMutationResult<
  ApiResponse<TarifaHora[]>,
  Error,
  SaveTarifaHoraDto
> => {
  return useMutation({
    mutationKey: ["guardar-tarifas-hora"],
    mutationFn: (data: SaveTarifaHoraDto) => guardarTarifasHora(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tarifas por hora guardadas correctamente");
        // No se filtra por idPeriodo especifico: invalida cualquier query "tarifas-hora-periodo" (match por prefijo)
        queryClient.invalidateQueries({ queryKey: ["tarifas-hora-periodo"] });
      } else {
        showErrorToast(data.message, "Error al guardar las tarifas por hora");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al guardar las tarifas por hora");
    },
  });
};

export const useTarifaHoraById = (): UseMutationResult<
  ApiResponse<TarifaHora>,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["tarifa-hora-by-id"],
    mutationFn: (id: number) => getTarifaHoraById(id),
  });
};

export const useEliminarTarifaHora = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["eliminar-tarifa-hora"],
    mutationFn: (id: number) => deleteTarifaHora(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tarifa por hora eliminada correctamente");
        queryClient.invalidateQueries({ queryKey: ["tarifas-hora-periodo"] });
      } else {
        showErrorToast(data.message, "Error al eliminar la tarifa por hora");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar la tarifa por hora");
    },
  });
};
