import { apiDelete, apiGet, apiPost } from "../../config";
import type { SaveTarifaHoraDto } from "../../dtos/tarifas";
import type { ApiResponse } from "../../types/common";
import type { TarifaHora } from "../../types/periodo";

// Siempre trae las 4 tarifas hora del periodo (idTarifaHora viene null si aun no se ha creado un valor para esa fila)
export const getTarifasHoraByPeriodo = async (idPeriodo: number): Promise<ApiResponse<TarifaHora[]>> => {
  return await apiGet<TarifaHora[]>(`/tarifas-hora/periodo/${idPeriodo}`);
};

// Crea/actualiza (upsert) las 4 tarifas hora de un periodo, siempre se envian las 4 juntas
export const guardarTarifasHora = async (data: SaveTarifaHoraDto): Promise<ApiResponse<TarifaHora[]>> => {
  return await apiPost<TarifaHora[]>("/tarifas-hora/guardar", data);
};

export const getTarifaHoraById = async (id: number): Promise<ApiResponse<TarifaHora>> => {
  return await apiGet<TarifaHora>(`/tarifas-hora/${id}`);
};

export const deleteTarifaHora = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<TarifaHora>(`/tarifas-hora/${id}`);
};
