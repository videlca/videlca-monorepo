import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useGetUsuarioByCookie } from "../api/queryFunctions/usuarios";
import { getPermissionsRole } from "../api/functions/permisos";
import type { Modulo, Rol } from "../api/types/permisos";
import type { Usuario } from "../types";

export interface PermissionsContextType {
  userPermissions: Modulo[];
  isPermissionsLoading: boolean;
  hasPermission: (moduleName: string) => boolean;
  isSuperAdmin: boolean;
  currentUser: Usuario | null;
  refetchPermissions: () => void;
}

const PermissionsContext = createContext<PermissionsContextType>({
  userPermissions: [],
  isPermissionsLoading: true,
  hasPermission: () => false,
  isSuperAdmin: false,
  currentUser: null,
  refetchPermissions: () => {},
});

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider = ({ children }: PermissionsProviderProps) => {
  const [userPermissions, setUserPermissions] = useState<Modulo[]>([]);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  const {
    data: userResponse,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useGetUsuarioByCookie();

  const loadPermissions = async (roleId: number) => {
    try {
      setIsPermissionsLoading(true);
      const permissionsResponse = await getPermissionsRole(roleId);

      if (permissionsResponse.status === 200 && permissionsResponse.data) {
        const roleData = permissionsResponse.data as Rol;
        setUserPermissions(roleData.permissions || []);
      } else {
        console.error(
          "Error loading permissions:",
          permissionsResponse.message,
        );
        setUserPermissions([]);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setUserPermissions([]);
    } finally {
      setIsPermissionsLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoading) {
      setIsPermissionsLoading(true);
      return;
    }

    if (userResponse?.status === 200 && userResponse.data) {
      const user = userResponse.data as Usuario;
      setCurrentUser(user);
      // console.log("user context: ", user);

      // Load permissions based on user role
      if (user.idRol?.id) {
        loadPermissions(user.idRol.id);
      } else {
        setUserPermissions([]);
        setIsPermissionsLoading(false);
      }
    } else {
      setCurrentUser(null);
      setUserPermissions([]);
      setIsPermissionsLoading(false);
    }
  }, [userResponse, isUserLoading]);

  const hasPermission = (moduleName: string): boolean => {
    // El super admin tiene acceso a todo
    if (isSuperAdmin) {
      return true;
    }

    // TODO: Verificar modulos publicos y no necesitar permisos
    if (
      moduleName === "dashboard" ||
      moduleName === "reportes" ||
      moduleName === "programaciones" ||
      moduleName === "liquidaciones"
    ) {
      return true;
    }

    // Si no hay permisos cargados, denegar acceso
    if (userPermissions.length === 0) {
      return false;
    }

    // Verificar si el usuario tiene alguna permiso relacionado con el módulo
    // Esto verifica coincidencias parciales en ambas direcciones
    const moduleNameLower = moduleName.toLowerCase();

    return userPermissions.some((permission) => {
      const permissionNameLower = permission.nombre.toLowerCase();
      const permissionDescLower = permission.descripcion.toLowerCase();

      // Verificar coincidencias exactas primero
      if (
        permissionNameLower === moduleNameLower ||
        permissionDescLower === moduleNameLower
      ) {
        return true;
      }

      // Verificar coincidencias parciales (permiso contiene nombre de módulo o viceversa)
      if (
        permissionNameLower.includes(moduleNameLower) ||
        permissionDescLower.includes(moduleNameLower) ||
        moduleNameLower.includes(permissionNameLower)
      ) {
        return true;
      }

      return false;
    });
  };

  const isSuperAdmin =
    currentUser?.idRol?.nombreRol?.toLowerCase() === "super-admin" ||
    currentUser?.idRol?.nombreRol?.toLowerCase() === "superadmin" ||
    currentUser?.idRol?.nombreRol?.toLowerCase() === "administrador" ||
    currentUser?.idRol?.id === 1; // Asumiendo que el rol ID 1 es super admin

  const refetchPermissions = () => {
    refetchUser();
  };

  if (isUserLoading || isPermissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionsContext.Provider
      value={{
        userPermissions,
        isPermissionsLoading,
        hasPermission,
        isSuperAdmin,
        currentUser,
        refetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};
