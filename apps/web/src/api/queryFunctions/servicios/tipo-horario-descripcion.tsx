import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  getTipoHorarioDescripcion,
  getTipoHorarioDescripcionDiurnoNocturno,
} from "../../functions/servicios";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { TipoHorarioDescripcion } from "../../types/servicio";

export const useTipoHorarioDescripcion = (): UseQueryResult<
  ApiResponse<PaginatedResponse<TipoHorarioDescripcion[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-horario-descripcion"],
    queryFn: () => getTipoHorarioDescripcion({ pagination: 'false' }),
  });
};

export const useTipoHorarioDescripcionDiurnoNocturno = (): UseQueryResult<
  ApiResponse<PaginatedResponse<TipoHorarioDescripcion[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-horario-descripcion-diurno-nocturno"],
    queryFn: () =>
      getTipoHorarioDescripcionDiurnoNocturno({ pagination: 'false' }),
  });
};
