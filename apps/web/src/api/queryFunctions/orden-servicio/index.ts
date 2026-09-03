import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { anularOrdenServicio, cancelarOrdenServicio, createOrdenServicio, deleteOrdenServicio, descargarPdf, enviarPdfPorCorreo, getLiquidacionesByOrdenId, getOrdenesServicio, getOrdenServicioById, getPrecioOrdenServicio, imprimirPdf, updateOrdenServicio, updateValidarFechasOrdenServicio, validarEmpleadosDisponibles, validarHorarioServicioOrdenServicio, validarIdOrdenServicio, validarRangoHorarioPersonalOrdenServicio, validateFechasOrdenServicio, getFilteredOrdenesServicio } from "../../functions/orden-servicio";
import type { CreateOrdenServicioDto, EnviarCorreoDto, PaginationDto, PrecioOrdenDto, UpdateOrdenServicioDto, UpdateValidarFechaOrdenServicioDto, ValidarEmpleadosDisponiblesDto, ValidarFechasOrdenServicioDto, ValidarHorarioServicioDto, ValidarIdOrdenServicioDto, ValidarRangoHorarioPersonalOrdenDto } from "../../dtos";
import type { OrdenServicio, OrdenServicioId, PrecioOrdenResponse } from "../../types/orden-servicio";
import type { LiquidacionesOrdenPage } from "../../types/liquidaciones";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";
import { queryClient } from "../../../App";
import type { Personal } from "../../types";

export const useCreateOrdenServicio = (): UseMutationResult<ApiResponse<OrdenServicio>, Error, CreateOrdenServicioDto> => {
  return useMutation({
    mutationFn: createOrdenServicio,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Orden de servicio creada correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
        queryClient.invalidateQueries({
          queryKey: ["next-id-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al crear la orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al crear la orden de servicio");
    },
  });
}

export const useUpdateOrdenServicio = (): UseMutationResult<ApiResponse<OrdenServicio>, Error, { id: number; data: UpdateOrdenServicioDto }> => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrdenServicioDto }) => updateOrdenServicio(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Orden de servicio actualizada correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al actualizar la orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar la orden de servicio");
    },
  });
}

export const useGetOrdenesServicio = (paginationParams: PaginationDto = { pagination: 'false' }): UseQueryResult<ApiResponse<PaginatedResponse<OrdenServicio[]>>, Error> => {
  return useQuery({
    queryKey: ["orden-servicio", paginationParams],
    queryFn: () => getOrdenesServicio(paginationParams),
  });
}

export const useFilterOrdenesServicio = (): UseMutationResult<ApiResponse<PaginatedResponse<OrdenServicio[]>>, Error, any> => {
  return useMutation({
    mutationFn: (filter: any) => getFilteredOrdenesServicio(filter),
    onError: (error) => {
      showErrorToast(error.message, "Error al filtrar ordenes de servicio");
    },
  });
}

export const useGetOrdenServicioById = (): UseMutationResult<ApiResponse<OrdenServicio>, Error, number> => {
  return useMutation({
    mutationFn: (id: number) => getOrdenServicioById(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Orden de servicio obtenida correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al obtener la orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al obtener la orden de servicio");
    },
  });
}

// Historial de liquidaciones (una por mes) de una orden especifica, paginado
export const useGetLiquidacionesByOrdenId = (ordenId: number, page: number, limit: number, enabled: boolean): UseQueryResult<ApiResponse<LiquidacionesOrdenPage>, Error> => {
  return useQuery({
    queryKey: ["orden-servicio-liquidaciones", ordenId, page, limit],
    queryFn: () => getLiquidacionesByOrdenId(ordenId, page, limit),
    enabled: !!ordenId && enabled,
  });
}

export const useCancelarOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, number> => {
  return useMutation({
    mutationFn: (id: number) => cancelarOrdenServicio(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Orden de servicio cancelada correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al cancelar la orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al cancelar la orden de servicio");
    },
  });
}

export const useAnularOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, number> => {
  return useMutation({
    mutationFn: (id: number) => anularOrdenServicio(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Orden de servicio anulada correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al anular la orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al anular la orden de servicio");
    },
  });
}

export const useDeleteOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, number> => {
  return useMutation({
    mutationFn: (id: number) => deleteOrdenServicio(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Orden de servicio eliminada correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
        queryClient.invalidateQueries({
          queryKey: ["next-id-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al eliminar la orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al eliminar la orden de servicio");
    },
  });
}

export const useValidateFechasOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, ValidarFechasOrdenServicioDto> => {
  return useMutation({
    mutationFn: validateFechasOrdenServicio,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Horarios validados correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al validar los horarios");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al validar los horarios");
    },
  });
}

