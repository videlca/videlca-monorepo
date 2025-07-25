import { createFileRoute } from "@tanstack/react-router";
import { EyeIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { Section } from "../../../components/ui/dashboard/Section";
import { useServicios } from "../../../api/queryFunctions/servicios";
import type { Servicio } from "../../../api/types/servicio";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";

export const Route = createFileRoute("/dashboard/servicios/")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados

  // Queries y Mutaciones
  const { data: servicios } = useServicios();

  const columns: ColumnDef<Servicio>[] = [
    {
      header: "Código",
      accessorKey: "codigo",
    },
    {
      header: "Descripción",
      accessorKey: "descripcion",
    },
    {
      header: "Tipo de servicio",
      accessorKey: "idTipoServicio.nombre",
    },
    {
      header: "Duración",
      accessorKey: "idTipoDuracion.descripcion",
    },
    {
      header: "Horario",
      accessorKey: "idTipoHorarioDescripcion.descripcion",
    },
    {
      header: "Horas fijas",
      accessorKey: "horasFijas",
    },
    {
      header: "Estado",
      cell: ({ row }) => {
        return <StateLabel state={row.original.estado} />;
      },
    },
    {
      header: "Acciones",
      cell: ({ row }) => {
        return (
          <div className="flex gap-2">
            <ButtonAction Icon={PencilIcon} label="Editar" onClick={() => {}} />
            <ButtonAction Icon={EyeIcon} label="Ver" onClick={() => {}} />
            <ButtonAction
              Icon={TrashIcon}
              label="Eliminar"
              onClick={() => {}}
              color="red"
            />
          </div>
        );
      },
    },
  ];

  return (
    <Section>
      <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Agregar Servicio"
          onClick={() => {}}
        />
      </div>
      <Table
        columns={columns}
        data={servicios?.data || []}
        enablePagination={false}
        enableSorting={true}
      />
    </Section>
  );
}
