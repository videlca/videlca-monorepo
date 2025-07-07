import { ButtonAction } from "../../../common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Locacion } from "../../../../types";
import { useModal } from "../../../../hooks/useModal";

interface LocacionesTabProps {
  dataLocaciones: Locacion[];
}

export function LocacionesTab({ dataLocaciones }: LocacionesTabProps) {
  const { showModal } = useModal("agregar-locacion-modal");
  const { showModal: showModalEditar } = useModal("editar-locacion-modal");

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
    showModal(
      <div className="space-y-4">
        <p className="text-gray-600">Formulario para agregar una locación</p>
      </div>,
      "Agregar locación",
      "md",
    );
  };

  const handleShowEditLocacionModal = (row: any) => {
    showModalEditar(
      <div className="space-y-4">
        <p className="text-gray-600">Formulario para editar una locación</p>
        <pre>{JSON.stringify(row?.original, null, 2)}</pre>
      </div>,
      "Editar locación",
      "md",
    );
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
        data={dataLocaciones}
        columns={columnsLocaciones}
        enablePagination={true}
        pageSize={10}
        enableSorting={true}
      />
    </div>
  );
}
