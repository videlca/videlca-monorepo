import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { CrearGrupoMensualDto } from "../../dtos/liquidaciones";
import type { OrdenServicio } from "../../types/orden-servicio";
import type { ApiResponse } from "../../types/common";
import type { GruposLiquidaciones } from "../../types/liquidaciones";
import type { UpdateGrupoLiquidacionEstadoDto } from "../../dtos/exportaciones";

export const getLiquidacionesPorMes = async (anio: number, mes: number): Promise<ApiResponse<OrdenServicio[]>> => {
  return await apiGet<OrdenServicio[]>(`/liquidaciones/ordenes-por-mes?anio=${anio}&mes=${mes}`);
};

export const getLiquidacionesPorMesHistorial = async (anio: number, mes: number): Promise<ApiResponse<GruposLiquidaciones[]>> => {
  return await apiGet<GruposLiquidaciones[]>(`/liquidaciones/historial-liquidaciones-aprobadas?anio=${anio}&mes=${mes}`);
};

export const crearLiquidacionMensual = async (data: CrearGrupoMensualDto): Promise<ApiResponse<OrdenServicio>> => {
  return await apiPost<OrdenServicio>(`/liquidaciones/grupo/generar-mes`, data);
};

// Grupos de liquidaciones

export const getGruposLiquidaciones = async (): Promise<ApiResponse<GruposLiquidaciones[]>> => {
  return await apiGet<GruposLiquidaciones[]>(`/liquidaciones/buscar-grupos-liquidaciones`);
};

export const aprobarGrupoLiquidacion = async (idGrupoLiquidacion: number): Promise<ApiResponse<GruposLiquidaciones>> => {
  return await apiPost<GruposLiquidaciones>(`/liquidaciones/${idGrupoLiquidacion}/liquidar-grupo`);
};

export const desintegrarGrupoLiquidacion = async (idGrupoLiquidacion: number): Promise<ApiResponse<GruposLiquidaciones>> => {
  return await apiDelete<GruposLiquidaciones>(`/liquidaciones/${idGrupoLiquidacion}/desintegrar-grupo`);
};

export const cambiarEstadoExportacion = async (idGrupoLiquidacion: number, data: UpdateGrupoLiquidacionEstadoDto): Promise<ApiResponse<GruposLiquidaciones>> => {
  return await apiPatch<GruposLiquidaciones>(`/liquidaciones/${idGrupoLiquidacion}/cambiar-estado`, data);
};