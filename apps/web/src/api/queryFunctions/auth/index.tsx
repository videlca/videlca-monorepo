import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { login, logout } from "../../functions/auth";
import type { loginUserDto } from "../../dtos";
import { useNavigate } from "@tanstack/react-router";
import { queryClient } from "../../../App";
import { useAuth } from "../../../context/AuthContext";

export const useLogin = (): UseMutationResult<any, Error, loginUserDto> => {
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: loginUserDto) => login(data),
    onSuccess: (data) => {
      console.log(data);
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ["login"] });
    },
    onError: (error) => {
      console.log(error);
    },
    onSettled: () => {
      navigate({ to: "/dashboard" });
    },
  });
};

export const useLogout = (): UseMutationResult<any, Error, void> => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      setIsAuthenticated(false);
      queryClient.invalidateQueries({ queryKey: ["login"] });
      navigate({ to: "/" });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
