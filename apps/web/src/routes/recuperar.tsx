import { createFileRoute, redirect } from "@tanstack/react-router";
import { RouterLink } from "../components/ui/common/RouterLink";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import Typography from "@mui/material/Typography";
import { AuthLayout } from "../components/layout/AuthLayout";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useForm } from "react-hook-form";
import { useRecoverPassword } from "../api/queryFunctions/auth";

export const Route = createFileRoute("/recuperar")({
  component: RouteComponent,
  beforeLoad: async ({ context }: any) => {
    if (context?.auth?.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

interface RecoverForm {
  numeroIdentificacion: string;
}

function RouteComponent() {
  const { register, handleSubmit } = useForm<RecoverForm>({
    defaultValues: {
      numeroIdentificacion: "",
    },
  });

  const mutation = useRecoverPassword();

  const onSubmit = (data: RecoverForm) => {
    mutation.mutate({
      numeroIdentificacion: data.numeroIdentificacion,
    });
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <Typography variant="h2">Recuperar Contraseña</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Ingrese su número de identificación para recuperar su contraseña
        </Typography>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Número de identificación"
          placeholder="Ingrese su número de identificación"
          icon={PersonOutlined}
          type="text"
          id="numeroIdentificacion"
          {...register("numeroIdentificacion")}
        />

        <Button
          type="submit"
          loading={mutation.isPending}
          fullWidth
          size="large"
        >
          Recuperar
        </Button>
      </form>

      <div className="text-center">
        <RouterLink to="/" variant="body2" underline="hover">
          Volver a Iniciar Sesión
        </RouterLink>
      </div>
    </AuthLayout>
  );
}
