import { ButtonAction } from "../../../common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { SubSegmentacion } from "../../../../types";
import { useModal } from "../../../../hooks/useModal";

interface SubSegmentacionTabProps {
  dataSubSegmentacion: SubSegmentacion[];
}

export function SubSegmentacionTab({
  dataSubSegmentacion,
}: SubSegmentacionTabProps) {
  const { showModal } = useModal("agregar-sub-segmentacion-modal");
  const { showModal: showModalEditar } = useModal(
    "editar-sub-segmentacion-modal",
  );

  const columnsSubSegmentacion: ColumnDef<SubSegmentacion>[] = [
    {
      accessorKey: "idSubSegmentacion",
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
          onClick={() => handleShowEditSubSegmentacionModal(row)}
        />
      ),
    },
  ];

  const handleShowAddSubSegmentacionModal = () => {
    showModal(
      <div className="space-y-4">
        <p className="text-gray-600">
          Formulario para agregar una sub-segmentación
        </p>
      </div>,
      "Agregar sub-segmentación",
      "md",
    );
  };

  const handleShowEditSubSegmentacionModal = (row: any) => {
    showModalEditar(
      <div className="space-y-4">
        <p className="text-gray-600">
          Formulario para editar una sub-segmentación
        </p>
        <pre>{JSON.stringify(row?.original, null, 2)}</pre>
      </div>,
      "Editar sub-segmentación",
      "md",
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Agregar segmentación"
          onClick={handleShowAddSubSegmentacionModal}
        />
      </div>
      <Table
        data={dataSubSegmentacion}
        columns={columnsSubSegmentacion}
        enablePagination={true}
        pageSize={10}
        enableSorting={true}
      />
    </div>
  );
}
