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
import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { useUpdatePassword } from "../api/queryFunctions/auth";

export const Route = createFileRoute("/actualizar/$id")({
  component: RouteComponent,
  beforeLoad: async ({ context }: any) => {
    if (context?.auth?.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function RouteComponent() {
  const { id } = useParams({ from: "/actualizar/$id" });
  const navigate = useNavigate();
  const { form, handleChange } = useForm({
    clave: "",
    confirmarClave: "",
  });
  const mutation = useUpdatePassword();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.clave !== form.confirmarClave) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (form.clave.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    mutation.mutate({
      token: id as string,
      data: {
        clave: form.clave,
        confirmarClave: form.confirmarClave,
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
          id="clave"
          value={form.clave}
          onChange={handleChange}
          required
        />
        <Input
          label="Confirmar Contraseña"
          placeholder="Confirme su nueva contraseña"
          icon={Lock}
          type="password"
          id="confirmarClave"
          value={form.confirmarClave}
          onChange={handleChange}
          required
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
