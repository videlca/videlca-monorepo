import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  confirmarCuenta,
  login,
  logout,
  recoverPassword,
  updatePassword,
  validateToken,
} from "../../functions/auth";
import type { LoginUserDto } from "../../dtos";
import { useNavigate } from "@tanstack/react-router";
import { queryClient } from "../../../App";
import { useAuth } from "../../../context/AuthContext";
import type { ApiResponse } from "../../types/common";
import { showErrorToast } from "../../utils/toastError";
import { toast } from "sonner";

export const useLogin = (): UseMutationResult<
  ApiResponse,
  Error,
  LoginUserDto
> => {
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: LoginUserDto) => login(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["login"] });
      setIsAuthenticated(true);
      if (data.status === 200) {
        toast.success("Inicio de sesión exitoso", {
          description: "Bienvenido de nuevo",
        });
        navigate({ to: "/dashboard", replace: true });
      } else {
        showErrorToast(data.message, "Error al iniciar sesión");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al iniciar sesión");
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
      toast.success("Cierre de sesión exitoso", {
        description: "Gracias por usar nuestro sistema",
      });
      navigate({ to: "/" });
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al iniciar sesión");
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
      if (data.status === 200 || data.status === 201) {
        toast.success("Recuperación de contraseña exitosa", {
          description: "Se ha enviado un correo para recuperar su contraseña",
        });
      } else {
        showErrorToast(data.message, "Error al recuperar contraseña");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al recuperar contraseña");
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
      if (data.status === 200 || data.status === 201) {
        toast.success("Contraseña actualizada exitosamente", {
          description: "Por favor, inicie sesión con su nueva contraseña",
        });
        navigate({ to: "/", replace: true });
      } else {
        showErrorToast(data.message, "Error al actualizar contraseña");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al actualizar contraseña");
    },
  });
};

export const useConfirmarCuenta = (): UseMutationResult<
  ApiResponse,
  Error,
  { token: string; data: { clave: string; confirmarClave: string } }
> => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: {
      token: string;
      data: { clave: string; confirmarClave: string };
    }) => confirmarCuenta(payload.token, payload.data),
    onSuccess: (data) => {
      if (data.status === 200 || data.status === 201) {
        toast.success("Cuenta confirmada exitosamente", {
          description: "Por favor, inicie sesión con su contraseña",
        });
        navigate({ to: "/", replace: true });
      } else {
        showErrorToast(data.message, "Error al confirmar cuenta");
      }
    },
    onError: (error) => {
      showErrorToast(error.message, "Error al confirmar cuenta");
    },
  });
};

