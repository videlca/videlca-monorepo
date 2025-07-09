import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { TipoGenero } from "../../../types";

export const Route = createFileRoute("/dashboard/configuracion/tipo-genero")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

const tipoGenero: TipoGenero[] = [
  { idTipoGenero: 1, descripcion: "Masculino", estado: true },
  { idTipoGenero: 2, descripcion: "Femenino", estado: false },
];

const columns: ColumnDef<TipoGenero>[] = [
  {
    header: "ID",
    accessorKey: "idTipoGenero",
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
            label="Agregar tipo de género"
            onClick={() => {}}
          />
        </div>
        <Table
          data={tipoGenero}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
    </Section>
  );
}
