import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Edit3, Loader2, X } from "lucide-react";
import { InputForm } from "../../components/common/InputForm";
import {
  useGetUsuarioByCookie,
  useUpdateUsuarioPerfil,
} from "../../api/queryFunctions/usuarios";
import { useForm } from "react-hook-form";
import type { UpdateUserDto } from "../../api/dtos";
import { InputSelect } from "../../components/common/InputSelect";
import { useTipoIdentificacion } from "../../api/queryFunctions/configuracion";

export const Route = createFileRoute("/dashboard/perfil-usuario")({
  component: RouteComponent,
});

function RouteComponent() {
  // Queries
  const { data: usuario, isLoading: isLoadingUsuario } =
    useGetUsuarioByCookie();
  const { data: tiposIdentificacion } = useTipoIdentificacion();
  const { mutate: updateUsuarioPerfil, isPending: isUpdatingUsuario } =
    useUpdateUsuarioPerfil();

  // States
  const [isEditing, setIsEditing] = useState(false);

  // Form
  const { register, handleSubmit, reset } = useForm<UpdateUserDto>({
    defaultValues: {
      email: "",
      numeroIdentificacion: "",
      idTipoIdentificacion: 0,
      primerNombre: "",
      primerApellido: "",
      segundoApellido: "",
      segundoNombre: "",
    },
  });

  // Actualizar formulario cuando se cargan los datos del usuario
  useEffect(() => {
    if (usuario?.data) {
      reset({
        email: usuario.data.email || "",
        numeroIdentificacion: usuario.data.numeroIdentificacion || "",
        idTipoIdentificacion:
          usuario.data.idTipoIdentificacion?.idTipoIdentificacion || 0,
        primerNombre: usuario.data.primerNombre || "",
        primerApellido: usuario.data.primerApellido || "",
        segundoApellido: usuario.data.segundoApellido || "",
        segundoNombre: usuario.data.segundoNombre || "",
      });
    }
  }, [usuario?.data, reset]);

  // Handlers
  const onSubmit = (data: UpdateUserDto) => {
    updateUsuarioPerfil(data);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Aquí podrías restaurar los datos originales si es necesario
    setIsEditing(false);
  };

  // Mostrar loading mientras cargan los datos
  if (isLoadingUsuario) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de la página */}
      <div className="flex items-center justify-end">
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Edit3 className="h-4 w-4" />
              <span>Editar Perfil</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSubmit(onSubmit)}
                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                {isUpdatingUsuario ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>{isUpdatingUsuario ? "Guardando..." : "Guardar"}</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        {/* Formulario de edición */}
        <div className="w-3xl space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-6 text-lg font-semibold text-gray-900">
              Información Personal
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputForm
                id="primerNombre"
                label="Primer Nombre"
                type="text"
                placeholder="Ingresa tu nombre"
                disabled={!isEditing}
                required={true}
                {...register("primerNombre")}
              />

              <InputForm
                id="segundoNombre"
                label="Segundo Nombre"
                type="text"
                placeholder="Ingresa tu segundo nombre"
                disabled={!isEditing}
                required={true}
                {...register("segundoNombre")}
              />

              <InputForm
                id="primerApellido"
                label="Primer Apellido"
                type="text"
                placeholder="Ingresa tu apellido"
                disabled={!isEditing}
                required={true}
                {...register("primerApellido")}
              />

              <InputForm
                id="segundoApellido"
                label="Segundo Apellido"
                type="text"
                placeholder="Ingresa tu segundo apellido"
                disabled={!isEditing}
                required={true}
                {...register("segundoApellido")}
              />

              <InputForm
                id="email"
                label="Correo Electrónico"
                type="email"
                placeholder="correo@ejemplo.com"
                disabled={!isEditing}
                required={true}
                {...register("email")}
              />

              <InputSelect
                label="Tipo de identificación"
                placeholder="Tipo de identificación"
                id="idTipoIdentificacion"
                options={
                  tiposIdentificacion?.data?.map((tipo) => ({
                    id: tipo.idTipoIdentificacion,
                    descripcion: tipo.descripcion,
                  })) || []
                }
                disabled={!isEditing}
                {...register("idTipoIdentificacion", { valueAsNumber: true })}
              />

              <div className="md:col-span-2">
                <InputForm
                  id="numeroIdentificacion"
                  label="Número de Identificación"
                  type="text"
                  placeholder="1234567890"
                  disabled={!isEditing}
                  required={false}
                  {...register("numeroIdentificacion")}
                />
              </div>
            </div>
          </div>

          {/* Sección de cambio de contraseña */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Cambiar Contraseña
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Por seguridad, se te pedirá confirmar tu contraseña actual antes
              de establecer una nueva.
            </p>
            <button
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
              onClick={() => {
                // TODO: Implementar modal de cambio de contraseña
                alert("Funcionalidad de cambio de contraseña próximamente");
              }}
            >
              Cambiar Contraseña
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Eliminar cuenta
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Si deseas eliminar tu cuenta, por favor contacta al administrador
              del sistema.
            </p>
            <button
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
              onClick={() => {
                // TODO: Implementar modal de eliminación de cuenta
                alert("Funcionalidad de eliminación de cuenta próximamente");
              }}
            >
              Eliminar Cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