export const useUpdateValidateFechasOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, { id: number, data: UpdateValidarFechaOrdenServicioDto }> => {
  return useMutation({
    mutationFn: ({ id, data }) => updateValidarFechasOrdenServicio(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Fechas validadas correctamente");
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al actualizar las fechas validadas");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar las fechas validadas");
    },
  });
}

export const useGetPrecioOrdenServicio = (): UseMutationResult<ApiResponse<PrecioOrdenResponse>, Error, PrecioOrdenDto> => {
  return useMutation({
    mutationFn: getPrecioOrdenServicio,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({
          queryKey: ["orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al obtener el precio de la orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al obtener el precio de la orden de servicio");
    },
  });
}

// Identificadores orden servicio
export const useValidarIdOrdenServicio = (): UseMutationResult<ApiResponse<OrdenServicioId>, Error, ValidarIdOrdenServicioDto> => {
  return useMutation({
    mutationFn: validarIdOrdenServicio,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Identificador de orden de servicio validado correctamente");
        queryClient.invalidateQueries({
          queryKey: ["identificadores-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al validar el identificador de la orden de servicio");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al validar el identificador de la orden de servicio");
    },
  });
}

// Validar empleados disponibles
export const useValidarEmpleadosDisponibles = (): UseMutationResult<ApiResponse<PaginatedResponse<Personal[]>>, Error, ValidarEmpleadosDisponiblesDto> => {
  return useMutation({
    mutationKey: ["validar-empleados-disponibles"],
    mutationFn: validarEmpleadosDisponibles,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Empleados disponibles validados correctamente");
        queryClient.invalidateQueries({
          queryKey: ["validar-empleados-disponibles"],
        });
      } else {
        showErrorToast(data.message, "Error al validar los empleados disponibles");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al validar los empleados disponibles");
    },
  });
}

export const useValidarHorarioServicioOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, ValidarHorarioServicioDto> => {
  return useMutation({
    mutationKey: ["validar-horario-servicio-orden-servicio"],
    mutationFn: validarHorarioServicioOrdenServicio,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({
          queryKey: ["validar-horario-servicio-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al validar los horarios");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al validar los horarios");
    },
  });
}

export const useValidarRangoHorarioPersonalOrdenServicio = (): UseMutationResult<ApiResponse<any>, Error, ValidarRangoHorarioPersonalOrdenDto> => {
  return useMutation({
    mutationKey: ["validar-rango-horario-personal-orden-servicio"],
    mutationFn: validarRangoHorarioPersonalOrdenServicio,
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        queryClient.invalidateQueries({
          queryKey: ["validar-rango-horario-personal-orden-servicio"],
        });
      } else {
        showErrorToast(data.message, "Error al validar el rango horario personal");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al validar el rango horario personal");
    },
  });
}

// generacion de archivos
export const useEnviarPdfPorCorreo = (): UseMutationResult<ApiResponse<any>, Error, { id: number, data: EnviarCorreoDto }> => {
  return useMutation({
    mutationKey: ["enviar-pdf-por-correo"],
    mutationFn: ({ id, data }) => enviarPdfPorCorreo(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("PDF enviado por correo correctamente");
        queryClient.invalidateQueries({
          queryKey: ["enviar-pdf-por-correo"],
        });
      } else {
        showErrorToast(data.message, "Error al enviar el PDF por correo");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al enviar el PDF por correo");
    },
  });
}

export const useDescargarPdf = (): UseMutationResult<{ blob: Blob; filename: string }, Error, number> => {
  return useMutation({
    mutationKey: ["descargar-pdf"],
    mutationFn: (id: number) => descargarPdf(id),
    onSuccess: ({ blob, filename }) => {
      // Create a download link from the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF descargado correctamente");
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al descargar el PDF");
    },
  });
}

export const useImprimirPdf = (): UseMutationResult<ApiResponse<{ file: string, fileName: string }>, Error, number> => {
  return useMutation({
    mutationKey: ["imprimir-pdf"],
    mutationFn: (id: number) => imprimirPdf(id),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("PDF impreso correctamente");
        queryClient.invalidateQueries({
          queryKey: ["imprimir-pdf"],
        });
      } else {
        showErrorToast(data.message, "Error al imprimir el PDF");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al imprimir el PDF");
    },
  });
}