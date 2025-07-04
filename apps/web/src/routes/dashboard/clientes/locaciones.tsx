import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Locacion } from "../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";

export const Route = createFileRoute("/dashboard/clientes/locaciones")({
  component: RouteComponent,
});

const locaciones: Locacion[] = [
  {
    idLocacion: 1,
    nombre: "Locación 1",
    direccion: "Dirección 1",
    latitud: 1,
    longitud: 1,
    primerNombreResponsable: "Nombre 1",
    primerApellidoResponsable: "Apellido 1",
    telefono: "1234567890",
    telefono_2: "1234567890",
    estado: true,
    idCliente: {
      idCliente: 1,
      numeroIdentificacion: "1234567890",
      nombre: "Cliente 1",
      estado: true,
      idTipoIdentificacion: {
        idTipoIdentificacion: 1,
        descripcion: "Cédula",
        estado: true,
      },
      idTipoCliente: {
        idTipoCliente: 1,
        descripcion: "Cliente",
        estado: true,
      },
      idSubSegmentacion: {
        idSubSegmentacion: 1,
        descripcion: "SubSegmentación 1",
        estado: true,
        idSegmentacion: {
          idSegmentacion: 1,
          descripcion: "Segmentación 1",
          estado: true,
        },
      },
    },
    idCiudad: {
      idCiudad: 1,
      descripcion: "Ciudad 1",
      codigoCiudad: "1234567890",
      estado: true,
      idDepartamento: {
        idDepartamento: 1,
        descripcion: "Departamento 1",
        codigoDepartamento: "1234567890",
        idPais: {
          idPais: 1,
          descripcion: "Pais 1",
        },
      },
    },
  },
  {
    idLocacion: 2,
    nombre: "Locación 2",
    direccion: "Dirección 2",
    latitud: 2,
    longitud: 2,
    primerNombreResponsable: "Nombre 2",
    primerApellidoResponsable: "Apellido 2",
    telefono: "1234567890",
    telefono_2: "1234567890",
    estado: true,
    idCliente: {
      idCliente: 2,
      numeroIdentificacion: "1234567890",
      nombre: "Cliente 2",
      estado: true,
      idTipoIdentificacion: {
        idTipoIdentificacion: 2,
        descripcion: "NIT",
        estado: true,
      },
      idTipoCliente: {
        idTipoCliente: 2,
        descripcion: "Proveedor",
        estado: true,
      },
      idSubSegmentacion: {
        idSubSegmentacion: 2,
        descripcion: "SubSegmentación 2",
        estado: true,
        idSegmentacion: {
          idSegmentacion: 2,
          descripcion: "Segmentación 2",
          estado: true,
        },
      },
    },
    idCiudad: {
      idCiudad: 2,
      descripcion: "Ciudad 2",
      codigoCiudad: "1234567890",
      estado: true,
      idDepartamento: {
        idDepartamento: 2,
        descripcion: "Departamento 2",
        codigoDepartamento: "1234567890",
        idPais: {
          idPais: 2,
          descripcion: "Pais 2",
        },
      },
    },
  },
];

const columns: ColumnDef<Locacion>[] = [
  {
    accessorKey: "idLocacion",
    header: "ID",
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "direccion",
    header: "Dirección",
  },
  {
    accessorKey: "latitud",
    header: "Latitud",
  },
  {
    accessorKey: "longitud",
    header: "Longitud",
  },
  {
    accessorKey: "primerNombreResponsable",
    header: "Primer nombre responsable",
  },
  {
    accessorKey: "primerApellidoResponsable",
    header: "Primer apellido responsable",
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
  },
  {
    accessorKey: "telefono_2",
    header: "Teléfono 2",
  },
  {
    accessorKey: "idCliente.nombre",
    header: "Cliente",
  },
  {
    accessorKey: "idCiudad.descripcion",
    header: "Ciudad",
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
            label="Agregar locación"
            onClick={() => {}}
          />
        </div>
        <Table
          data={locaciones}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
    </Section>
  );
}
