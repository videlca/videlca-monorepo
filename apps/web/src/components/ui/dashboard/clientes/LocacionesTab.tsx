import { ButtonAction } from "../../../common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Locacion } from "../../../../types";
import { SimpleModal } from "../../../common/SimpleModal";
import { useState } from "react";

export function LocacionesTab() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLocacion, setEditingLocacion] = useState<Locacion | null>(null);

  const columnsLocaciones: ColumnDef<Locacion>[] = [
    {
      accessorKey: "idLocacion",
      header: "ID",
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      accessorKey: "direccion",
      header: "Dirección",
    },
    {
      accessorKey: "latitud",
      header: "Latitud",
    },
    {
      accessorKey: "longitud",
      header: "Longitud",
    },
    {
      accessorKey: "primerNombreResponsable",
      header: "Primer nombre responsable",
    },
    {
      accessorKey: "primerApellidoResponsable",
      header: "Primer apellido responsable",
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
    },
    {
      accessorKey: "telefono_2",
      header: "Teléfono 2",
    },
    {
      accessorKey: "idCliente.nombre",
      header: "Cliente",
    },
    {
      accessorKey: "idCiudad.descripcion",
      header: "Ciudad",
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
          onClick={() => handleShowEditLocacionModal(row)}
        />
      ),
    },
  ];

  const handleShowAddLocacionModal = () => {
    setIsAddModalOpen(true);
  };

  const handleShowEditLocacionModal = (row: any) => {
    setEditingLocacion(row.original);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Agregar locación"
          onClick={handleShowAddLocacionModal}
        />
      </div>
      <Table
        data={[]}
        columns={columnsLocaciones}
        enablePagination={true}
        pageSize={10}
        enableSorting={true}
      />

      {/* Modal para agregar locación */}
      <SimpleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar locación"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Formulario para agregar una locación</p>
        </div>
      </SimpleModal>

      {/* Modal para editar locación */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar locación"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Formulario para editar una locación</p>
          {editingLocacion && (
            <pre>{JSON.stringify(editingLocacion, null, 2)}</pre>
          )}
        </div>
      </SimpleModal>
    </div>
  );
}
