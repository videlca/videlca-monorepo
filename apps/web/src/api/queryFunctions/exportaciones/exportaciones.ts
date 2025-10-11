import { useMutation, useQuery, type UseMutationResult } from "@tanstack/react-query";
import type { ApiResponse } from "../../types/common";
import type { GruposLiquidaciones } from "../../types";
import { enviarCorreoExportacionConsolidacion, generarReporteConsolidacion, getGruposLiquidacionesExportaciones } from "../../functions/exportaciones";
import type { FiltroGrupoLiquidacionDto } from "../../dtos/exportaciones";
import { toast } from "sonner";
import type { EnviarCorreoDto } from "../../dtos/common";
import { queryClient } from "../../../App";

export const useGetGruposLiquidacionesExportaciones = (params: FiltroGrupoLiquidacionDto) => {
  return useQuery<ApiResponse<GruposLiquidaciones[]>>({
    queryKey: ["grupos-liquidaciones-exportaciones", params.campo, params.valor],
    queryFn: () => getGruposLiquidacionesExportaciones(params),
    enabled: !!params.valor,
  });
};

export const useGenerarReporteConsolidacion = (): UseMutationResult<{ blob: Blob; filename: string }, Error, number> => {
  return useMutation({
    mutationKey: ["generar-reporte-consolidacion"],
    mutationFn: (idGrupoLiquidacion) => generarReporteConsolidacion(idGrupoLiquidacion),
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Reporte consolidacion generado correctamente");
      queryClient.invalidateQueries({
        queryKey: ["grupos-liquidaciones-exportaciones"],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Error al generar el reporte consolidacion");
    },
  });
};

export const useEnviarCorreoExportacionConsolidacion = (): UseMutationResult<ApiResponse<any>, Error, { id: number, data: EnviarCorreoDto }> => {
  return useMutation({
    mutationKey: ["enviar-correo-exportacion"],
    mutationFn: ({ id, data }) => enviarCorreoExportacionConsolidacion(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Correo enviado correctamente");
        queryClient.invalidateQueries({
          queryKey: ["enviar-correo-exportacion"],
        });
      } else {
        throw new Error(data.message || "Error al enviar el correo de exportacion");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al enviar el correo de exportacion");
    },
  });
};
