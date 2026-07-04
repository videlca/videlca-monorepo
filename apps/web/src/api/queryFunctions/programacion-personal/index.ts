import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getProgramacionPersonal } from "../../functions/programacion-personal";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import type { PersonalAsignado } from "../../types";

import type { PaginationDto } from "../../dtos/common";

export const useProgramacionPersonal = (paginationParams: PaginationDto = { pagination: 'false' }): UseQueryResult<ApiResponse<PaginatedResponse<PersonalAsignado[]>>> => {
  return useQuery({
    queryKey: ["programacion-personal", paginationParams],
    queryFn: () => getProgramacionPersonal(paginationParams),
  });
};