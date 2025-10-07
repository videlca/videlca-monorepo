import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../components/common/Table";
import type { EstadoOrden } from "../../../types";
import { useEstadoOrden } from "../../../api/queryFunctions/configuracion";

export const Route = createFileRoute(
  "/dashboard/configuracion/estado-orden-servicio",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: estadosOrden } = useEstadoOrden();

  const columns: ColumnDef<EstadoOrden>[] = [
    // {
    //   accessorKey: "idEstadoOrdenServicio",
    //   header: "ID",
    //   cell: ({ row }) => (
    //     <span className="font-medium">
    //       {row.getValue("idEstadoOrdenServicio")}
    //     </span>
    //   ),
    // },
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <span className="font-medium capitalize">{row.getValue("nombre")}</span>
      ),
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("descripcion")}</span>
      ),
    },
  ];

  // TODO: revisar cambios de la tabla y actualizar por cambios nuevos
  return (
    <Section>
      <div className="flex flex-col gap-8">
        <Table
          data={estadosOrden?.data || []}
          columns={columns}
          enablePagination={false}
          pageSize={5}
          enableSorting={false}
        />
      </div>
    </Section>
  );
}
