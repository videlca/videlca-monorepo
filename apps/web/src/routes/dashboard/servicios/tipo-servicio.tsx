import { createFileRoute } from "@tanstack/react-router";
import type { TipoServicio } from "../../../api/types/servicio";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import { useTipoServicios } from "../../../api/queryFunctions/servicios/tipo-servicio";
import { StateLabel } from "../../../components/common/StateLabel";

export const Route = createFileRoute("/dashboard/servicios/tipo-servicio")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados

  // Queries y Mutaciones
  const { data: tipoServicios } = useTipoServicios();

  const columns: ColumnDef<TipoServicio>[] = [
    {
      header: "ID",
      accessorKey: "idTipoServicio",
    },
    {
      header: "Nombre",
      accessorKey: "nombre",
    },
    {
      header: "Descripción",
      accessorKey: "descripcion",
    },
    {
      header: "Requiere personal",
      cell: ({ row }) => {
        return <StateLabel state={row.original.requierePersonal} />;
      },
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
          label="Agregar Tipo de Servicio"
          onClick={() => {}}
        />
      </div>
      <Table
        columns={columns}
        data={tipoServicios?.data || []}
        enablePagination={false}
        enableSorting={true}
      />
    </Section>
  );
}
