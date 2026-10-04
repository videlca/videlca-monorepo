import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Usuario } from "../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import AddIcon from "@mui/icons-material/Add";
import Table from "../../../components/common/Table";
import {
  useCreateUsuario,
  useDeleteUsuario,
  useGetUsuarios,
  useUpdateUsuario,
  useFilterUsuarios,
} from "../../../api/queryFunctions/usuarios";
import { UserFilterColumn, type CreateUserDto, type UpdateUserStatusDto } from "../../../api/dtos";
import { useForm } from "react-hook-form";
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
import type { ServerFilterColumn } from "../../../components/common/Table";
import { useServerPagination } from "../../../hooks/useServerPagination";

export const Route = createFileRoute("/dashboard/usuarios/")({
  component: RouteComponent,
});

function RouteComponent() {
  // Modales
  const [isModalOpenUsuario, setIsModalOpenUsuario] = useState(false);
  const [isModalEditUsuario, setIsModalEditUsuario] = useState(false);
  const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
  const [idSelectedUsuario, setIdSelectedUsuario] = useState(0);
  
  // Paginación server-side
  const { page, setPage, pageSize, setPageSize, paginationParams } = useServerPagination(5);

  // Queries y Mutations
  const { data: usuarios } = useGetUsuarios(paginationParams);
  const { mutate: crearUsuario, isPending: isCreatingUsuario } =
    useCreateUsuario();
  const { mutate: editarUsuario, isPending: isEditingUsuario } =
    useUpdateUsuario();
  const { mutate: eliminarUsuario } = useDeleteUsuario();
  const { mutate: filterUsuarios, isPending: isFilteringUsuarios } = useFilterUsuarios();

  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[] | null>(null);

  const { data: roles } = useActiveRoles();
  const { data: tiposIdentificacion } = useTipoIdentificacionActivo();

  // Formularios
  const {
    register: registerCrear,
    control: controlCrear,
    handleSubmit: handleSubmitCrear,
    reset: resetCrear,
  } = useForm<CreateUserDto>({
    defaultValues: {
      primerNombre: "",
      segundoNombre: "",
      primerApellido: "",
      segundoApellido: "",
      email: "",
      clave: "",
      numeroIdentificacion: "",
      idTipoIdentificacion: 0,
      idRol: 0,
    },
  });

  const {
    register: registerEditar,
    control: controlEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<UpdateUserStatusDto>({
    defaultValues: {
      estado: false,
      idRol: 0,
    },
  });

  // Handlers
  const onSubmitCreate = (data: CreateUserDto) => {
    crearUsuario(
      {
        ...data,
        idTipoIdentificacion: Number(data.idTipoIdentificacion),
        idRol: Number(data.idRol),
      },
      {
        onSuccess: () => {
          setIsModalOpenUsuario(false);
          resetCrear();
        },
      },
    );
  };

  const onSubmitEdit = (data: UpdateUserStatusDto) => {
    editarUsuario(
      {
        id: idSelectedUsuario,
        data: {
          estado: String(data.estado) === "true",
          idRol: Number(data.idRol),
        },
      },
      {
        onSuccess: () => {
          setIsModalEditUsuario(false);
          resetEditar();
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
                resetEditar({
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
            Icon={AddIcon}
            label="Nuevo usuario"
            onClick={() => {
              setIsModalOpenUsuario(true);
            }}
          />
        </div>
        <Table
          data={filteredUsuarios ?? usuarios?.data?.data ?? []}
          columns={columns}
          serverPagination={!filteredUsuarios}
          totalRows={filteredUsuarios ? filteredUsuarios.length : (usuarios?.data?.pagination?.total ?? 0)}
          currentPage={page}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          enablePagination={true}
          pageSize={pageSize}
          enableSorting={true}
          enableFiltering={true}
          filterColumns={[
            { label: "Número de identificación", value: UserFilterColumn.NUMERO_IDENTIFICACION },
            { label: "Nombre", value: UserFilterColumn.NOMBRE },
            { label: "Email", value: UserFilterColumn.EMAIL },
            { label: "Rol", value: UserFilterColumn.ROL },
          ] satisfies ServerFilterColumn[]}
          onServerFilter={(column, query) => {
            filterUsuarios(
              { column: column as UserFilterColumn, query, pagination: 'false' },
              {
                onSuccess: (data) => {
                  setFilteredUsuarios(data.data?.data ?? []);
                },
              },
            );
          }}
          onServerFilterClear={() => setFilteredUsuarios(null)}
          serverFilterLoading={isFilteringUsuarios}
        />
      </div>

      <SimpleModal
        isOpen={isModalOpenUsuario}
        onClose={() => {
          setIsModalOpenUsuario(false);
          resetCrear();
        }}
        title="Agregar usuario"
        size="xl"
      >
        <FormsModal
          onSubmit={handleSubmitCrear(onSubmitCreate)}
          isLoading={isCreatingUsuario}
          onCancel={() => {
            setIsModalOpenUsuario(false);
            resetCrear();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-2">
            <InputForm
              label="Nombre"
              placeholder="Nombre"
              type="text"
              id="primerNombre"
              required
              {...registerCrear("primerNombre")}
            />
            <InputForm
              label="Segundo nombre"
              placeholder="Segundo nombre"
              type="text"
              id="segundoNombre"
              required
              {...registerCrear("segundoNombre")}
            />
            <InputForm
              label="Primer apellido"
              placeholder="Primer apellido"
              type="text"
              id="primerApellido"
              required
              {...registerCrear("primerApellido")}
            />
            <InputForm
              label="Segundo apellido"
              placeholder="Segundo apellido"
              type="text"
              id="segundoApellido"
              required
              {...registerCrear("segundoApellido")}
            />
            <InputForm
              label="Email"
              placeholder="Email"
              type="email"
              id="email"
              required
              {...registerCrear("email")}
            />
            <InputForm
              label="Contraseña"
              placeholder="Contraseña"
              type="password"
              id="clave"
              required
              {...registerCrear("clave")}
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
              required
              control={controlCrear}
              name="idTipoIdentificacion"
              valueAsNumber
            />
            <InputForm
              label="Número de identificación"
              placeholder="Número de identificación"
              type="text"
              id="numeroIdentificacion"
              required
              {...registerCrear("numeroIdentificacion")}
            />
            <InputSelect
              label="Rol"
              placeholder="Rol"
              id="idRol"
              options={
                roles?.data?.data?.map((role) => ({
                  id: role.id,
                  descripcion: role.nombreRol,
                })) || []
              }
              required
              control={controlCrear}
              name="idRol"
              valueAsNumber
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isModalEditUsuario}
        onClose={() => {
          setIsModalEditUsuario(false);
          resetEditar();
        }}
        title="Editar usuario"
        size="xl"
      >
        <FormsModal
          onSubmit={handleSubmitEditar(onSubmitEdit)}
          isLoading={isEditingUsuario}
          onCancel={() => {
            setIsModalEditUsuario(false);
            resetEditar();
          }}
          updating={true}
        >
          <div className="flex flex-col gap-2">
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              {...registerEditar("estado")}
            />
            <InputSelect
              label="Rol"
              placeholder="Rol"
              id="idRol"
              options={
                roles?.data?.data?.map((role) => ({
                  id: role.id,
                  descripcion: role.nombreRol,
                })) || []
              }
              required
              control={controlEditar}
              name="idRol"
              valueAsNumber
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
