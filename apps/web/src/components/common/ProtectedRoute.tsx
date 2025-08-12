import type { ReactNode } from "react";
import { PermissionGuard } from "./PermissionGuard";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredModule: string;
}

export const ProtectedRoute = ({
  children,
  requiredModule,
}: ProtectedRouteProps) => {
  return (
    <PermissionGuard requiredModule={requiredModule}>
      {children}
    </PermissionGuard>
  );
};
