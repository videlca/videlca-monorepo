import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Segmentacion } from "../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { PencilIcon, PlusIcon } from "lucide-react";
import { ButtonAction } from "../../../components/common/ButtonAction";
import Table from "../../../components/common/Table";

export const Route = createFileRoute("/dashboard/clientes/segmentacion")({
  component: RouteComponent,
});

const segmentacion: Segmentacion[] = [
  {
    idSegmentacion: 1,
    descripcion: "Segmentación 1",
    estado: true,
  },
  {
    idSegmentacion: 2,
    descripcion: "Segmentación 2",
    estado: false,
  },
];

const columns: ColumnDef<Segmentacion>[] = [
  {
    accessorKey: "idSegmentacion",
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
            label="Agregar segmentación"
            onClick={() => {}}
          />
        </div>
        <Table
          data={segmentacion}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
    </Section>
  );
}
