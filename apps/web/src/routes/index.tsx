import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Lock, User } from "lucide-react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export const Route = createFileRoute("/")({
  component: Index,
  beforeLoad: async ({ location, context }) => {
    console.log("beforeLoad", location, context);
  },
});

function Index() {
  const navigate = useNavigate();
  return (
    <AuthLayout>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
        <p className="text-gray-600">
          Ingrese sus credenciales para acceder al sistema
        </p>
      </div>
      <form className="space-y-4">
        <Input
          label="Usuario"
          placeholder="Ingrese su nombre de usuario"
          icon={User}
          type="text"
          id="username"
        />

        <Input
          label="Contraseña"
          placeholder="Ingrese su contraseña"
          icon={Lock}
          type="password"
          id="password"
        />
        <div className="text-right">
          <Link
            to="/recuperar"
            type="button"
            onClick={() => console.log("forgot password")}
            className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ¿Olvidó su contraseña?
          </Link>
        </div>

        <Button type="submit" onClick={() => navigate({ to: "/dashboard" })}>
          Iniciar Sesión
        </Button>
      </form>
    </AuthLayout>
  );
}
