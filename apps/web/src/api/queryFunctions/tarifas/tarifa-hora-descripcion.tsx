import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  getTarifaHoraDescripcionById,
  getTarifasHoraDescripcion,
} from "../../functions/tarifas/tarifa-hora-descripcion";
import type { ApiResponse } from "../../types/common";
import type { TarifaHoraDescripcion } from "../../types/periodo";

export const useTarifasHoraDescripcion = (): UseQueryResult<
  ApiResponse<TarifaHoraDescripcion[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tarifas-hora-descripcion"],
    queryFn: () => getTarifasHoraDescripcion(),
  });
};

export const useTarifaHoraDescripcionById = (
  id: number,
): UseQueryResult<ApiResponse<TarifaHoraDescripcion>, Error> => {
  return useQuery({
    queryKey: ["tarifa-hora-descripcion", id],
    queryFn: () => getTarifaHoraDescripcionById(id),
    enabled: !!id,
  });
};
