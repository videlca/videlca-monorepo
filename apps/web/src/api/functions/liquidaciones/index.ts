import { apiDelete, apiGet, apiPatch, apiPost, axiosClient } from "../../config";
import type { CompararLiquidacionesClienteDto, CrearGrupoMensualDto } from "../../dtos/liquidaciones";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { AdicionalPorMes, ComparacionCliente, GruposLiquidaciones, GrupoLiquidacionCreado, OrdenOAdicionalLiquidado, OrdenPorMes } from "../../types/liquidaciones";
import type { UpdateGrupoLiquidacionEstadoDto } from "../../dtos/exportaciones";
import type { EnviarCorreoDto } from "../../dtos";

export const getLiquidacionesPorMes = async (anio: number, mes: number, mesesAtras?: number): Promise<ApiResponse<OrdenPorMes[]>> => {
  return await apiGet<OrdenPorMes[]>(`/liquidaciones/ordenes-por-mes`, { anio, mes, ...(mesesAtras !== undefined ? { mesesAtras } : {}) });
};

export const getAdicionalesPorMes = async (anio: number, mes: number, mesesAtras?: number): Promise<ApiResponse<AdicionalPorMes[]>> => {
  return await apiGet<AdicionalPorMes[]>(`/liquidaciones/adicionales-por-mes`, { anio, mes, ...(mesesAtras !== undefined ? { mesesAtras } : {}) });
};

// Detalle de una liquidacion "como el findOne normal" de lo que se liquido (orden o adicional), pero con los
// precios reales de esa liquidacion (mes) especifica en vez del total actual. Discriminado por `tipo` — ver
// OrdenOAdicionalLiquidado para la forma exacta de cada rama de la respuesta
export const getOrdenLiquidada = async (idLiquidacion: number): Promise<ApiResponse<OrdenOAdicionalLiquidado>> => {
  return await apiGet<OrdenOAdicionalLiquidado>(`/liquidaciones/${idLiquidacion}/orden`);
};

export const getLiquidacionesPorMesHistorial = async (anio: number, mes: number, idCliente?: number, tiposServicio?: string): Promise<ApiResponse<GruposLiquidaciones[]>> => {
  return await apiGet<GruposLiquidaciones[]>(`/liquidaciones/historial-liquidaciones-aprobadas`, { anio, mes, ...(idCliente ? { idCliente } : {}), ...(tiposServicio ? { tiposServicio } : {}) });
};

export const compararLiquidacionesCliente = async (params: CompararLiquidacionesClienteDto): Promise<ApiResponse<ComparacionCliente>> => {
  return await apiGet<ComparacionCliente>(`/liquidaciones/comparar-cliente`, params);
};

export const crearLiquidacionMensual = async (data: CrearGrupoMensualDto): Promise<ApiResponse<GrupoLiquidacionCreado>> => {
  return await apiPost<GrupoLiquidacionCreado>(`/liquidaciones/generar-mes`, data);
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
export const descargarPdfLiquidacion = async (idGrupoLiquidacion: number): Promise<{ blob: Blob; filename: string }> => {
  try {
    const response = await axiosClient.get(`/liquidaciones/${idGrupoLiquidacion}/generar-pdf-liquidacion`, {
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'];
    let filename = `liquidacion_grupo_${idGrupoLiquidacion}.pdf`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    return { blob: response.data, filename };
  } catch (err: any) {
    let message: string | string[] | undefined;
    // Con responseType 'blob' el cuerpo del error tambien llega como Blob
    try {
      message = JSON.parse(await err.response.data.text()).message;
    } catch {
      message = undefined;
    }
    throw new Error((Array.isArray(message) ? message.join(', ') : message) || err.message);
  }
};

export const enviarPdfLiquidacion = async (idGrupoLiquidacion: number, data: EnviarCorreoDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>(`/liquidaciones/${idGrupoLiquidacion}/enviar-pdf-liquidacion`, data);
};
