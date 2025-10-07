import { createFileRoute } from "@tanstack/react-router";
import { useTipoTarifa } from "../../../api/queryFunctions/tarifas/tipo-tarifa";
import type { ColumnDef } from "@tanstack/react-table";
import type { TipoTarifa } from "../../../api/types/periodo";
import Table from "../../../components/common/Table";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/tarifas/tipo-tarifa")({
  component: RouteComponent,
});

function RouteComponent() {
  // Queries y mutaciones
  const { data: tipoTarifa } = useTipoTarifa();

  const columns: ColumnDef<TipoTarifa>[] = [
    {
      header: "Nombre",
      accessorKey: "nombre",
      cell: ({ row }) => {
        return <span className="capitalize">{row.original.nombre}</span>;
      },
    },
    {
      header: "Descripción",
      accessorKey: "descripcion",
    },
    {
      header: "Tipo de unidad de tiempo",
      accessorKey: "idTipoUnidadTiempo.descripcion",
      cell: ({ row }) => {
        return (
          <span className="capitalize">
            {row.original.idTipoUnidadTiempo.descripcion}
          </span>
        );
      },
    },
    {
      header: "Cantidad de tiempo",
      accessorKey: "cantidadTiempo",
      cell: ({ row }) => {
        return <span>{row.original.cantidadTiempo || 0}</span>;
      },
    },
  ];
  return (
    <Section>
      <Table
        data={tipoTarifa?.data || []}
        columns={columns}
        pageSize={5}
        enableSorting={true}
        enablePagination={false}
      />
    </Section>
  );
}
