import { createContext, useContext, useEffect, useState } from "react";
import { checkAuth } from "../api/functions/auth";

export interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  isLoading: boolean;
  isPermissionsLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  //! TODO: Configurar permisos por modulos
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(true);

  useEffect(() => {
    const validateAuth = async () => {
      setIsLoading(true);
      try {
        const response = await checkAuth();
        console.log("Auth check response:", response);
        if (typeof response === "boolean") {
          setIsAuthenticated(response);
        } else if (response && typeof response === "object") {
          setIsAuthenticated(
            response.success || response.isAuthenticated || false,
          );
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    validateAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        isLoading,
        isPermissionsLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
