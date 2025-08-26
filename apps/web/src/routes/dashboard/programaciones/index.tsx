import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { useProgramacionPersonal } from "../../../api/queryFunctions/programacion-personal";
import Table from "../../../components/common/Table";
import type { ColumnDef } from "@tanstack/react-table";
import type { ProgramacionPersonal } from "../../../api/types";

export const Route = createFileRoute("/dashboard/programaciones/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: programacionPersonalQuery } = useProgramacionPersonal();

  console.log(programacionPersonalQuery);

  const columns: ColumnDef<ProgramacionPersonal>[] = [
    {
      header: "Id. Orden de Servicio",
      accessorKey: "idOrdenServicioTarifa",
    },
    {
      header: "Personal",
      accessorKey: "personal",
      cell: ({ row }) => {
        return (
          <span className="font-medium whitespace-nowrap text-gray-500">
            {row.original.idPersonal.primerNombre}{" "}
            {row.original.idPersonal.primerApellido}
          </span>
        );
      },
    },
    {
      header: "Hora Inicio",
      accessorKey: "horaInicio",
    },
    {
      header: "Hora Fin",
      accessorKey: "horaFin",
    },
  ];

  return (
    <Section>
      <Table data={programacionPersonalQuery?.data || []} columns={columns} />
    </Section>
  );
}
