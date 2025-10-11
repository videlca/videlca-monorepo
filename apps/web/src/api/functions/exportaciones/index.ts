import type { GruposLiquidaciones } from "../../types";
import { apiGet, apiPost, axiosClient } from "../../config";
import type { ApiResponse } from "../../types/common";
import type { FiltroGrupoLiquidacionDto } from "../../dtos/exportaciones";
import type { EnviarCorreoDto } from "../../dtos/common";

export const getGruposLiquidacionesExportaciones = async (params: FiltroGrupoLiquidacionDto): Promise<ApiResponse<GruposLiquidaciones[]>> => {
  return await apiGet<GruposLiquidaciones[]>(`/exportacion/buscar-por-campo?campo=${params.campo}&valor=${params.valor}`);
};

export const generarReporteConsolidacion = async (idGrupoLiquidacion: number): Promise<{ blob: Blob; filename: string }> => {
  const response = await axiosClient.get(`/exportacion/${idGrupoLiquidacion}/generar-excel-consolidacion`, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let filename = `exportacion-consolidacion-${idGrupoLiquidacion}.xlsx`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    console.log("filenameMatch: ", filenameMatch[1]);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }
  
  return { blob: response.data, filename };
};

export const enviarCorreoExportacionConsolidacion = async (idGrupoLiquidacion: number, data: EnviarCorreoDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>(`/exportacion/${idGrupoLiquidacion}/enviar-excel-consolidacion`, data);
};