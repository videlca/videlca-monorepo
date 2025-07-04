import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { TipoNovedad } from "../../../types";

export const Route = createFileRoute("/dashboard/configuracion/tipos-novedad")({
  component: RouteComponent,
});

const tipoNovedad: TipoNovedad[] = [
  { idTipoNovedad: 1, descripcion: "Licencia", estado: true, retirado: false },
  {
    idTipoNovedad: 2,
    descripcion: "Incapacidad",
    estado: false,
    retirado: true,
  },
];

const columns: ColumnDef<TipoNovedad>[] = [
  {
    header: "ID",
    accessorKey: "idTipoNovedad",
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
    header: "Retirado",
    accessorKey: "retirado",
    cell: ({ row }) => {
      return <StateLabel state={row.original.retirado} />;
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
            label="Agregar tipo novedad"
            onClick={() => {}}
          />
        </div>
        <Table
          data={tipoNovedad}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
    </Section>
  );
}
