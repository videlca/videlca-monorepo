import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { StateLabel } from "../../../components/common/StateLabel";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { TipoCliente } from "../../../types";

export const Route = createFileRoute("/dashboard/configuracion/tipo-cliente")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

const tipoCliente: TipoCliente[] = [
  { idTipoCliente: 1, descripcion: "Cliente", estado: true },
  { idTipoCliente: 2, descripcion: "Proveedor", estado: false },
];

const columns: ColumnDef<TipoCliente>[] = [
  {
    header: "ID",
    accessorKey: "idTipoCliente",
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
            label="Agregar tipo de cliente"
            onClick={() => {}}
          />
        </div>
        <Table
          data={tipoCliente}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
    </Section>
  );
}
