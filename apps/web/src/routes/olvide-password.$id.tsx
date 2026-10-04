import {
  createFileRoute,
  redirect,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { useValidateToken } from "../api/queryFunctions/auth";

export const Route = createFileRoute("/olvide-password/$id")({
  component: RouteComponent,
  beforeLoad: async ({ context }: any) => {
    if (context?.auth?.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function RouteComponent() {
  const { id } = useParams({ from: "/olvide-password/$id" });
  const { data, isLoading } = useValidateToken(id as string);
  const navigate = useNavigate();

  if (isLoading) {
    return <div>Cargando...</div>;
  } else if (data?.status !== 200) {
    navigate({ to: "/" });
  }

  if (data?.status === 200) {
    navigate({ to: "/actualizar/$id", params: { id } });
  }

  return (
    <AuthLayout>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Recuperar Contraseña
        </h2>
      </div>
    </AuthLayout>
  );
}
