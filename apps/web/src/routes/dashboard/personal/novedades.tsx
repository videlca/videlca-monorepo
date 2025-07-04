import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Novedad } from "../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";

export const Route = createFileRoute("/dashboard/personal/novedades")({
  component: RouteComponent,
});

const novedades: Novedad[] = [
  {
    idNovedad: 1,
    descripcion: "Novedad 1",
    fechaInicio: "2021-01-01",
    horaInicio: "10:00",
    fechaFin: "2021-01-01",
    horaFin: "12:00",
    idPersonal: {
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
    idTipoNovedad: {
      idTipoNovedad: 1,
      descripcion: "Novedad 1",
      estado: true,
      retirado: false,
    },
  },
  {
    idNovedad: 2,
    descripcion: "Novedad 2",
    fechaInicio: "2021-01-01",
    horaInicio: "10:00",
    fechaFin: "2021-01-01",
    horaFin: "12:00",
    idPersonal: {
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
    idTipoNovedad: {
      idTipoNovedad: 2,
      descripcion: "Novedad 2",
      estado: true,
      retirado: false,
    },
  },
];

const columns: ColumnDef<Novedad>[] = [
  {
    accessorKey: "idNovedad",
    header: "ID",
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
  },
  {
    accessorKey: "fechaInicio",
    header: "Fecha de inicio",
  },
  {
    accessorKey: "horaInicio",
    header: "Hora de inicio",
  },
  {
    accessorKey: "fechaFin",
    header: "Fecha de fin",
  },
  {
    accessorKey: "horaFin",
    header: "Hora de fin",
  },
  {
    accessorKey: "idPersonal.primerNombre",
    header: "Personal",
  },
  {
    accessorKey: "idTipoNovedad.descripcion",
    header: "Tipo de novedad",
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
            label="Nueva novedad"
            onClick={() => {}}
          />
        </div>
        <Table
          data={novedades}
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
