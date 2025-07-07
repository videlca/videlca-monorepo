import { ButtonAction } from "../../../common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Cliente } from "../../../../types";
import { useModal } from "../../../../hooks/useModal";

interface ClientesTabProps {
  dataClientes: Cliente[];
}

export function ClientesTab({ dataClientes }: ClientesTabProps) {
  const { showModal } = useModal("agregar-cliente-modal");
  const { showModal: showModalEditar } = useModal("editar-cliente-modal");

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
    showModal(
      <div className="space-y-4">
        <p className="text-gray-600">Formulario para agregar un cliente</p>
      </div>,
      "Agregar cliente",
      "md",
    );
  };

  const handleShowEditClienteModal = (row: Row<Cliente>) => {
    showModalEditar(
      <div className="space-y-4">
        <p className="text-gray-600">Formulario para editar un cliente</p>
        <pre>{JSON.stringify(row?.original, null, 2)}</pre>
      </div>,
      "Editar cliente",
      "md",
    );
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
    </div>
  );
}
