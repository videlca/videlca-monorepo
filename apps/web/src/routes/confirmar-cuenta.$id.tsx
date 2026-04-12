import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Lock } from "lucide-react";
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
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Confirmar Cuenta
        </h2>
        <p className="text-gray-600">
          Ingrese su contraseña para confirmar su cuenta
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Contraseña"
          placeholder="Ingrese su contraseña"
          icon={Lock}
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
          icon={Lock}
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
        <Button type="submit">Confirmar Cuenta</Button>
      </form>

      <div className="text-center">
        <Link
          to="/"
          type="button"
          onClick={() => navigate({ to: "/", replace: true })}
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          Volver a Iniciar Sesión
        </Link>
      </div>
    </AuthLayout>
  );
}
