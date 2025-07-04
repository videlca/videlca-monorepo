import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { StateLabel } from "../../../components/common/StateLabel";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { TipoPersonal } from "../../../types";

export const Route = createFileRoute("/dashboard/configuracion/tipo-personal")({
  component: RouteComponent,
});

const tipoPersonal: TipoPersonal[] = [
  { idTipoPersonal: 1, descripcion: "Guardaespaldas", estado: true },
  { idTipoPersonal: 2, descripcion: "Transportador", estado: false },
];

const columns: ColumnDef<TipoPersonal>[] = [
  {
    header: "ID",
    accessorKey: "idTipoPersonal",
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
            label="Agregar tipo de personal"
            onClick={() => {}}
          />
        </div>
        <Table
          data={tipoPersonal}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
    </Section>
  );
}
