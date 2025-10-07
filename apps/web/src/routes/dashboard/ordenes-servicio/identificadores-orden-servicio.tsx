import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrdenServicioId } from "../../../api/types/orden-servicio";
import {
  useDeleteIdOrdenServicio,
  useGetIdsOrdenServicio,
  useUpdateIdOrdenServicio,
} from "../../../api/queryFunctions/orden-servicio/orden-servicio-id";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { InputForm } from "../../../components/common/InputForm";
import { useAnularIdOrdenServicio } from "../../../api/queryFunctions/orden-servicio/orden-servicio-id";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute(
  "/dashboard/ordenes-servicio/identificadores-orden-servicio",
)({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);

  const [idOrdenServicioId, setIdOrdenServicioId] = useState<number | null>(
    null,
  );
  const [descripcionId, setDescripcionId] = useState<string>("");

  // Queries y mutaciones
  const { data: idsOrdenServicio } = useGetIdsOrdenServicio();
  const {
    mutate: anularIdOrdenServicio,
    isPending: isAnulandoIdOrdenServicio,
  } = useAnularIdOrdenServicio();
  const {
    mutate: updateIdOrdenServicio,
    isPending: isUpdatingIdOrdenServicio,
  } = useUpdateIdOrdenServicio();
  const { mutate: deleteIdOrdenServicio } = useDeleteIdOrdenServicio();

  const columns: ColumnDef<OrdenServicioId>[] = [
    {
      header: "Identificador",
      accessorKey: "descripcionId",
      cell: ({ row }) => {
        return (
          <span className="font-medium whitespace-nowrap text-gray-700">
            {row.original.descripcionId}
          </span>
        );
      },
    },
    {
      header: "Fecha de Creación",
      accessorKey: "fechaCreacion",
      cell: ({ row }) => {
        return (
          <span className="text-sm whitespace-nowrap text-gray-500">
            {row.original.fechaCreacion}
          </span>
        );
      },
    },
    {
      header: "Anulado",
      accessorKey: "anulado",
      cell: ({ row }) => {
        return (
          <span className="text-sm whitespace-nowrap text-gray-500">
            {row.original.anulado ? "Si" : "No"}
          </span>
        );
      },
    },
    {
      header: "Acciones",
      accessorKey: "acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idOrdenServicioId}`}
          actions={[
            {
              label: "Editar",
              onClick: () => {
                setIsOpenEdit(true);
                setIdOrdenServicioId(row.original.idOrdenServicioId);
                setDescripcionId(row.original.descripcionId);
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIsOpenDelete(true);
                setIdOrdenServicioId(row.original.idOrdenServicioId);
              },
              color: "red" as const,
            },
          ]}
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
            label="Anular identificador"
            onClick={() => {
              setIsOpenAdd(true);
            }}
          />
        </div>
        <Table
          columns={columns}
          data={idsOrdenServicio?.data || []}
          pageSize={5}
          enableFiltering={false}
          enablePagination={true}
        />
      </div>

      <SimpleModal
        isOpen={isOpenAdd}
        onClose={() => setIsOpenAdd(false)}
        title="Ingresar identificador de orden de servicio a anular"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            anularIdOrdenServicio(
              { descripcionId },
              {
                onSuccess: () => {
                  setIsOpenAdd(false);
                  setDescripcionId("");
                },
              },
            );
          }}
          isLoading={isAnulandoIdOrdenServicio}
          onCancel={() => {
            setIsOpenAdd(false);
            setDescripcionId("");
          }}
          updating={false}
        >
          <InputForm
            type="text"
            id="descripcionId"
            label="Identificador"
            placeholder="Identificador de orden de servicio"
            value={descripcionId}
            onChange={(e) => setDescripcionId(e.target.value)}
            required
          />
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEdit}
        onClose={() => setIsOpenEdit(false)}
        title="Editar identificador de orden de servicio"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            updateIdOrdenServicio(
              { id: idOrdenServicioId || 0, data: { descripcionId } },
              {
                onSuccess: () => {
                  setIsOpenEdit(false);
                  setDescripcionId("");
                },
              },
            );
          }}
          isLoading={isUpdatingIdOrdenServicio}
          onCancel={() => {
            setIsOpenEdit(false);
            setDescripcionId("");
          }}
          updating={true}
        >
          <InputForm
            type="text"
            id="descripcionId"
            label="Identificador"
            placeholder="Identificador de orden de servicio"
            value={descripcionId}
            onChange={(e) => setDescripcionId(e.target.value)}
            required
          />
        </FormsModal>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDelete}
        text="¿Estás seguro de querer eliminar este identificador de orden de servicio?"
        onDelete={() => {
          deleteIdOrdenServicio(
            { id: idOrdenServicioId || 0 },
            {
              onSuccess: () => {
                setIsOpenDelete(false);
              },
            },
          );
        }}
        onClose={() => setIsOpenDelete(false)}
      />
    </Section>
  );
}
