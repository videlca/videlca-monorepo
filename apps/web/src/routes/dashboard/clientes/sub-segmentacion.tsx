import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { SubSegmentacion } from "../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";

export const Route = createFileRoute("/dashboard/clientes/sub-segmentacion")({
  component: RouteComponent,
});

const subSegmentacion: SubSegmentacion[] = [
  {
    idSubSegmentacion: 1,
    descripcion: "SubSegmentación 1",
    estado: true,
    idSegmentacion: {
      idSegmentacion: 1,
      descripcion: "Segmentación 1",
      estado: true,
    },
  },
  {
    idSubSegmentacion: 2,
    descripcion: "SubSegmentación 2",
    estado: false,
    idSegmentacion: {
      idSegmentacion: 2,
      descripcion: "Segmentación 2",
      estado: true,
    },
  },
];

const columns: ColumnDef<SubSegmentacion>[] = [
  {
    accessorKey: "idSubSegmentacion",
    header: "ID",
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
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
            label="Agregar subsegmentación"
            onClick={() => {}}
          />
        </div>
        <Table
          data={subSegmentacion}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
    </Section>
  );
}
