import { RouterLink } from "../components/ui/common/RouterLink";
import LockOutlined from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import {
  createFileRoute,
  redirect,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useForm } from "react-hook-form";
import { useUpdatePassword } from "../api/queryFunctions/auth";

export const Route = createFileRoute("/actualizar/$id")({
  component: RouteComponent,
  beforeLoad: async ({ context }: any) => {
    if (context?.auth?.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

interface UpdatePasswordForm {
  clave: string;
  confirmarClave: string;
}

function RouteComponent() {
  const { id } = useParams({ from: "/actualizar/$id" });
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdatePasswordForm>({
    defaultValues: {
      clave: "",
      confirmarClave: "",
    },
  });
  const mutation = useUpdatePassword();

  const onSubmit = (data: UpdatePasswordForm) => {
    mutation.mutate({
      token: id as string,
      data: {
        clave: data.clave,
        confirmarClave: data.confirmarClave,
      },
    });
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <Typography variant="h2">Actualizar Contraseña</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Ingrese su nueva contraseña para continuar
        </Typography>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Contraseña"
          placeholder="Ingrese su nueva contraseña"
          icon={LockOutlined}
          type="password"
          id="clave"
          required
          {...register("clave", {
            required: "La contraseña es requerida",
            minLength: {
              value: 6,
              message: "La contraseña debe tener al menos 6 caracteres",
            },
          })}
          error={errors.clave?.message}
        />
        <Input
          label="Confirmar Contraseña"
          placeholder="Confirme su nueva contraseña"
          icon={LockOutlined}
          type="password"
          id="confirmarClave"
          required
          {...register("confirmarClave", {
            required: "Confirmar contraseña es requerido",
            validate: (value) =>
              value === watch("clave") || "Las contraseñas no coinciden",
          })}
          error={errors.confirmarClave?.message}
        />
        <Button
          type="submit"
          loading={mutation.isPending}
          fullWidth
          size="large"
        >
          Actualizar Contraseña
        </Button>
      </form>

      <div className="text-center">
        <RouterLink
          to="/"
          onClick={() => navigate({ to: "/", replace: true })}
          variant="body2"
          underline="hover"
        >
          Volver a Iniciar Sesión
        </RouterLink>
      </div>
    </AuthLayout>
  );
}
