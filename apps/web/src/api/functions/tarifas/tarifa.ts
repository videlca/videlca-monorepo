import { apiDelete, apiGet, apiPatch, apiPost, axiosClient } from "../../config";
import type { EnviarCorreoDto, PaginationDto } from "../../dtos/common";
import type { CalcularPreciosDto, CreateTarifaDto, SaveTarifaDto, UpdateTarifaDto } from "../../dtos/tarifas";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { CalcularPreciosResponse, Tarifa } from "../../types/periodo";

export const createTarifa = async (data: CreateTarifaDto): Promise<ApiResponse> => {
  return await apiPost<Tarifa>("/tarifas", data);
};

export const saveTarifas = async (data: SaveTarifaDto): Promise<ApiResponse> => {
  return await apiPost<Tarifa>("/tarifas/guardar-tarifas", data);
};

// Calcula el precio de los servicios seleccionados de un periodo a partir de la tarifa hora de ese periodo.
// No persiste nada, solo propone un precio (o indica que debe ingresarse manualmente).
export const calcularPreciosServicios = async (data: CalcularPreciosDto): Promise<ApiResponse<CalcularPreciosResponse>> => {
  return await apiPost<CalcularPreciosResponse>("/tarifas/calcular-precios", data);
};

export const getTarifasByPeriodo = async (idPeriodo: number, pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Tarifa[]>>> => {
  return await apiGet<PaginatedResponse<Tarifa[]>>(`/tarifas/periodo/${idPeriodo}`, pagination);
};

export const getTarifasActivo = async (idPeriodo: number, pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Tarifa[]>>> => {
  return await apiGet<PaginatedResponse<Tarifa[]>>(`/tarifas/actives/${idPeriodo}`, pagination);
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
): Promise<ApiResponse<PaginatedResponse<Tarifa[]>>> => {
  return await apiGet<PaginatedResponse<Tarifa[]>>(`/tarifas/periodo-activo`, pagination);
};

export const getTarifasPeriodoActivoByIdTipoServicio = async (
  idTipoServicio: number,
  pagination: PaginationDto,
): Promise<ApiResponse<PaginatedResponse<Tarifa[]>>> => {
  return await apiGet<PaginatedResponse<Tarifa[]>>(`/tarifas/periodo-activo-facturacion/${idTipoServicio}`, pagination);
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
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }
  
  return { blob: response.data, filename };
}
