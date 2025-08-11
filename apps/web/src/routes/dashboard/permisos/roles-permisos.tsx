import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Save, Shield, Users, X } from "lucide-react";
import { ButtonAction } from "../../../components/common/ButtonAction";
import {
  useGetRolesWithPermissions,
  useUpdateRole,
} from "../../../api/queryFunctions/permisos";
import { useGetModulos } from "../../../api/queryFunctions/permisos/modulos";
import type { Rol } from "../../../api/types";

export const Route = createFileRoute("/dashboard/permisos/roles-permisos")({
  component: RouteComponent,
});

function RouteComponent() {
  const [selectedRole, setSelectedRole] = useState<Rol | null>(null);
  const [grantedModules, setGrantedModules] = useState<string[]>([]);
  const [originalGrantedModules, setOriginalGrantedModules] = useState<
    string[]
  >([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    setGrantedModules([
      ...(selectedRole?.permissions?.map((p) => p.id.toString()) || []),
    ]);
    setOriginalGrantedModules([
      ...(selectedRole?.permissions?.map((p) => p.id.toString()) || []),
    ]);
    setHasChanges(false);
  }, [selectedRole]);

  useEffect(() => {
    const hasChanged =
      JSON.stringify(grantedModules.sort()) !==
      JSON.stringify(originalGrantedModules.sort());
    setHasChanges(hasChanged);
  }, [grantedModules, originalGrantedModules]);

  const toggleModuleAccess = (moduleId: string) => {
    setGrantedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    );
  };

  const grantAllModules = () => {
    setGrantedModules(modulosData?.data?.map((m) => m.id.toString()) || []);
  };

  const revokeAllModules = () => {
    setGrantedModules([]);
  };

  // queries y mutaciones
  const { data: rolesData } = useGetRolesWithPermissions();
  const { data: modulosData } = useGetModulos();

  const { mutate: updateRole } = useUpdateRole();

  const handleSavePermissions = () => {
    updateRole(
      {
        id: selectedRole?.id || 0,
        data: {
          permissionsIds: grantedModules.map((m) => parseInt(m)),
        },
      },
      {
        onSuccess: () => {
          setHasChanges(false);
          setShowSaveConfirm(false);
          setOriginalGrantedModules([...grantedModules]);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <Users className="mr-2 h-5 w-5" />
              Roles del Sistema
            </h3>
            <div className="space-y-2">
              {rolesData?.data?.map((role) => {
                const roleModuleCount =
                  selectedRole?.id === role.id
                    ? grantedModules.length
                    : role.permissions?.length || 0;
                return (
                  <button
                    key={role.nombreRol}
                    onClick={() =>
                      setSelectedRole({
                        id: role.id,
                        nombreRol: role.nombreRol,
                        descripcion: role.descripcion,
                        estado: role.estado,
                        permissions: role.permissions,
                      })
                    }
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedRole?.id === role.id
                        ? "border-blue-200 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium">{role.nombreRol}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      {roleModuleCount} de {modulosData?.data?.length} módulos
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedRole && (
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Acceso a Módulos: {selectedRole?.nombreRol}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      {grantedModules.length} de {modulosData?.data?.length}{" "}
                      módulos
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        hasChanges
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {hasChanges ? "Cambios pendientes" : "Guardado"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={grantAllModules}
                    className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    <span>Otorgar Todos</span>
                  </button>
                  <button
                    onClick={revokeAllModules}
                    className="flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                    <span>Revocar Todos</span>
                  </button>
                  <button
                    onClick={() => setShowSaveConfirm(true)}
                    disabled={!hasChanges}
                    className="ml-auto flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    <Save className="h-4 w-4" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {modulosData?.data?.map((module) => {
                    const hasAccess = grantedModules.includes(
                      module.id.toString(),
                    );

                    return (
                      <div
                        key={module.id}
                        className={`cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-md ${
                          hasAccess
                            ? "border-green-300 bg-green-50 shadow-sm"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                        }`}
                        onClick={() => toggleModuleAccess(module.id.toString())}
                      >
                        <div
                          className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                            hasAccess
                              ? "border-green-500 bg-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {hasAccess && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <h3
                          className={`mb-2 text-lg font-semibold capitalize ${hasAccess ? `text-green-900` : `text-gray-900`}`}
                        >
                          {module.nombre}
                        </h3>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {!selectedRole && (
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-20 text-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Seleccione un rol para ver los permisos
                </h2>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSaveConfirm && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center space-x-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Cambios de Acceso
              </h3>
            </div>
            <p className="mb-4 text-gray-600">
              ¿Está seguro de que desea guardar los cambios de acceso a módulos
              para el rol "{selectedRole?.nombreRol}"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <ButtonAction
                label="Confirmar y Guardar"
                onClick={handleSavePermissions}
                Icon={Check}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
