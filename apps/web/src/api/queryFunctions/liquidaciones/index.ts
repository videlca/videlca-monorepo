import { aprobarGrupoLiquidacion, cambiarEstadoExportacion, crearLiquidacionMensual, desintegrarGrupoLiquidacion, getGruposLiquidaciones, getLiquidacionesPorMes } from "../../functions/liquidaciones"
import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import type { ApiResponse } from "../../types/common";
import type { CrearGrupoMensualDto } from "../../dtos/liquidaciones";
import { toast } from "sonner";
import { queryClient } from "../../../App";
import type { OrdenServicio } from "../../types/orden-servicio";
import type { GruposLiquidaciones } from "../../types";
import type { UpdateGrupoLiquidacionEstadoDto } from "../../dtos/exportaciones";

export const useGetLiquidacionesPorMes = (anio: number, mes: number, enabled: boolean): UseQueryResult<ApiResponse<OrdenServicio[]>, Error> => {
  return useQuery({
    queryKey: ["liquidaciones-por-mes"],
    queryFn: () => getLiquidacionesPorMes(anio, mes),
    enabled: !!anio && !!mes && enabled,
  });
};

export const useCrearLiquidacionMensual = (): UseMutationResult<ApiResponse<OrdenServicio>, Error, CrearGrupoMensualDto> => {
  return useMutation({
    mutationFn: (data: CrearGrupoMensualDto) => crearLiquidacionMensual(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Liquidación mensual creada correctamente");
        queryClient.invalidateQueries({ queryKey: ["liquidaciones-por-mes"] });
      } else {
        throw new Error(data.message || "Error al crear la liquidación mensual");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear la liquidación mensual");
    },
  });
};

// Grupos de liquidaciones

export const useGetGruposLiquidaciones = (): UseQueryResult<ApiResponse<GruposLiquidaciones[]>, Error> => {
  queryClient.invalidateQueries({ queryKey: ["grupos-liquidaciones"] });
  return useQuery({
    queryKey: ["grupos-liquidaciones"],
    queryFn: () => getGruposLiquidaciones(),
  });
};

export const useAprobarGrupoLiquidacion = (): UseMutationResult<ApiResponse<GruposLiquidaciones>, Error, number> => {
  return useMutation({
    mutationFn: (idGrupoLiquidacion: number) => aprobarGrupoLiquidacion(idGrupoLiquidacion),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Grupo de liquidación aprobado correctamente");
        queryClient.invalidateQueries({ queryKey: ["grupos-liquidaciones"] });
      } else {
        throw new Error(data.message || "Error al aprobar el grupo de liquidación");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al aprobar el grupo de liquidación");
    },
  });
};

export const useDesintegrarGrupoLiquidacion = (): UseMutationResult<ApiResponse<GruposLiquidaciones>, Error, number> => {
  return useMutation({
    mutationFn: (idGrupoLiquidacion: number) => desintegrarGrupoLiquidacion(idGrupoLiquidacion),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Grupo de liquidación desintegrado correctamente");
        queryClient.invalidateQueries({ queryKey: ["grupos-liquidaciones"] });
      } else {
        throw new Error(data.message || "Error al desintegrar el grupo de liquidación");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al desintegrar el grupo de liquidación");
    },
  });
};

export const useCambiarEstadoExportacion = (): UseMutationResult<ApiResponse<GruposLiquidaciones>, Error, { idGrupoLiquidacion: number, data: UpdateGrupoLiquidacionEstadoDto }> => {
  return useMutation({
    mutationFn: ({ idGrupoLiquidacion, data }: { idGrupoLiquidacion: number, data: UpdateGrupoLiquidacionEstadoDto }) => cambiarEstadoExportacion(idGrupoLiquidacion, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Estado de exportación cambiado correctamente");
        queryClient.invalidateQueries({ queryKey: ["grupos-liquidaciones-exportaciones"] });
      } else {
        throw new Error(data.message || "Error al cambiar el estado de exportación");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al cambiar el estado de exportación");
    },
  });
};
