import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getActiveRoles } from "../../functions/permisos";
import type { ApiResponse } from "../../types/common";
import type { Rol } from "../../../types";

export const useActiveRoles = (): UseQueryResult<ApiResponse<Rol[]>, Error> => {
  return useQuery({
    queryKey: ["active-roles"],
    queryFn: () => getActiveRoles({ pagination: false }),
  });
};
