import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Usuario } from "../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import {
  useCreateUsuario,
  useDeleteUsuario,
  useGetUsuarios,
  useUpdateUsuario,
} from "../../../api/queryFunctions/usuarios";
import type { CreateUserDto, UpdateUserStatusDto } from "../../../api/dtos";
import { useForm } from "../../../hooks/useForm";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useState } from "react";
import { InputForm } from "../../../components/common/InputForm";
import { useTipoIdentificacionActivo } from "../../../api/queryFunctions/configuracion/tipo-identificacion";
import { useActiveRoles } from "../../../api/queryFunctions/permisos";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute("/dashboard/usuarios/")({
  component: RouteComponent,
});

function RouteComponent() {
  // Modales
  const [isModalOpenUsuario, setIsModalOpenUsuario] = useState(false);
  const [isModalEditUsuario, setIsModalEditUsuario] = useState(false);
  const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
  const [idSelectedUsuario, setIdSelectedUsuario] = useState(0);
  // Queries y Mutations
  const { data: usuarios } = useGetUsuarios();
  const { mutate: crearUsuario, isPending: isCreatingUsuario } =
    useCreateUsuario();
  const { mutate: editarUsuario, isPending: isEditingUsuario } =
    useUpdateUsuario();
  const { mutate: eliminarUsuario } = useDeleteUsuario();

  const { data: roles } = useActiveRoles();
  const { data: tiposIdentificacion } = useTipoIdentificacionActivo();

  // Formulario
  const {
    form: formUsuario,
    handleChange: handleChangeUsuario,
    handleNumericChange: handleNumericChangeUsuario,

    resetForm: resetFormUsuario,
  } = useForm<CreateUserDto>({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    email: "",
    clave: "",
    numeroIdentificacion: "",
    idTipoIdentificacion: 0,
    idRol: 0,
  });

  const {
    form: formUsuarioEdit,
    handleNumericChange: handleNumericChangeUsuarioEdit,
    handleBooleanChange: handleBooleanChangeUsuarioEdit,
    setForm: setFormUsuarioEdit,
    resetForm: resetFormUsuarioEdit,
  } = useForm<UpdateUserStatusDto>({
    estado: false,
    idRol: 0,
  });

  // Handlers
  const handleSubmitCreateUsuario = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearUsuario(formUsuario, {
      onSuccess: () => {
        setIsModalOpenUsuario(false);
        resetFormUsuario();
      },
    });
  };

  const handleSubmitEditUsuario = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    editarUsuario(
      {
        id: idSelectedUsuario,
        data: {
          estado: String(formUsuarioEdit.estado) === "true",
          idRol: formUsuarioEdit.idRol,
        },
      },
      {
        onSuccess: () => {
          setIsModalEditUsuario(false);
          resetFormUsuarioEdit();
        },
      },
    );
  };

  const columns: ColumnDef<Usuario>[] = [
    {
      accessorKey: "idUser",
      header: "ID",
    },
    {
      accessorKey: "primerNombre",
      header: "Primer nombre",
    },
    {
      accessorKey: "segundoNombre",
      header: "Segundo nombre",
      cell: ({ row }) => <span>{row.original.segundoNombre || "-"}</span>,
    },
    {
      accessorKey: "primerApellido",
      header: "Primer apellido",
    },
    {
      accessorKey: "segundoApellido",
      header: "Segundo apellido",
      cell: ({ row }) => <span>{row.original.segundoApellido || "-"}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "numeroIdentificacion",
      header: "Número de identificación",
    },
    {
      accessorKey: "idRol.nombreRol",
      header: "Rol",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => <StateLabel state={row.original.estado} />,
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idUser}`}
          actions={[
            {
              label: "Editar",
              onClick: () => {
                setIdSelectedUsuario(row.original.idUser);
                setIsModalEditUsuario(true);
                setFormUsuarioEdit({
                  idRol: row.original.idRol?.id || 0,
                  estado: row.original.estado || false,
                });
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIsModalOpenEliminar(true);
                setIdSelectedUsuario(row.original.idUser);
              },
              color: "red" as const,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Nuevo usuario"
            onClick={() => {
              setIsModalOpenUsuario(true);
            }}
          />
        </div>
        <Table
          data={usuarios?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={5}
          enableSorting={true}
          enableFiltering={true}
        />
      </div>

      <SimpleModal
        isOpen={isModalOpenUsuario}
        onClose={() => {
          setIsModalOpenUsuario(false);
          resetFormUsuario();
        }}
        title="Agregar usuario"
        size="xl"
      >
        <FormsModal
          onSubmit={handleSubmitCreateUsuario}
          isLoading={isCreatingUsuario}
          onCancel={() => {
            setIsModalOpenUsuario(false);
            resetFormUsuario();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-2">
            <InputForm
              label="Nombre"
              placeholder="Nombre"
              type="text"
              id="primerNombre"
              value={formUsuario.primerNombre}
              onChange={handleChangeUsuario}
              required
            />
            <InputForm
              label="Segundo nombre"
              placeholder="Segundo nombre"
              type="text"
              id="segundoNombre"
              value={formUsuario.segundoNombre}
              onChange={handleChangeUsuario}
              required
            />
            <InputForm
              label="Primer apellido"
              placeholder="Primer apellido"
              type="text"
              id="primerApellido"
              value={formUsuario.primerApellido}
              onChange={handleChangeUsuario}
              required
            />
            <InputForm
              label="Segundo apellido"
              placeholder="Segundo apellido"
              type="text"
              id="segundoApellido"
              value={formUsuario.segundoApellido}
              onChange={handleChangeUsuario}
              required
            />
            <InputForm
              label="Email"
              placeholder="Email"
              type="email"
              id="email"
              value={formUsuario.email}
              onChange={handleChangeUsuario}
              required
            />
            <InputForm
              label="Contraseña"
              placeholder="Contraseña"
              type="password"
              id="clave"
              value={formUsuario.clave || ""}
              onChange={handleChangeUsuario}
              required
            />
            <InputSelect
              label="Tipo de identificación"
              placeholder="Tipo de identificación"
              id="idTipoIdentificacion"
              value={
                formUsuario.idTipoIdentificacion === 0
                  ? ""
                  : formUsuario.idTipoIdentificacion
              }
              options={
                tiposIdentificacion?.data?.map((tipo) => ({
                  id: tipo.idTipoIdentificacion,
                  descripcion: tipo.descripcion,
                })) || []
              }
              onChange={handleNumericChangeUsuario}
              required
            />
            <InputForm
              label="Número de identificación"
              placeholder="Número de identificación"
              type="text"
              id="numeroIdentificacion"
              value={formUsuario.numeroIdentificacion}
              onChange={handleChangeUsuario}
              required
            />
            <InputSelect
              label="Rol"
              placeholder="Rol"
              id="idRol"
              value={formUsuario.idRol === 0 ? "" : formUsuario.idRol}
              options={
                roles?.data?.map((role) => ({
                  id: role.id,
                  descripcion: role.nombreRol,
                })) || []
              }
              onChange={handleNumericChangeUsuario}
              required
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isModalEditUsuario}
        onClose={() => {
          setIsModalEditUsuario(false);
          resetFormUsuarioEdit();
        }}
        title="Editar usuario"
        size="xl"
      >
        <FormsModal
          onSubmit={handleSubmitEditUsuario}
          isLoading={isEditingUsuario}
          onCancel={() => {
            setIsModalEditUsuario(false);
            resetFormUsuarioEdit();
          }}
          updating={true}
        >
          <div className="flex flex-col gap-2">
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              value={formUsuarioEdit.estado?.toString() || ""}
              onChange={handleBooleanChangeUsuarioEdit}
            />
            <InputSelect
              label="Rol"
              placeholder="Rol"
              id="idRol"
              value={formUsuarioEdit.idRol?.toString() || ""}
              options={
                roles?.data?.map((role) => ({
                  id: role.id,
                  descripcion: role.nombreRol,
                })) || []
              }
              onChange={handleNumericChangeUsuarioEdit}
              required
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isModalOpenEliminar}
        text="¿Estás seguro de querer eliminar este usuario? Se eliminarán todos los datos asociados a este usuario."
        onDelete={() => {
          eliminarUsuario(
            { id: idSelectedUsuario },
            {
              onSettled: () => {
                setIsModalOpenEliminar(false);
                setIdSelectedUsuario(0);
              },
            },
          );
        }}
        onClose={() => setIsModalOpenEliminar(false)}
      />
    </Section>
  );
}
