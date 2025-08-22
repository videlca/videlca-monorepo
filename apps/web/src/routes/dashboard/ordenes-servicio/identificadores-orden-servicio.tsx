import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { CheckIcon, EditIcon, PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrdenServicioId } from "../../../api/types/orden-servicio";

export const Route = createFileRoute(
  "/dashboard/ordenes-servicio/identificadores-orden-servicio",
)({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAdd, setIsOpenAdd] = useState(false);

  // Queries y mutaciones

  const columns: ColumnDef<OrdenServicioId>[] = [
    {
      header: "Id Orden de Servicio",
      accessorKey: "idOrdenServicioId",
    },
    {
      header: "Descripción",
      accessorKey: "descripcionId",
    },
    {
      header: "Fecha de Creación",
      accessorKey: "fechaCreacion",
    },
    {
      header: "Anulado",
      accessorKey: "anulado",
      cell: ({ row }) => {
        return row.original.anulado ? (
          <XIcon className="h-4 w-4" />
        ) : (
          <CheckIcon className="h-4 w-4" />
        );
      },
    },
    {
      header: "Acciones",
      accessorKey: "acciones",
      cell: ({ row }) => {
        return (
          <ButtonAction
            Icon={EditIcon}
            label="Editar"
            onClick={() => {
              setIsOpenAdd(true);
            }}
          />
        );
      },
    },
  ];

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar orden de servicio"
            onClick={() => {
              setIsOpenAdd(true);
            }}
          />
        </div>
        <Table
          columns={columns}
          data={[]}
          enableFiltering={false}
          enablePagination={true}
        />
      </div>
    </Section>
  );
}
