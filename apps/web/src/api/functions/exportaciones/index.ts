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
  const { campo, valor, anio, mes } = params;
  // anio y mes se envían los dos o ninguno
  return await apiGet<GruposLiquidaciones[]>(`/exportacion/buscar-por-campo`, {
    campo,
    valor,
    ...(anio && mes ? { anio, mes } : {}),
  });
};

// Nombre del archivo que manda el backend en Content-Disposition, o el de respaldo si no viene
const filenameDesdeHeader = (contentDisposition: string | undefined, porDefecto: string): string => {
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]/g, '');
    }
  }
  return porDefecto;
};

// Con responseType 'blob' el cuerpo de un error (ej. el 400 de "falta el centro de costos") tambien llega como
// Blob: se lee para que el toast muestre el mensaje real del backend y no solo el codigo HTTP
const errorDesdeBlob = async (error: any): Promise<Error> => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const { message } = JSON.parse(await data.text());
      if (message) return new Error(Array.isArray(message) ? message.join(", ") : message);
    } catch {
      // cuerpo no JSON: se deja el error original
    }
  }
  return error;
};

export const generarArchivoExcel = async (idGrupoLiquidacion: number, archivo: Exportacion): Promise<{ blob: Blob; filename: string }> => {
  const response = await axiosClient.get(`/exportacion/${idGrupoLiquidacion}/${archivo}`, {
    responseType: 'blob',
  }).catch(async (error) => { throw await errorDesdeBlob(error); });

  const filename = filenameDesdeHeader(
    response.headers['content-disposition'],
    `exportacion-${archivo}-${idGrupoLiquidacion}.xlsx`,
  );
  
  return { blob: response.data, filename };
};

// Un solo archivo de interfase con todos los grupos indicados (ver downloadInterfaseExcelGrupos en el backend)
export const generarArchivoInterfaseGrupos = async (idsGrupoLiquidacion: number[]): Promise<{ blob: Blob; filename: string }> => {
  const response = await axiosClient.post(
    `/exportacion/generar-excel-interfase-grupos`,
    { idsGrupoLiquidacion },
    { responseType: 'blob' },
  ).catch(async (error) => { throw await errorDesdeBlob(error); });

  const filename = filenameDesdeHeader(
    response.headers['content-disposition'],
    `exportacion_todos_los_grupos_${Date.now()}.xlsx`,
  );

  return { blob: response.data, filename };
};

export const enviarCorreoArchivo = async (idGrupoLiquidacion: number, data: EnviarCorreoDto, archivo: Exportacion): Promise<ApiResponse<any>> => {
  return await apiPost<any>(`/exportacion/${idGrupoLiquidacion}/${archivo}`, data);
};