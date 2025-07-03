import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useState } from "react";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useModal } from "../../../hooks/useModal";
import Button from "../../../components/common/Button";

export const Route = createFileRoute(
  "/dashboard/configuracion/tipo-orden-servicio",
)({
  component: RouteComponent,
});

interface TipoOrdenServicio {
  idEstadoOrdenServicio: number;
  descripcion: string;
  estado: boolean;
  programable: boolean;
  dias: number;
}

function RouteComponent() {
  const [selectedRow, setSelectedRow] = useState<Row<TipoOrdenServicio> | null>(
    null,
  );
  const { showModal, hideModal } = useModal(
    "agregar-tipo-orden-servicio-modal",
  );

  const handleShowModal = () => {
    showModal(
      <div className="space-y-4">
        <p className="text-gray-600">
          Formulario para agregar un tipo de orden de servicio
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            onClick={hideModal}
            className="w-auto bg-gray-500 hover:bg-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              alert("Action confirmed!");
              hideModal();
            }}
            className="w-auto"
          >
            Agregar
          </Button>
        </div>
      </div>,
      "Agregar tipo de orden de servicio",
      "md",
    );
  };

  const dataOrdenServicio: TipoOrdenServicio[] = [
    {
      idEstadoOrdenServicio: 1,
      descripcion: "Orden de servicio",
      estado: true,
      programable: false,
      dias: 1,
    },
    {
      idEstadoOrdenServicio: 2,
      descripcion: "Orden de servicio",
      estado: true,
      programable: true,
      dias: 1,
    },
  ];

  const columns: ColumnDef<TipoOrdenServicio>[] = [
    {
      accessorKey: "idEstadoOrdenServicio",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.getValue("idEstadoOrdenServicio")}
        </span>
      ),
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => <span>{row.getValue("descripcion")}</span>,
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => (
        <span className="rounded-md bg-green-500 px-2 py-1 text-white">
          {row.getValue("estado") ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      accessorKey: "programable",
      header: "Programable",
      cell: ({ row }) => (
        <span>{row.getValue("programable") ? "Si" : "No"}</span>
      ),
    },
    {
      accessorKey: "dias",
      header: "Días",
      cell: ({ row }) => <span>{row.getValue("dias")}</span>,
    },
    {
      accessorKey: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        if (row.getValue("programable")) {
          return (
            <ButtonAction Icon={PencilIcon} label="Editar" onClick={() => {}} />
          );
        }
        return <span>No disponible</span>;
      },
    },
  ];
  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar tipo de orden de servicio"
            onClick={handleShowModal}
          />
        </div>
        <Table
          data={dataOrdenServicio}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
    </Section>
  );
}
