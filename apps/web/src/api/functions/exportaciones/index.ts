import type { GruposLiquidaciones } from "../../types";
import { apiGet, apiPost, axiosClient } from "../../config";
import type { ApiResponse } from "../../types/common";
import type { FiltroGrupoLiquidacionDto } from "../../dtos/exportaciones";
import type { EnviarCorreoDto } from "../../dtos/common";

export type Exportacion = 
  "generar-excel-consolidacion" |
  "enviar-excel-consolidacion" |
  "generar-excel-interfase" |
  "enviar-excel-interfase" |
  "generar-anexos-facturacion" |
  "enviar-anexos-facturacion"

export const getGruposLiquidacionesExportaciones = async (params: FiltroGrupoLiquidacionDto): Promise<ApiResponse<GruposLiquidaciones[]>> => {
  return await apiGet<GruposLiquidaciones[]>(`/exportacion/buscar-por-campo?campo=${params.campo}&valor=${params.valor}`);
};

export const generarArchivoExcel = async (idGrupoLiquidacion: number, archivo: Exportacion): Promise<{ blob: Blob; filename: string }> => {
  const response = await axiosClient.get(`/exportacion/${idGrupoLiquidacion}/${archivo}`, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let filename = `exportacion-${archivo}-${idGrupoLiquidacion}.xlsx`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }
  
  return { blob: response.data, filename };
};

export const enviarCorreoArchivo = async (idGrupoLiquidacion: number, data: EnviarCorreoDto, archivo: Exportacion): Promise<ApiResponse<any>> => {
  return await apiPost<any>(`/exportacion/${idGrupoLiquidacion}/${archivo}`, data);
};