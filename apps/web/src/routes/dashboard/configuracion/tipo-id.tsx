import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { TipoIdentificacion } from "../../../types";

export const Route = createFileRoute("/dashboard/configuracion/tipo-id")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

const tipoId: TipoIdentificacion[] = [
  { idTipoIdentificacion: 1, descripcion: "Cédula", estado: true },
  { idTipoIdentificacion: 2, descripcion: "NIT", estado: false },
];

const columns: ColumnDef<TipoIdentificacion>[] = [
  {
    header: "ID",
    accessorKey: "idTipoIdentificacion",
  },
  {
    header: "Descripción",
    accessorKey: "descripcion",
  },
  {
    header: "Estado",
    accessorKey: "estado",
    cell: ({ row }) => {
      return <StateLabel state={row.original.estado} />;
    },
  },
  {
    header: "Acciones",
    accessorKey: "acciones",
    cell: ({ row }) => {
      return (
        <ButtonAction
          Icon={PencilIcon}
          label="Editar"
          onClick={() => {
            console.log(row.original);
          }}
        />
      );
    },
  },
];

function RouteComponent() {
  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar tipo de identificación"
            onClick={() => {}}
          />
        </div>
        <Table
          data={tipoId}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
    </Section>
  );
}
