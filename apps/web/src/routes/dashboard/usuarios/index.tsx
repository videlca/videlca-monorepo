import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Usuario } from "../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import {
  useCreateUsuario,
  useGetUsuarios,
  useUpdateUsuario,
} from "../../../api/queryFunctions/usuarios";
import type { CreateUserDto, UpdateUserStatusDto } from "../../../api/dtos";
import { useForm } from "../../../hooks/useForm";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useState } from "react";
import { InputForm } from "../../../components/common/InputForm";
import Button from "../../../components/common/Button";
import { useTipoIdentificacionActivo } from "../../../api/queryFunctions/configuracion/tipo-identificacion";
import { useActiveRoles } from "../../../api/queryFunctions/permisos";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";

export const Route = createFileRoute("/dashboard/usuarios/")({
  component: RouteComponent,
});

function RouteComponent() {
  // Modales
  const [isModalOpenUsuario, setIsModalOpenUsuario] = useState(false);
  const [isModalEditUsuario, setIsModalEditUsuario] = useState(false);
  const [idSelectedUsuario, setIdSelectedUsuario] = useState(0);
  // Queries y Mutations
  const { data: usuarios } = useGetUsuarios();
  const { mutate: crearUsuario, isPending: isCreatingUsuario } =
    useCreateUsuario();
  const { mutate: editarUsuario, isPending: isEditingUsuario } =
    useUpdateUsuario();

  const { data: roles } = useActiveRoles();
  const { data: tiposIdentificacion } = useTipoIdentificacionActivo();

  // Formulario
  const {
    form: formUsuario,
    handleChange: handleChangeUsuario,
    handleNumericChange: handleNumericChangeUsuario,
    setForm: setFormUsuario,
    resetForm: resetFormUsuario,
  } = useForm<CreateUserDto>({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    email: "",
    // TODO: Cambiar por un campo de contraseña o contrasena autogenerada
    clave: "123Abc!",
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
          estado: Boolean(formUsuarioEdit.estado),
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
        <div className="flex gap-2">
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => {
              setIdSelectedUsuario(row.original.idUser);
              setIsModalEditUsuario(true);
              setFormUsuarioEdit({
                idRol: row.original.idRol?.id || 0,
                estado: row.original.estado || false,
              });
            }}
          />
          <ButtonAction
            Icon={TrashIcon}
            label="Eliminar"
            onClick={() => console.log(row.original)}
            color="red"
          />
        </div>
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
          pageSize={10}
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
        <div className="space-y-4">
          <form
            onSubmit={handleSubmitCreateUsuario}
            className="flex flex-col gap-4"
          >
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
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setIsModalOpenUsuario(false);
                  resetFormUsuario();
                }}
                className="w-auto bg-gray-500 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-auto"
                disabled={isCreatingUsuario}
              >
                {isCreatingUsuario ? "Creando..." : "Crear"}
              </Button>
            </div>
          </form>
        </div>
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
        <div className="space-y-4">
          <form
            onSubmit={handleSubmitEditUsuario}
            className="flex flex-col gap-4"
          >
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
              value={
                formUsuarioEdit.idRol === undefined
                  ? ""
                  : formUsuarioEdit.idRol.toString()
              }
              options={
                roles?.data?.map((role) => ({
                  id: role.id,
                  descripcion: role.nombreRol,
                })) || []
              }
              onChange={handleNumericChangeUsuarioEdit}
              required
            />

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setIsModalEditUsuario(false);
                  resetFormUsuarioEdit();
                }}
                className="w-auto bg-gray-500 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-auto"
                disabled={isEditingUsuario}
              >
                {isEditingUsuario ? "Editando..." : "Editar"}
              </Button>
            </div>
          </form>
        </div>
      </SimpleModal>
    </Section>
  );
}
