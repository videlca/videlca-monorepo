import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Save, Shield, Users, X } from "lucide-react";
import { ButtonAction } from "../../../components/common/ButtonAction";

export const Route = createFileRoute("/dashboard/permisos/")({
  component: RouteComponent,
});

export interface ModulePermission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  modules: string[];
}

export const systemModules: ModulePermission[] = [
  {
    id: "configuracion",
    name: "Configuración",
    description: "Configuración de módulos y permisos",
  },
  {
    id: "clientes",
    name: "Clientes",
    description: "Gestión de clientes y sus datos",
  },
  {
    id: "personal",
    name: "Personal",
    description: "Gestión de personal y sus datos",
  },
  {
    id: "programaciones",
    name: "Programaciones",
    description: "Gestión de programaciones y sus datos",
  },
  {
    id: "reportes",
    name: "Reportes",
    description: "Generación y consulta de reportes",
  },
  {
    id: "tarifas",
    name: "Tarifas",
    description: "Gestión de tarifas y sus datos",
  },
  {
    id: "usuarios",
    name: "Usuarios",
    description: "Gestión de usuarios y sus datos",
  },
  {
    id: "permisos",
    name: "Permisos",
    description: "Gestión de permisos y sus datos",
  },
];

// TODO: Agregar roles y permisos de la base de datos
export const roles: Role[] = [
  {
    id: "admin",
    name: "Administrador",
    modules: systemModules.map((m) => m.id),
  },
  {
    id: "supervisor",
    name: "Supervisor",
    modules: [
      "configuracion",
      "clientes",
      "personal",
      "programaciones",
      "reportes",
      "tarifas",
      "usuarios",
      "permisos",
    ],
  },
  {
    id: "operator",
    name: "Operador",
    modules: [
      "configuracion",
      "clientes",
      "personal",
      "programaciones",
      "reportes",
    ],
  },
];

function RouteComponent() {
  const [selectedRole, setSelectedRole] = useState<Role>(roles[0]);
  const [grantedModules, setGrantedModules] = useState<string[]>([]);
  const [originalGrantedModules, setOriginalGrantedModules] = useState<
    string[]
  >([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Initialize granted modules when role changes
  useEffect(() => {
    setGrantedModules([...selectedRole.modules]);
    setOriginalGrantedModules([...selectedRole.modules]);
    setHasChanges(false);
  }, [selectedRole]);

  // Check for changes
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
    setGrantedModules(systemModules.map((m) => m.id));
  };

  const revokeAllModules = () => {
    setGrantedModules([]);
  };

  const savePermissions = () => {
    console.log(
      `Saving module access for role ${selectedRole.name}:`,
      grantedModules,
    );

    // Update the original granted modules to reflect the saved state
    setOriginalGrantedModules([...grantedModules]);
    setHasChanges(false);
    setShowSaveConfirm(false);

    // Show success message
    alert(
      `Permisos de módulos guardados exitosamente para el rol ${selectedRole.name}`,
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
              {roles.map((role) => {
                const roleModuleCount =
                  selectedRole.id === role.id
                    ? grantedModules.length
                    : role.modules.length;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedRole.id === role.id
                        ? "border-blue-200 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium">{role.name}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      {roleModuleCount} de {systemModules.length} módulos
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Acceso a Módulos: {selectedRole.name}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    {grantedModules.length} de {systemModules.length} módulos
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
                {systemModules.map((module) => {
                  const hasAccess = grantedModules.includes(module.id);

                  return (
                    <div
                      key={module.id}
                      className={`cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-md ${
                        hasAccess
                          ? "border-green-300 bg-green-50 shadow-sm"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={() => toggleModuleAccess(module.id)}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                            hasAccess
                              ? "border-green-500 bg-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {hasAccess && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>

                      <div>
                        <h3
                          className={`mb-2 text-lg font-semibold ${hasAccess ? "text-green-900" : "text-gray-900"}`}
                        >
                          {module.name}
                        </h3>
                        <p
                          className={`text-sm leading-relaxed ${hasAccess ? "text-green-700" : "text-gray-600"}`}
                        >
                          {module.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
              para el rol "{selectedRole.name}"?
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
                onClick={savePermissions}
                Icon={Check}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
