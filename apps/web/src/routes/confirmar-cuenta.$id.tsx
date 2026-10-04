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
import { useConfirmarCuenta } from "../api/queryFunctions/auth";

export const Route = createFileRoute("/confirmar-cuenta/$id")({
  component: RouteComponent,
  beforeLoad: async ({ context }: any) => {
    if (context?.auth?.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

interface ConfirmarCuentaForm {
  clave: string;
  confirmarClave: string;
}

function RouteComponent() {
  const { id } = useParams({ from: "/confirmar-cuenta/$id" });
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ConfirmarCuentaForm>({
    defaultValues: {
      clave: "",
      confirmarClave: "",
    },
  });
  const mutation = useConfirmarCuenta();

  const onSubmit = (data: ConfirmarCuentaForm) => {
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
        <Typography variant="h2">Confirmar Cuenta</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Ingrese su contraseña para confirmar su cuenta
        </Typography>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Contraseña"
          placeholder="Ingrese su contraseña"
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
          placeholder="Confirme su contraseña"
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
          Confirmar Cuenta
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
