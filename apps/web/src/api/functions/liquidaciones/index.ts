import { apiDelete, apiGet, apiPatch, apiPost, axiosClient } from "../../config";
import type { CrearGrupoMensualDto } from "../../dtos/liquidaciones";
import type { OrdenServicio } from "../../types/orden-servicio";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { GruposLiquidaciones } from "../../types/liquidaciones";
import type { UpdateGrupoLiquidacionEstadoDto } from "../../dtos/exportaciones";
import type { EnviarCorreoDto } from "../../dtos";

export const getLiquidacionesPorMes = async (anio: number, mes: number): Promise<ApiResponse<OrdenServicio[]>> => {
  return await apiGet<OrdenServicio[]>(`/liquidaciones/ordenes-por-mes?anio=${anio}&mes=${mes}`);
};

export const getLiquidacionesPorMesHistorial = async (anio: number, mes: number): Promise<ApiResponse<GruposLiquidaciones[]>> => {
  return await apiGet<GruposLiquidaciones[]>(`/liquidaciones/historial-liquidaciones-aprobadas?anio=${anio}&mes=${mes}`);
};

export const crearLiquidacionMensual = async (data: CrearGrupoMensualDto): Promise<ApiResponse<OrdenServicio>> => {
  return await apiPost<OrdenServicio>(`/liquidaciones/generar-mes`, data);
};

// Grupos de liquidaciones

export const getGruposLiquidaciones = async (): Promise<ApiResponse<GruposLiquidaciones[]>> => {
  return await apiGet<GruposLiquidaciones[]>(`/aprobacion-liquidacion-orden-servicio/buscar-grupos-liquidaciones`);
};

export const aprobarGrupoLiquidacion = async (idGrupoLiquidacion: number): Promise<ApiResponse<GruposLiquidaciones>> => {
  return await apiPost<GruposLiquidaciones>(`/aprobacion-liquidacion-orden-servicio/${idGrupoLiquidacion}/liquidar-grupo`);
};

export const desintegrarGrupoLiquidacion = async (idGrupoLiquidacion: number): Promise<ApiResponse<GruposLiquidaciones>> => {
  return await apiDelete<GruposLiquidaciones>(`/aprobacion-liquidacion-orden-servicio/${idGrupoLiquidacion}/desintegrar-grupo`);
};

export const cambiarEstadoExportacion = async (idGrupoLiquidacion: number, data: UpdateGrupoLiquidacionEstadoDto): Promise<ApiResponse<GruposLiquidaciones>> => {
  return await apiPatch<GruposLiquidaciones>(`/liquidaciones/${idGrupoLiquidacion}/cambiar-estado`, data);
};

// Archivos de liquidaciones
export const generarArchivoExcelLiquidacion = async (idGrupoLiquidacion: number): Promise<{ blob: Blob; filename: string }> => {
  const response = await axiosClient.get(`/liquidaciones/${idGrupoLiquidacion}/generar-excel-liquidacion`, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let filename = `liquidacion-${idGrupoLiquidacion}.xlsx`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }
  
  return { blob: response.data, filename };
};

export const enviarCorreoArchivoLiquidacion = async (idGrupoLiquidacion: number, data: EnviarCorreoDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>(`/liquidaciones/${idGrupoLiquidacion}/enviar-excel-liquidacion`, data);
};