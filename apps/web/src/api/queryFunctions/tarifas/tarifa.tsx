import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTarifa,
  deleteTarifa,
  descargarExcel,
  enviarExcelPorCorreo,
  getTarifaById,
  getTarifasActivo,
  getTarifasByPeriodo,
  getTarifasPeriodoActivo,
  getTarifasPeriodoActivoByIdTipoServicio,
  saveTarifas,
  updateTarifa,
} from "../../functions/tarifas/tarifa";
import type {
  CreateTarifaDto,
  SaveTarifaDto,
  UpdateTarifaDto,
} from "../../dtos/tarifas";
import type { ApiResponse } from "../../types";
import type { Tarifa } from "../../types/periodo";
import { toast } from "sonner";
import { queryClient } from "../../../App";
import type { EnviarCorreoDto } from "../../dtos/common";

export const useTarifas = (
  idPeriodo: number,
): UseQueryResult<ApiResponse<Tarifa[]>, Error> => {
  return useQuery({
    queryKey: ["tarifas"],
    queryFn: () => getTarifasByPeriodo(idPeriodo, { pagination: false }),
  });
};

export const useTarifasActivo = (
  idPeriodo: number,
): UseQueryResult<ApiResponse<Tarifa[]>, Error> => {
  return useQuery({
    queryKey: ["tarifas-activo", idPeriodo],
    queryFn: () => getTarifasActivo(idPeriodo, { pagination: false }),
  });
};

export const useTarifaById = (
  id: number,
): UseMutationResult<ApiResponse<Tarifa>, Error, number> => {
  return useMutation({
    mutationKey: ["tarifa-by-id", id],
    mutationFn: (id: number) => getTarifaById(id),
  });
};

export const useCrearTarifa = (): UseMutationResult<
  ApiResponse,
  Error,
  CreateTarifaDto
> => {
  return useMutation({
    mutationKey: ["crear-tarifa"],
    mutationFn: (data: CreateTarifaDto) => createTarifa(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tarifa creada correctamente");
        queryClient.invalidateQueries({
          queryKey: ["tarifas", data.data.idPeriodo],
        });
      } else {
        throw new Error(data.message || "Error al crear la tarifa");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear la tarifa");
    },
  });
};

export const useGuardarTarifas = (): UseMutationResult<
  ApiResponse,
  Error,
  SaveTarifaDto
> => {
  return useMutation({
    mutationKey: ["guardar-tarifas"],
    mutationFn: (data: SaveTarifaDto) => saveTarifas(data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Tarifas guardadas correctamente");
        queryClient.invalidateQueries({
          queryKey: ["tarifas", data.data.idPeriodo],
        });
      } else {
        throw new Error(data.message || "Error al guardar las tarifas");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al guardar las tarifas");
    },
  });
};

export const useTarifasPeriodoActivo = (): UseQueryResult<
  ApiResponse<Tarifa[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tarifas-periodo-activo"],
    queryFn: () => getTarifasPeriodoActivo({ pagination: false }),
  });
};

export const useTarifasPeriodoActivoByIdTipoServicio = (): UseMutationResult<
  ApiResponse<Tarifa[]>,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["tarifas-periodo-activo-id-tipo-servicio"],
    mutationFn: (idTipoServicio: number) =>
      getTarifasPeriodoActivoByIdTipoServicio(idTipoServicio, {
        pagination: false,
      }),
  });
};

export const useActualizarTarifa = (): UseMutationResult<
  ApiResponse,
  Error,
  { id: number; data: UpdateTarifaDto }
> => {
  return useMutation({
    mutationKey: ["actualizar-tarifa"],
    mutationFn: ({ id, data }: { id: number; data: UpdateTarifaDto }) =>
      updateTarifa(id, data),
    onSuccess: (data) => {
      // if (data.status === 200 || data.status === 201) {
      //   toast.success("Tarifa actualizada correctamente");
      //   queryClient.invalidateQueries({
      //     queryKey: ["tarifas", data.data.idPeriodo],
      //   });
      // } else {
      //   throw new Error(data.message || "Error al actualizar la tarifa");
      // }
      // TODO: revisar esto
      toast.success("Tarifa actualizada correctamente");
      queryClient.invalidateQueries({
        queryKey: ["tarifas", data.data.idPeriodo],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar la tarifa");
    },
  });
};

export const useEliminarTarifa = (): UseMutationResult<
  ApiResponse,
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["eliminar-tarifa"],
    mutationFn: (id: number) => deleteTarifa(id),
    onSuccess: (data) => {
      // if (data.status === 200 || data.status === 201) {
      //   toast.success("Tarifa eliminada correctamente");
      //   queryClient.invalidateQueries({
      //     queryKey: ["tarifas", data.data.idPeriodo],
      //   });
      // } else {
      //   throw new Error(data.message || "Error al eliminar la tarifa");
      // }
      // TODO: revisar esto
      toast.success("Tarifa eliminada correctamente");
      queryClient.invalidateQueries({
        queryKey: ["tarifas"],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar la tarifa");
    },
  });
};

// generacion de archivos
export const useEnviarExcelPorCorreo = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { id: number; data: EnviarCorreoDto }
> => {
  return useMutation({
    mutationKey: ["enviar-excel-por-correo"],
    mutationFn: ({ id, data }) => enviarExcelPorCorreo(id, data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Excel enviado por correo correctamente");
        queryClient.invalidateQueries({
          queryKey: ["enviar-excel-por-correo"],
        });
      } else {
        throw new Error(data.message || "Error al enviar el Excel por correo");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error al enviar el Excel por correo");
    },
  });
};

export const useDescargarExcel = (): UseMutationResult<
  { blob: Blob; filename: string },
  Error,
  number
> => {
  return useMutation({
    mutationKey: ["descargar-excel"],
    mutationFn: (id: number) => descargarExcel(id),
    onSuccess: ({ blob, filename }) => {
      // Create a download link from the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel descargado correctamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al descargar el Excel");
    },
  });
};
