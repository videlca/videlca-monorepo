import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Usuario } from "../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";

export const Route = createFileRoute("/dashboard/usuarios/")({
  component: RouteComponent,
});

const usuarios: Usuario[] = [
  {
    idUsuario: 1,
    primerNombre: "Juan",
    segundoNombre: "Pedro",
    primerApellido: "Perez",
    segundoApellido: "Gomez",
    email: "juan@gmail.com",
    clave: "123456",
    numeroIdentificacion: "1234567890",
    estado: true,
    idTipoIdentificacion: {
      idTipoIdentificacion: 1,
      descripcion: "Cédula",
      estado: true,
    },
    idRol: {
      idRol: 1,
      nombreRol: "Administrador",
      descripcion: "Administrador del sistema",
      estado: true,
    },
  },
  {
    idUsuario: 2,
    primerNombre: "Maria",
    segundoNombre: "Juana",
    primerApellido: "Gomez",
    segundoApellido: "Perez",
    email: "maria@gmail.com",
    clave: "123456",
    numeroIdentificacion: "1234567890",
    estado: true,
    idTipoIdentificacion: {
      idTipoIdentificacion: 1,
      descripcion: "Cédula",
      estado: true,
    },
    idRol: {
      idRol: 2,
      nombreRol: "Usuario",
      descripcion: "Usuario del sistema",
      estado: true,
    },
  },
];

const columns: ColumnDef<Usuario>[] = [
  {
    accessorKey: "idUsuario",
    header: "ID",
  },
  {
    accessorKey: "primerNombre",
    header: "Primer nombre",
  },
  {
    accessorKey: "segundoNombre",
    header: "Segundo nombre",
  },
  {
    accessorKey: "primerApellido",
    header: "Primer apellido",
  },
  {
    accessorKey: "segundoApellido",
    header: "Segundo apellido",
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
      <ButtonAction
        Icon={PencilIcon}
        label="Editar"
        onClick={() => console.log(row.original)}
      />
    ),
  },
];

function RouteComponent() {
  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Nuevo usuario"
            onClick={() => {}}
          />
        </div>
        <Table
          data={usuarios}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
          enableFiltering={true}
        />
      </div>
    </Section>
  );
}
