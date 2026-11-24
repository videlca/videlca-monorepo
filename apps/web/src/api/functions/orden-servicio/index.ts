import { apiDelete, apiGet, apiPatch, apiPost, axiosClient } from "../../config";
import type { CreateObservacionOrdenServicioDto, CrearOrdenConCorreoDto, EnviarCorreoDto, PaginationDto, PrecioOrdenDto, UpdateObservacionOrdenServicioDto, UpdateOrdenServicioDto, UpdateValidarFechaOrdenServicioDto, ValidarEmpleadosDisponiblesDto, ValidarFechasOrdenServicioDto, ValidarHorarioServicioDto, ValidarIdOrdenServicioDto, ValidarRangoHorarioPersonalOrdenDto } from "../../dtos"
import type { ApiResponse, Personal , PaginatedResponse } from "../../types/common";
import type { DestinatariosCreacionOrden, MesesLiquidadosOrden, OrdenServicio, OrdenServicioId, PrecioOrdenResponse } from "../../types/orden-servicio";
import type { LiquidacionesOrdenPage } from "../../types/liquidaciones";

// Crea la orden y envia el correo de creacion en una sola peticion multipart (lleva las imagenes del correo). La
// orden va como JSON en el campo "orden" y los destinatarios como arreglo JSON
export const createOrdenServicio = async ({ orden, mensaje, destinatarios, imagenes }: CrearOrdenConCorreoDto): Promise<ApiResponse<OrdenServicio>> => {
  const formData = new FormData();
  formData.append("orden", JSON.stringify(orden));
  if (mensaje.trim()) formData.append("mensaje", mensaje.trim());
  if (destinatarios) formData.append("destinatarios", JSON.stringify(destinatarios));
  imagenes.forEach((imagen) => formData.append("imagenes", imagen, imagen.name));
  return await apiPost<OrdenServicio>("/orden-servicio", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// Destinatarios del correo de creacion: contactos del puesto, del cliente y correos de aplicacion, sin repetidos
export const getDestinatariosCreacionOrden = async (params: { idLocacion?: number; idCliente?: number }): Promise<ApiResponse<DestinatariosCreacionOrden>> => {
  return await apiGet<DestinatariosCreacionOrden>("/orden-servicio/destinatarios-creacion", params);
}

export const updateOrdenServicio = async (id: number, data: UpdateOrdenServicioDto): Promise<ApiResponse<OrdenServicio>> => {
  return await apiPatch<OrdenServicio>(`/orden-servicio/${id}`, data);
}

export const getOrdenesServicio = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<OrdenServicio[]>>> => {
  return await apiGet<PaginatedResponse<OrdenServicio[]>>("/orden-servicio", pagination);
}

export const getFilteredOrdenesServicio = async (filter: any): Promise<ApiResponse<PaginatedResponse<OrdenServicio[]>>> => {
  return await apiGet<PaginatedResponse<OrdenServicio[]>>("/orden-servicio/filter", filter);
}

export const getOrdenServicioById = async (id: number): Promise<ApiResponse<OrdenServicio>> => {
  return await apiGet<OrdenServicio>(`/orden-servicio/${id}`);
}

// Meses ya liquidados de la orden (para advertir al editarla)
export const getMesesLiquidadosOrden = async (id: number): Promise<ApiResponse<MesesLiquidadosOrden>> => {
  return await apiGet<MesesLiquidadosOrden>(`/orden-servicio/${id}/meses-liquidados`);
}

export const deleteOrdenServicio = async (id: number): Promise<ApiResponse<any>> => {
  return await apiDelete<any>(`/orden-servicio/${id}`);
}

// Historial de liquidaciones (una por mes) de una orden especifica, paginado
export const getLiquidacionesByOrdenId = async (ordenId: number, page: number, limit: number): Promise<ApiResponse<LiquidacionesOrdenPage>> => {
  return await apiGet<LiquidacionesOrdenPage>(`/orden-servicio/${ordenId}/liquidaciones`, { page, limit });
}

export const cancelarOrdenServicio = async (id: number): Promise<ApiResponse<any>> => {
  return await apiPatch<any>(`/orden-servicio/cancelar-orden/${id}`);
}

export const anularOrdenServicio = async (id: number): Promise<ApiResponse<any>> => {
  return await apiPatch<any>(`/orden-servicio/anular-orden/${id}`);
}

// TODO: revisar respuesta
export const validateFechasOrdenServicio = async (data: ValidarFechasOrdenServicioDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/orden-servicio/validacion-fechas", data);
}

export const getPrecioOrdenServicio = async (data: PrecioOrdenDto): Promise<ApiResponse<PrecioOrdenResponse>> => {
  return await apiPost<PrecioOrdenResponse>("/orden-servicio/obtener-precio", data);
}

// Observaciones orden servicio
export const createObservacionOrdenServicio = async (data: CreateObservacionOrdenServicioDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/observaciones-orden-servicio", data);
}

export const getComentariosOrdenServicio = async (id: number): Promise<ApiResponse<any>> => {
  return await apiGet<any>(`/observaciones-orden-servicio/obtener-comentarios/${id}`);
}

export const getObservacionOrdenServicioById = async (id: number): Promise<ApiResponse<any>> => {
  return await apiGet<any>(`/observaciones-orden-servicio/${id}`);
}

export const updateObservacionOrdenServicio = async (id: number, data: UpdateObservacionOrdenServicioDto): Promise<ApiResponse<any>> => {
  return await apiPatch<any>(`/observaciones-orden-servicio/${id}`, data);
}

export const deleteObservacionOrdenServicio = async (id: number): Promise<ApiResponse<any>> => {
  return await apiDelete<any>(`/observaciones-orden-servicio/${id}`);
}

// Identificadores orden servicio
export const validarIdOrdenServicio = async (data: ValidarIdOrdenServicioDto): Promise<ApiResponse<OrdenServicioId>> => {
  return await apiPost<OrdenServicioId>("/orden-servicio/validacion-id", data);
}
// Validar empleados disponibles
export const validarEmpleadosDisponibles = async (data: ValidarEmpleadosDisponiblesDto): Promise<ApiResponse> => {
  return await apiPost<Personal[]>("/orden-servicio/empleados-disponibles", data);
};

// Validacion horarios servicio orden de servicio
export const validarHorarioServicioOrdenServicio = async (data: ValidarHorarioServicioDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/orden-servicio/validacion-horarios", data);
}

export const validarRangoHorarioPersonalOrdenServicio = async (data: ValidarRangoHorarioPersonalOrdenDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>("/orden-servicio/validar-rango-horarios-orden", data);
}

export const updateValidarFechasOrdenServicio = async (id: number, data: UpdateValidarFechaOrdenServicioDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>(`/orden-servicio/update-validacion-fechas/${id}`, data);
}

// generacion de archivos

export const enviarPdfPorCorreo = async (id: number, data: EnviarCorreoDto): Promise<ApiResponse<any>> => {
  return await apiPost<any>(`/orden-servicio/${id}/enviar-pdf`, data);
}

export const descargarPdf = async (id: number): Promise<{ blob: Blob; filename: string }> => {
  const response = await axiosClient.get(`/orden-servicio/${id}/generar-pdf`, {
    responseType: 'blob',
  });
  let filename = `orden-servicio-${id}.pdf`;
  const contentDisposition = response.headers['content-disposition'];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }

  return { blob: response.data, filename };
}

export const imprimirPdf = async (id: number): Promise<ApiResponse<{ file: string, fileName: string }>> => {
  return await apiPost<{ file: string, fileName: string }>(`/orden-servicio/${id}/imprimir-pdf`);
}
