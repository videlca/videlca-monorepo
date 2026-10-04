import { createFileRoute, redirect } from "@tanstack/react-router";
import { RouterLink } from "../components/ui/common/RouterLink";
import LockOutlined from "@mui/icons-material/LockOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import Typography from "@mui/material/Typography";
import { AuthLayout } from "../components/layout/AuthLayout";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useLogin } from "../api/queryFunctions/auth";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/")({
  component: Index,
  beforeLoad: async ({ context }: any) => {
    if (context?.auth?.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

interface LoginForm {
  email: string;
  clave: string;
}

function Index() {
  const mutation = useLogin();
  const { register, handleSubmit } = useForm<LoginForm>({
    defaultValues: {
      email: "",
      clave: "",
    },
  });

  const onSubmit = (data: LoginForm) => {
    mutation.mutate({
      email: data.email,
      clave: data.clave,
    });
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <Typography variant="h2">Iniciar Sesión</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Ingrese sus credenciales para acceder al sistema
        </Typography>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Usuario"
          placeholder="Ingrese su nombre de usuario"
          icon={PersonOutlined}
          type="text"
          id="email"
          {...register("email")}
        />

        <Input
          label="Contraseña"
          placeholder="Ingrese su contraseña"
          icon={LockOutlined}
          type="password"
          id="clave"
          {...register("clave")}
        />
        <div className="text-right">
          <RouterLink to="/recuperar" variant="body2" underline="hover">
            ¿Olvidó su contraseña?
          </RouterLink>
        </div>

        <Button
          type="submit"
          loading={mutation.isPending}
          fullWidth
          size="large"
        >
          {mutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
    </AuthLayout>
  );
}
