import { crearLiquidacionMensual, getLiquidacionesPorMes } from "../../functions/liquidaciones"
import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import type { ApiResponse } from "../../types/common";
import type { CrearGrupoMensualDto } from "../../dtos/liquidaciones";
import { toast } from "sonner";
import { queryClient } from "../../../App";
import type { OrdenServicio } from "../../types/orden-servicio";

export const useGetLiquidacionesPorMes = (anio: number, mes: number, enabled: boolean): UseQueryResult<ApiResponse<OrdenServicio[]>, Error> => {
  return useQuery({
    queryKey: ["liquidaciones-por-mes", anio, mes],
    queryFn: () => getLiquidacionesPorMes(anio, mes),
    enabled: !!anio && !!mes && enabled,
  });
};

export const useCrearLiquidacionMensual = (): UseMutationResult<ApiResponse<OrdenServicio>, Error, CrearGrupoMensualDto> => {
  return useMutation({
    mutationFn: (data: CrearGrupoMensualDto) => crearLiquidacionMensual(data),
    onSuccess: (data, variables) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Liquidación mensual creada correctamente");
        queryClient.invalidateQueries({ queryKey: ["liquidaciones-por-mes", variables.anio, variables.mes] });
      } else {
        throw new Error(data.message || "Error al crear la liquidación mensual");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear la liquidación mensual");
    },
  });
};
  