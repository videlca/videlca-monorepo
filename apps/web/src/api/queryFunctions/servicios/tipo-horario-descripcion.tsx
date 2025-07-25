import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { getTipoHorarioDescripcion } from "../../functions/servicios";
import type { ApiResponse } from "../../types/common";
import type { TipoHorarioDescripcion } from "../../types/servicio";

export const useTipoHorarioDescripcion = (): UseQueryResult<
  ApiResponse<TipoHorarioDescripcion[]>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-horario-descripcion"],
    queryFn: () => getTipoHorarioDescripcion({ pagination: false }),
  });
};
