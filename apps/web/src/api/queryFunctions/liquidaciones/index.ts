import { aprobarGrupoLiquidacion, cambiarEstadoExportacion, compararLiquidacionesCliente, crearLiquidacionMensual, descargarPdfLiquidacion, desintegrarGrupoLiquidacion, enviarCorreoArchivoLiquidacion, enviarPdfLiquidacion, generarArchivoExcelLiquidacion, getAdicionalesPorMes, getGruposLiquidaciones, getLiquidacionesPorMes, getLiquidacionesPorMesHistorial, getOrdenLiquidada } from "../../functions/liquidaciones"
import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { CompararLiquidacionesClienteDto, CrearGrupoMensualDto } from "../../dtos/liquidaciones";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";
import type { AdicionalPorMes, ComparacionCliente, GruposLiquidaciones, GrupoLiquidacionCreado, OrdenOAdicionalLiquidado, OrdenPorMes } from "../../types";
import type { UpdateGrupoLiquidacionEstadoDto } from "../../dtos/exportaciones";
import type { EnviarCorreoDto } from "../../dtos/common";

export const useGetLiquidacionesPorMes = (anio: number, mes: number, enabled: boolean, mesesAtras?: number): UseQueryResult<ApiResponse<OrdenPorMes[]>, Error> => {
  return useQuery({
    queryKey: ["liquidaciones-por-mes", anio, mes, mesesAtras],
    queryFn: () => getLiquidacionesPorMes(anio, mes, mesesAtras),
    enabled: !!anio && !!mes && enabled,
  });
};

export const useGetAdicionalesPorMes = (anio: number, mes: number, enabled: boolean, mesesAtras?: number): UseQueryResult<ApiResponse<AdicionalPorMes[]>, Error> => {
  return useQuery({
    queryKey: ["adicionales-por-mes", anio, mes, mesesAtras],
    queryFn: () => getAdicionalesPorMes(anio, mes, mesesAtras),
    enabled: !!anio && !!mes && enabled,
  });
};

export const useGetLiquidacionesPorMesHistorial = (anio: number, mes: number, enabled: boolean, idCliente?: number, tiposServicio?: string): UseQueryResult<ApiResponse<GruposLiquidaciones[]>, Error> => {
  return useQuery({
    queryKey: ["liquidaciones-por-mes-historial", anio, mes, idCliente, tiposServicio],
    queryFn: () => getLiquidacionesPorMesHistorial(anio, mes, idCliente, tiposServicio),
    enabled: !!anio && !!mes && enabled,
  });
};

export const useCompararLiquidacionesCliente = (params: CompararLiquidacionesClienteDto, enabled: boolean): UseQueryResult<ApiResponse<ComparacionCliente>, Error> => {
  return useQuery({
    queryKey: ["comparar-liquidaciones-cliente", params.idCliente, params.anioA, params.mesA, params.anioB, params.mesB, params.tiposServicio],
    queryFn: () => compararLiquidacionesCliente(params),
    enabled: !!params.idCliente && !!params.tiposServicio && enabled,
  });
};

export const useCrearLiquidacionMensual = (): UseMutationResult<ApiResponse<GrupoLiquidacionCreado>, Error, CrearGrupoMensualDto> => {
  return useMutation({
    mutationFn: (data: CrearGrupoMensualDto) => crearLiquidacionMensual(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Liquidación mensual creada correctamente");
        queryClient.invalidateQueries({ queryKey: ["liquidaciones-por-mes"] });
        queryClient.invalidateQueries({ queryKey: ["adicionales-por-mes"] });
        queryClient.invalidateQueries({ queryKey: ["liquidaciones-por-mes-historial"] });
      } else {
        showErrorToast(data.message, "Error al crear la liquidación mensual");
        // Si algun item ya fue liquidado, la lista de pendientes quedo desactualizada
        const mensaje = Array.isArray(data.message) ? data.message.join(" ") : String(data.message ?? "");
        if (mensaje.includes("ya tiene una liquidacion") || mensaje.includes("ya fueron liquidados")) {
          queryClient.invalidateQueries({ queryKey: ["liquidaciones-por-mes"] });
          queryClient.invalidateQueries({ queryKey: ["adicionales-por-mes"] });
        }
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear la liquidación mensual");
    },
  });
};

// Detalle de una liquidacion (orden o adicional, discriminado por `tipo`), con los precios reales de esa
// liquidacion especifica. Se modela como mutation (igual que useGetOrdenServicioById) porque se dispara al
// hacer clic sobre una liquidacion puntual, no como parte de la carga inicial de una pantalla
export const useGetOrdenLiquidada = (): UseMutationResult<ApiResponse<OrdenOAdicionalLiquidado>, Error, number> => {
  return useMutation({
    mutationFn: (idLiquidacion: number) => getOrdenLiquidada(idLiquidacion),
    onError: (error) => {
      showErrorToast(error.message, "Error al obtener el detalle de la liquidación");
    },
  });
};

// Grupos de liquidaciones

export const useGetGruposLiquidaciones = (): UseQueryResult<ApiResponse<GruposLiquidaciones[]>, Error> => {
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
        showErrorToast(data.message, "Error al aprobar el grupo de liquidación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al aprobar el grupo de liquidación");
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
        showErrorToast(data.message, "Error al desintegrar el grupo de liquidación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al desintegrar el grupo de liquidación");
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
        showErrorToast(data.message, "Error al cambiar el estado de exportación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al cambiar el estado de exportación");
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
      showErrorToast(error.message, "Error al generar el reporte consolidacion");
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
        showErrorToast(data.message, "Error al enviar el correo de liquidacion");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al enviar el correo de liquidacion");
    },
  });
};

export const useDescargarPdfLiquidacion = (): UseMutationResult<{ blob: Blob; filename: string }, Error, number> => {
  return useMutation({
    mutationKey: ["descargar-pdf-liquidacion"],
    mutationFn: (idGrupoLiquidacion) => descargarPdfLiquidacion(idGrupoLiquidacion),
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF de liquidación descargado correctamente");
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al descargar el PDF de la liquidación");
    },
  });
};

export const useEnviarPdfLiquidacion = (): UseMutationResult<ApiResponse<any>, Error, { id: number, data: EnviarCorreoDto }> => {
  return useMutation({
    mutationKey: ["enviar-pdf-liquidacion"],
    mutationFn: ({ id, data }) => enviarPdfLiquidacion(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("PDF de liquidación enviado correctamente");
      } else {
        showErrorToast(data.message, "Error al enviar el PDF de la liquidación");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al enviar el PDF de la liquidación");
    },
  });
};
