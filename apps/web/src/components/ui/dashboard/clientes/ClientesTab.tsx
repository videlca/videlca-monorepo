import { ButtonAction } from "../../../common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Cliente } from "../../../../types";
import { SimpleModal } from "../../../common/SimpleModal";
import { useState } from "react";

interface ClientesTabProps {
  dataClientes: Cliente[];
}

export function ClientesTab({ dataClientes }: ClientesTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const columnsClientes: ColumnDef<Cliente>[] = [
    {
      accessorKey: "idCliente",
      header: "ID",
    },
    {
      accessorKey: "idTipoIdentificacion.descripcion",
      header: "Tipo de identificación",
    },
    {
      accessorKey: "numeroIdentificacion",
      header: "Número de identificación",
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      accessorKey: "idTipoCliente.descripcion",
      header: "Tipo de cliente",
    },
    {
      accessorKey: "idSubSegmentacion.descripcion",
      header: "Subsegmentación",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        return <StateLabel state={row.original.estado} />;
      },
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <ButtonAction
          Icon={PencilIcon}
          label="Editar"
          onClick={() => {
            handleShowEditClienteModal(row);
          }}
        />
      ),
    },
  ];

  const handleShowAddClienteModal = () => {
    setIsAddModalOpen(true);
  };

  const handleShowEditClienteModal = (row: Row<Cliente>) => {
    setEditingCliente(row.original);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Nuevo cliente"
          onClick={handleShowAddClienteModal}
        />
      </div>
      <Table
        data={dataClientes}
        columns={columnsClientes}
        enableSorting={true}
        enablePagination={true}
        pageSize={10}
        enableFiltering={true}
      />

      {/* Modal para agregar cliente */}
      <SimpleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar cliente"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Formulario para agregar un cliente</p>
        </div>
      </SimpleModal>

      {/* Modal para editar cliente */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar cliente"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Formulario para editar un cliente</p>
          {editingCliente && (
            <pre>{JSON.stringify(editingCliente, null, 2)}</pre>
          )}
        </div>
      </SimpleModal>
    </div>
  );
}
