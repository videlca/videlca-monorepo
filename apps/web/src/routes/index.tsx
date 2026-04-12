import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Lock, User } from "lucide-react";
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
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
        <p className="text-gray-600">
          Ingrese sus credenciales para acceder al sistema
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Usuario"
          placeholder="Ingrese su nombre de usuario"
          icon={User}
          type="text"
          id="email"
          {...register("email")}
        />

        <Input
          label="Contraseña"
          placeholder="Ingrese su contraseña"
          icon={Lock}
          type="password"
          id="clave"
          {...register("clave")}
        />
        <div className="text-right">
          <Link
            to="/recuperar"
            className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ¿Olvidó su contraseña?
          </Link>
        </div>

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
    </AuthLayout>
  );
}
