import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Mail } from "lucide-react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export const Route = createFileRoute("/recuperar")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
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

      <form className="space-y-4">
        <Input
          label="Correo Electrónico"
          placeholder="Ingrese su correo electrónico"
          icon={Mail}
          type="email"
          id="email"
        />

        <Button type="submit" onClick={() => navigate({ to: "/actualizar" })}>
          Recuperar
        </Button>
      </form>

      <div className="text-center">
        <Link
          to="/"
          type="button"
          onClick={() => console.log("volver a iniciar sesión")}
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          Volver a Iniciar Sesión
        </Link>
      </div>
    </AuthLayout>
  );
}
