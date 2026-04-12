import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { User } from "lucide-react";
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
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Recuperar Contraseña
        </h2>
        <p className="text-gray-600">
          Ingrese su número de identificación para recuperar su contraseña
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Número de identificación"
          placeholder="Ingrese su número de identificación"
          icon={User}
          type="text"
          id="numeroIdentificacion"
          {...register("numeroIdentificacion")}
        />

        <Button type="submit">Recuperar</Button>
      </form>

      <div className="text-center">
        <Link
          to="/"
          type="button"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          Volver a Iniciar Sesión
        </Link>
      </div>
    </AuthLayout>
  );
}
