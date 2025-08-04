import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { TipoHorarioDescripcion } from "../../../api/types/servicio";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import { useTipoHorarioDescripcion } from "../../../api/queryFunctions/servicios";

export const Route = createFileRoute("/dashboard/servicios/tipo-horario")({
  component: RouteComponent,
});

function RouteComponent() {
  // Queries y mutaciones
  const { data: tipoHorarioDescripcion } = useTipoHorarioDescripcion();

  const columns: ColumnDef<TipoHorarioDescripcion>[] = [
    {
      header: "Nombre",
      accessorKey: "nombre",
      cell: ({ row }) => (
        <span className="font-medium capitalize">{row.getValue("nombre")}</span>
      ),
    },
    {
      header: "Descripción",
      accessorKey: "descripcion",
      cell: ({ row }) => (
        <span className="font-normal">{row.getValue("descripcion")}</span>
      ),
    },
  ];
  return (
    <Section>
      <div className="flex flex-col gap-8">
        <Table
          data={tipoHorarioDescripcion?.data || []}
          columns={columns}
          pageSize={10}
          enableSorting={true}
          enablePagination={false}
        />
      </div>
    </Section>
  );
}
