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
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }
  if (!hasPermission(requiredModule)) {
    return (
      fallback || (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 text-red-500">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m9-6V9a6 6 0 10-12 0v6m-2 0h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-red-800">
              Acceso Restringido
            </h3>
            <p className="text-red-700">
              Usted no tiene permisos para esta ruta.
            </p>
            <p className="mt-2 text-sm text-red-600">
              Contacte al administrador si necesita acceso a este módulo.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};
