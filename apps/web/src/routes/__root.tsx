import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RouterLink } from "../components/ui/common/RouterLink";

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Paper
        variant="outlined"
        className="flex w-full max-w-sm flex-col items-center gap-4 p-8"
      >
        <Typography variant="h1" color="primary">
          404
        </Typography>
        <Typography color="text.secondary">
          La página que buscas no existe.
        </Typography>
        <RouterLink to="/" underline="hover">
          Regresar al inicio
        </RouterLink>
      </Paper>
    </div>
  ),
});
