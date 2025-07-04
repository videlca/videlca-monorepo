import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Personal } from "../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { PencilIcon, PlusIcon } from "lucide-react";
import { ButtonAction } from "../../../components/common/ButtonAction";
import Table from "../../../components/common/Table";

export const Route = createFileRoute("/dashboard/personal/")({
  component: RouteComponent,
});

const personal: Personal[] = [
  {
    idPersonal: 1,
    primerNombre: "Juan",
    segundoNombre: "Pedro",
    primerApellido: "Perez",
    segundoApellido: "Gomez",
    numeroIdentificacion: "1234567890",
    fechaInicioContrato: "2021-01-01",
    fechaFinContrato: "2021-01-01",
    fechaNacimiento: "2021-01-01",
    direccionResidencia: "Calle 123",
    telefono: "1234567890",
    arma: true,
    laborando: true,
    idTipoIdentificacion: {
      idTipoIdentificacion: 1,
      descripcion: "Cédula",
      estado: true,
    },
    idCiudad: {
      idCiudad: 1,
      descripcion: "Bogotá",
      estado: true,
      codigoCiudad: "1234567890",
      idDepartamento: {
        idDepartamento: 1,
        descripcion: "Cundinamarca",
        codigoDepartamento: "1234567890",
        idPais: {
          idPais: 1,
          descripcion: "Colombia",
        },
      },
    },
    idTipoGenero: {
      idTipoGenero: 1,
      descripcion: "Masculino",
      estado: true,
    },
    idTipoPersonal: {
      idTipoPersonal: 1,
      descripcion: "Administrativo",
      estado: true,
    },
  },
  {
    idPersonal: 2,
    primerNombre: "Maria",
    segundoNombre: "Juana",
    primerApellido: "Gomez",
    segundoApellido: "Perez",
    numeroIdentificacion: "1234567890",
    fechaInicioContrato: "2021-01-01",
    fechaFinContrato: "2021-01-01",
    fechaNacimiento: "2021-01-01",
    direccionResidencia: "Calle 123",
    telefono: "1234567890",
    arma: true,
    laborando: true,
    idTipoIdentificacion: {
      idTipoIdentificacion: 1,
      descripcion: "Cédula",
      estado: true,
    },
    idCiudad: {
      idCiudad: 2,
      descripcion: "Medellín",
      estado: true,
      codigoCiudad: "1234567890",
      idDepartamento: {
        idDepartamento: 2,
        descripcion: "Antioquia",
        codigoDepartamento: "1234567890",
        idPais: {
          idPais: 1,
          descripcion: "Colombia",
        },
      },
    },
    idTipoGenero: {
      idTipoGenero: 2,
      descripcion: "Femenino",
      estado: true,
    },
    idTipoPersonal: {
      idTipoPersonal: 2,
      descripcion: "Operario",
      estado: true,
    },
  },
];

const columns: ColumnDef<Personal>[] = [
  {
    accessorKey: "idPersonal",
    header: "ID",
  },
  {
    accessorKey: "idTipoIdentificacion.descripcion",
    header: "Tipo de identificación",
  },
  {
    accessorKey: "numeroIdentificacion",
    header: "Número de identificación",
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
    accessorKey: "fechaInicioContrato",
    header: "Fecha de inicio de contrato",
  },
  {
    accessorKey: "idCiudad.descripcion",
    header: "Ciudad",
  },
  {
    accessorKey: "idTipoGenero.descripcion",
    header: "Género",
  },
  {
    accessorKey: "idTipoPersonal.descripcion",
    header: "Tipo de personal",
  },
  {
    accessorKey: "laborando",
    header: "Laborando",
    cell: ({ row }) => <StateLabel state={row.original.laborando} />,
  },
  {
    accessorKey: "arma",
    header: "Arma",
    cell: ({ row }) => <StateLabel state={row.original.arma} />,
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
            label="Nuevo personal"
            onClick={() => {}}
          />
        </div>
        <Table
          data={personal}
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
