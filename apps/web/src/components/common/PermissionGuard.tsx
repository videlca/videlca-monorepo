import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import AlertTitle from "@mui/material/AlertTitle";
import Alert from "@mui/material/Alert";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import type { ReactNode } from "react";
import { usePermissions } from "../../context/PermissionsContext";

interface PermissionGuardProps {
  children: ReactNode;
  requiredModule: string;
  fallback?: ReactNode;
}

export const PermissionGuard = ({
  children,
  requiredModule,
  fallback,
}: PermissionGuardProps) => {
  const { hasPermission, isPermissionsLoading } = usePermissions();

  if (isPermissionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Verificando permisos...
          </Typography>
        </div>
      </div>
    );
  }
  if (!hasPermission(requiredModule)) {
    return (
      fallback || (
        <div className="flex min-h-[400px] items-center justify-center">
          <Alert severity="error" icon={<LockOutlinedIcon />} sx={{ maxWidth: 480 }}>
            <AlertTitle>Acceso Restringido</AlertTitle>
            Usted no tiene permisos para esta ruta.
            <Typography variant="body2" sx={{ mt: 1 }}>
              Contacte al administrador si necesita acceso a este módulo.
            </Typography>
          </Alert>
        </div>
      )
    );
  }

  return <>{children}</>;
};
