import { ButtonAction } from "../../../common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { SubSegmentacion } from "../../../../types";
import { SimpleModal } from "../../../common/SimpleModal";
import { useState } from "react";
import { MoreActionsButton } from "../../common/MoreActionsButton";

export function SubSegmentacionTab() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubSegmentacion, setEditingSubSegmentacion] =
    useState<SubSegmentacion | null>(null);

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
      cell: ({ row }) => <StateLabel state={row.original.estado as boolean} />,
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idSubSegmentacion}`}
          actions={[
            {
              label: "Editar",
              onClick: () => handleShowEditSubSegmentacionModal(row),
            },
          ]}
        />
      ),
    },
  ];

  const handleShowAddSubSegmentacionModal = () => {
    setIsAddModalOpen(true);
  };

  const handleShowEditSubSegmentacionModal = (row: any) => {
    setEditingSubSegmentacion(row.original);
    setIsEditModalOpen(true);
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
        data={[]}
        columns={columnsSubSegmentacion}
        enablePagination={true}
        pageSize={5}
        enableSorting={true}
      />

      {/* Modal para agregar sub-segmentación */}
      <SimpleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar sub-segmentación"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Formulario para agregar una sub-segmentación
          </p>
        </div>
      </SimpleModal>

      {/* Modal para editar sub-segmentación */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar sub-segmentación"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Formulario para editar una sub-segmentación
          </p>
          {editingSubSegmentacion && (
            <pre>{JSON.stringify(editingSubSegmentacion, null, 2)}</pre>
          )}
        </div>
      </SimpleModal>
    </div>
  );
}
