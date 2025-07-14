import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  login,
  logout,
  recoverPassword,
  updatePassword,
  validateToken,
} from "../../functions/auth";
import type { loginUserDto } from "../../dtos";
import { useNavigate } from "@tanstack/react-router";
import { queryClient } from "../../../App";
import { useAuth } from "../../../context/AuthContext";
import type { ApiResponse } from "../../types/common";

export const useLogin = (): UseMutationResult<
  ApiResponse,
  Error,
  loginUserDto
> => {
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: loginUserDto) => login(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["login"] });
      setIsAuthenticated(true);
      console.log(data);
      if (data.status === 200) {
        console.log("success");
        navigate({ to: "/dashboard", replace: true });
      } else {
        throw new Error(data.message || "Error al iniciar sesión");
      }
    },
    onError: (error) => {
      console.log(error);
    },
  });
};

export const useLogout = (): UseMutationResult<ApiResponse, Error, void> => {
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

export const useRecoverPassword = (): UseMutationResult<
  ApiResponse,
  Error,
  { numeroIdentificacion: string }
> => {
  return useMutation({
    mutationFn: (data: { numeroIdentificacion: string }) =>
      recoverPassword(data),
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (error) => {
      console.log(error);
    },
  });
};

export const useValidateToken = (
  token: string,
): UseQueryResult<ApiResponse, Error> => {
  return useQuery({
    queryKey: ["validateToken", token],
    queryFn: () => validateToken(token),
    enabled: !!token,
  });
};

export const useUpdatePassword = (): UseMutationResult<
  ApiResponse,
  Error,
  { token: string; data: { clave: string; confirmarClave: string } }
> => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: {
      token: string;
      data: { clave: string; confirmarClave: string };
    }) => updatePassword(data.token, data.data),
    onSuccess: (data) => {
      if (data.status === 200) {
        navigate({ to: "/", replace: true });
      } else {
        throw new Error(data.message || "Error al actualizar contraseña");
      }
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
