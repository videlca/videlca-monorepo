import { aprobarGrupoLiquidacion, cambiarEstadoExportacion, crearLiquidacionMensual, desintegrarGrupoLiquidacion, enviarCorreoArchivoLiquidacion, generarArchivoExcelLiquidacion, getGruposLiquidaciones, getLiquidacionesPorMes, getLiquidacionesPorMesHistorial } from "../../functions/liquidaciones"
import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { CrearGrupoMensualDto } from "../../dtos/liquidaciones";
import { toast } from "sonner";
import { queryClient } from "../../../App";
import type { OrdenServicio } from "../../types/orden-servicio";
import type { GruposLiquidaciones } from "../../types";
import type { UpdateGrupoLiquidacionEstadoDto } from "../../dtos/exportaciones";
import type { EnviarCorreoDto } from "../../dtos/common";

export const useGetLiquidacionesPorMes = (anio: number, mes: number, enabled: boolean): UseQueryResult<ApiResponse<PaginatedResponse<OrdenServicio[]>>, Error> => {
  return useQuery({
    queryKey: ["liquidaciones-por-mes"],
    queryFn: () => getLiquidacionesPorMes(anio, mes),
    enabled: !!anio && !!mes && enabled,
  });
};

export const useGetLiquidacionesPorMesHistorial = (anio: number, mes: number, enabled: boolean): UseQueryResult<ApiResponse<PaginatedResponse<GruposLiquidaciones[]>>, Error> => {
  return useQuery({
    queryKey: ["liquidaciones-por-mes-historial"],
    queryFn: () => getLiquidacionesPorMesHistorial(anio, mes),
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

export const useGetGruposLiquidaciones = (): UseQueryResult<ApiResponse<PaginatedResponse<GruposLiquidaciones[]>>, Error> => {
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

// Archivos de liquidaciones
export const useGenerarReporteArchivoLiquidacion = (): UseMutationResult<{ blob: Blob; filename: string }, Error, number> => {
  return useMutation({
    mutationKey: ["generar-reporte-liquidacion"],
    mutationFn: (idGrupoLiquidacion) => generarArchivoExcelLiquidacion(idGrupoLiquidacion),
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Reporte generado correctamente");
      queryClient.invalidateQueries({
        queryKey: ["grupos-liquidaciones"],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Error al generar el reporte consolidacion");
    },
  });
};

export const useEnviarCorreoArchivoLiquidacion = (): UseMutationResult<ApiResponse<any>, Error, { id: number, data: EnviarCorreoDto }> => {
  return useMutation({
    mutationKey: ["enviar-correo-liquidacion"],
    mutationFn: ({ id, data }) => enviarCorreoArchivoLiquidacion(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Correo enviado correctamente");
        queryClient.invalidateQueries({
          queryKey: ["enviar-correo-liquidacion"],
        });
      } else {
        throw new Error(data.message || "Error al enviar el correo de liquidacion");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al enviar el correo de liquidacion");
    },
  });
};
