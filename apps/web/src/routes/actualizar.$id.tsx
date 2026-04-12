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
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Actualizar Contraseña
        </h2>
        <p className="text-gray-600">
          Ingrese su nueva contraseña para continuar
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Contraseña"
          placeholder="Ingrese su nueva contraseña"
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
          placeholder="Confirme su nueva contraseña"
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
        <Button type="submit">Actualizar Contraseña</Button>
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
