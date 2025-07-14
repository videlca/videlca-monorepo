import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Lock, User } from "lucide-react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useLogin } from "../api/queryFunctions/auth";
import { useForm } from "../hooks/useForm";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/")({
  component: Index,
  beforeLoad: async ({ context }: any) => {
    if (context?.auth?.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function Index() {
  const mutation = useLogin();
  const router = useRouter();
  const { form, handleChange } = useForm({
    email: "",
    clave: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate({
      email: form.email,
      clave: form.clave,
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
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Usuario"
          placeholder="Ingrese su nombre de usuario"
          icon={User}
          type="text"
          id="email"
          value={form.email}
          onChange={handleChange}
        />

        <Input
          label="Contraseña"
          placeholder="Ingrese su contraseña"
          icon={Lock}
          type="password"
          id="clave"
          value={form.clave}
          onChange={handleChange}
        />
        <div className="text-right">
          <Link
            to="/recuperar"
            className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ¿Olvidó su contraseña?
          </Link>
        </div>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
    </AuthLayout>
  );
}
