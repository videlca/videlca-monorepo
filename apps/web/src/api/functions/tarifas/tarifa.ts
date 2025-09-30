import { apiDelete, apiGet, apiPatch, apiPost, axiosClient } from "../../config";
import type { EnviarCorreoDto, PaginationDto } from "../../dtos/common";
import type { CreateTarifaDto, SaveTarifaDto, UpdateTarifaDto } from "../../dtos/tarifas";
import type { ApiResponse } from "../../types";
import type { Tarifa } from "../../types/periodo";

export const createTarifa = async (data: CreateTarifaDto): Promise<ApiResponse> => {
  return await apiPost<Tarifa>("/tarifas", data);
};

export const saveTarifas = async (data: SaveTarifaDto): Promise<ApiResponse> => {
  return await apiPost<Tarifa>("/tarifas/guardar-tarifas", data);
};

export const getTarifasByPeriodo = async (idPeriodo: number, pagination: PaginationDto): Promise<ApiResponse<Tarifa[]>> => {
  return await apiGet<Tarifa[]>(`/tarifas/periodo/${idPeriodo}`, pagination);
};

export const getTarifasActivo = async (idPeriodo: number, pagination: PaginationDto): Promise<ApiResponse<Tarifa[]>> => {
  return await apiGet<Tarifa[]>(`/tarifas/actives/${idPeriodo}`, pagination);
};

export const getTarifaById = async (id: number): Promise<ApiResponse<Tarifa>> => {
  return await apiGet<Tarifa>(`/tarifas/${id}`);
};

export const updateTarifa = async (id: number, data: UpdateTarifaDto): Promise<ApiResponse> => {
  return await apiPatch<Tarifa>(`/tarifas/${id}`, data);
};

export const deleteTarifa = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<Tarifa>(`/tarifas/${id}`);
};

export const getTarifasPeriodoActivo = async (
  pagination: PaginationDto,
): Promise<ApiResponse<Tarifa[]>> => {
  return await apiGet<Tarifa[]>(`/tarifas/periodo-activo`, pagination);
};

export const getTarifasPeriodoActivoByIdTipoServicio = async (
  idTipoServicio: number,
  pagination: PaginationDto,
): Promise<ApiResponse<Tarifa[]>> => {
  return await apiGet<Tarifa[]>(`/tarifas/periodo-activo-facturacion/${idTipoServicio}`, pagination);
};

// generacion de archivos

export const enviarExcelPorCorreo = async (id: number, data: EnviarCorreoDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>(`/tarifas/${id}/enviar-excel`, data);
}

export const descargarExcel = async (id: number): Promise<{ blob: Blob; filename: string }> => {
  const response = await axiosClient.get(`/tarifas/${id}/generar-excel`, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let filename = `tarifas-${id}.xlsx`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    console.log("filenameMatch: ", filenameMatch[1]);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }
  
  return { blob: response.data, filename };
}
