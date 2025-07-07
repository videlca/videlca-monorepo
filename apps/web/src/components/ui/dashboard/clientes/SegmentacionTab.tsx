import { ButtonAction } from "../../../common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Segmentacion } from "../../../../types";
import { useModal } from "../../../../hooks/useModal";

interface SegmentacionTabProps {
  dataSegmentacion: Segmentacion[];
}

export function SegmentacionTab({ dataSegmentacion }: SegmentacionTabProps) {
  const { showModal } = useModal("agregar-segmentacion-modal");
  const { showModal: showModalEditar } = useModal("editar-segmentacion-modal");

  const columnsSegmentacion: ColumnDef<Segmentacion>[] = [
    {
      accessorKey: "idSegmentacion",
      header: "ID",
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => <StateLabel state={row.original.estado} />,
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <ButtonAction
          Icon={PencilIcon}
          label="Editar"
          onClick={() => handleShowEditSegmentacionModal(row)}
        />
      ),
    },
  ];

  const handleShowAddSegmentacionModal = () => {
    showModal(
      <div className="space-y-4">
        <p className="text-gray-600">
          Formulario para agregar una segmentación
        </p>
      </div>,
      "Agregar segmentación",
      "md",
    );
  };

  const handleShowEditSegmentacionModal = (row: any) => {
    showModalEditar(
      <div className="space-y-4">
        <p className="text-gray-600">Formulario para editar una segmentación</p>
        <pre>{JSON.stringify(row?.original, null, 2)}</pre>
      </div>,
      "Editar segmentación",
      "md",
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Agregar segmentación"
          onClick={handleShowAddSegmentacionModal}
        />
      </div>
      <Table
        data={dataSegmentacion}
        columns={columnsSegmentacion}
        enablePagination={true}
        pageSize={10}
        enableSorting={true}
      />
    </div>
  );
}
