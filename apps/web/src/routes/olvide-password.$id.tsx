import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <CircularProgress />
      </div>
    );
  } else if (data?.status !== 200) {
    navigate({ to: "/" });
  }

  if (data?.status === 200) {
    navigate({ to: "/actualizar/$id", params: { id } });
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <Typography variant="h2">Recuperar Contraseña</Typography>
      </div>
    </AuthLayout>
  );
}
