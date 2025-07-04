import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useState } from "react";
import Table from "../../../components/common/Table";
import { useModal } from "../../../hooks/useModal";
import type { Cliente } from "../../../types";
import { StateLabel } from "../../../components/common/StateLabel";

export const Route = createFileRoute("/dashboard/clientes/")({
  component: RouteComponent,
});

function RouteComponent() {
  // const [selectedRow, setSelectedRow] = useState<Row<User> | null>(null);

  const { showModal, hideModal } = useModal("agregar-cliente-modal");
  const { showModal: showModalEditar, hideModal: hideModalEditar } = useModal(
    "editar-cliente-modal",
  );

  const handleShowModal = () => {
    showModal(
      <div className="space-y-4">
        <p className="text-gray-600">Formulario para agregar un cliente</p>
      </div>,
      "Agregar cliente",
      "md",
    );
  };

  const handleShowModalEditar = (row: Row<Cliente>) => {
    showModalEditar(
      <div className="space-y-4">
        <p className="text-gray-600">Formulario para editar un cliente</p>
        <pre>{JSON.stringify(row?.original, null, 2)}</pre>
      </div>,
      "Editar cliente",
      "md",
    );
  };

  const dataUsers: Cliente[] = [
    {
      idCliente: 1,
      numeroIdentificacion: "1234567890",
      nombre: "John Doe",
      estado: true,
      idTipoIdentificacion: {
        idTipoIdentificacion: 1,
        descripcion: "Cédula",
        estado: true,
      },
      idTipoCliente: {
        idTipoCliente: 1,
        descripcion: "Cliente",
        estado: true,
      },
      idSubSegmentacion: {
        idSubSegmentacion: 1,
        descripcion: "SubSegmentación 1",
        estado: true,
        idSegmentacion: {
          idSegmentacion: 1,
          descripcion: "Segmentación 1",
          estado: true,
        },
      },
    },
    {
      idCliente: 2,
      numeroIdentificacion: "1234567890",
      nombre: "Jane Smith",
      estado: true,
      idTipoIdentificacion: {
        idTipoIdentificacion: 2,
        descripcion: "NIT",
        estado: true,
      },
      idTipoCliente: {
        idTipoCliente: 2,
        descripcion: "Proveedor",
        estado: true,
      },
      idSubSegmentacion: {
        idSubSegmentacion: 2,
        descripcion: "SubSegmentación 2",
        estado: true,
        idSegmentacion: {
          idSegmentacion: 2,
          descripcion: "Segmentación 2",
          estado: true,
        },
      },
    },
  ];

  // Column definitions
  const columns: ColumnDef<Cliente>[] = [
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
            handleShowModalEditar(row);
          }}
        />
      ),
    },
  ];
  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Nuevo cliente"
            onClick={() => {
              // console.log(selectedRow?.original);
              handleShowModal();
            }}
          />
        </div>
        <Table
          data={dataUsers}
          columns={columns}
          enableSorting={true}
          enablePagination={true}
          pageSize={10}
          enableFiltering={true}
        />
        {/* <pre>{JSON.stringify(selectedRow?.original, null, 2)}</pre> */}
      </div>
    </Section>
  );
}
