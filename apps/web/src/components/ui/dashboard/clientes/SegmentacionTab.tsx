import { ButtonAction } from "../../../common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Segmentacion } from "../../../../types";
import { SimpleModal } from "../../../common/SimpleModal";
import { useState } from "react";

interface SegmentacionTabProps {
  dataSegmentacion: Segmentacion[];
}

export function SegmentacionTab({ dataSegmentacion }: SegmentacionTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSegmentacion, setEditingSegmentacion] =
    useState<Segmentacion | null>(null);

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
    setIsAddModalOpen(true);
  };

  const handleShowEditSegmentacionModal = (row: any) => {
    setEditingSegmentacion(row.original);
    setIsEditModalOpen(true);
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

      {/* Modal para agregar segmentación */}
      <SimpleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar segmentación"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Formulario para agregar una segmentación
          </p>
        </div>
      </SimpleModal>

      {/* Modal para editar segmentación */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar segmentación"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Formulario para editar una segmentación
          </p>
          {editingSegmentacion && (
            <pre>{JSON.stringify(editingSegmentacion, null, 2)}</pre>
          )}
        </div>
      </SimpleModal>
    </div>
  );
}
