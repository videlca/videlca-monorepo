import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  const { register, control, handleSubmit, reset } = useForm<UpdateUserDto>({
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
      <div className="flex h-64 items-center justify-center gap-2">
        <CircularProgress size={28} />
        <Typography color="text.secondary">Cargando perfil...</Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header de la página */}
      <div className="flex items-center justify-end gap-2">
        {!isEditing ? (
          <Button
            variant="contained"
            startIcon={<EditOutlinedIcon />}
            onClick={() => setIsEditing(true)}
          >
            Editar Perfil
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              startIcon={<CheckIcon />}
              loading={isUpdatingUsuario}
              loadingPosition="start"
              onClick={handleSubmit(onSubmit)}
            >
              {isUpdatingUsuario ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CloseIcon />}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          </>
        )}
      </div>

      <div className="flex justify-center">
        {/* Formulario de edición */}
        <div className="flex w-3xl flex-col gap-6">
          <Paper variant="outlined" className="p-6">
            <Typography variant="h4" component="h3" sx={{ mb: 3 }}>
              Información Personal
            </Typography>

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
                  tiposIdentificacion?.data?.data?.map((tipo) => ({
                    id: tipo.idTipoIdentificacion,
                    descripcion: tipo.descripcion,
                  })) || []
                }
                disabled={!isEditing}
                control={control}
                name="idTipoIdentificacion"
                valueAsNumber
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
          </Paper>

          {/* Sección de cambio de contraseña */}
          <Paper variant="outlined" className="p-6">
            <Typography variant="h4" component="h3" sx={{ mb: 1 }}>
              Cambiar Contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Por seguridad, se te pedirá confirmar tu contraseña actual antes
              de establecer una nueva.
            </Typography>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                // TODO: Implementar modal de cambio de contraseña
                alert("Funcionalidad de cambio de contraseña próximamente");
              }}
            >
              Cambiar Contraseña
            </Button>
          </Paper>

          <Paper variant="outlined" className="p-6">
            <Typography variant="h4" component="h3" sx={{ mb: 1 }}>
              Eliminar cuenta
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Si deseas eliminar tu cuenta, por favor contacta al administrador
              del sistema.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                // TODO: Implementar modal de eliminación de cuenta
                alert("Funcionalidad de eliminación de cuenta próximamente");
              }}
            >
              Eliminar Cuenta
            </Button>
          </Paper>
        </div>
      </div>
    </div>
  );
}
