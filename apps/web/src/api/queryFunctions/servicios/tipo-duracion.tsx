import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { getTipoDuracion } from "../../functions/servicios";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { TipoDuracion } from "../../types/servicio";

export const useTipoDuracion = (): UseQueryResult<
  ApiResponse<PaginatedResponse<TipoDuracion[]>>,
  Error
> => {
  return useQuery({
    queryKey: ["tipo-duracion"],
    queryFn: () => getTipoDuracion({ pagination: 'false' }),
  });
};
