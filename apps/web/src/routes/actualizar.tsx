import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Lock } from "lucide-react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useState } from "react";
import { useForm } from "../hooks/useForm";

export const Route = createFileRoute("/actualizar")({
  component: RouteComponent,
  beforeLoad: async ({ context }: any) => {
    if (!context?.auth?.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const { form, handleChange } = useForm({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    console.log("Contraseña actualizada exitosamente");
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Contraseña"
          placeholder="Ingrese su nueva contraseña"
          icon={Lock}
          type="password"
          id="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <Input
          label="Confirmar Contraseña"
          placeholder="Confirme su nueva contraseña"
          icon={Lock}
          type="password"
          id="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        <Button type="submit" onClick={() => navigate({ to: "/" })}>
          Actualizar Contraseña
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
