import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PlusIcon } from "lucide-react";
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
import { useForm } from "react-hook-form";

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

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
  } = useForm<{ descripcionId: string; }>();

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
  } = useForm<{ descripcionId: string }>();

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
                setValueEdit("descripcionId", row.original.descripcionId);
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
          onSubmit={handleSubmitAdd((data) => {
            anularIdOrdenServicio(
              { descripcionId: Number(data.descripcionId) },
              {
                onSuccess: () => {
                  setIsOpenAdd(false);
                  resetAdd();
                },
              },
            );
          })}
          isLoading={isAnulandoIdOrdenServicio}
          onCancel={() => {
            setIsOpenAdd(false);
            resetAdd();
          }}
          updating={false}
        >
          <InputForm
            type="text"
            id="descripcionId"
            label="Identificador"
            placeholder="Identificador de orden de servicio"
            required
            {...registerAdd("descripcionId")}
          />
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEdit}
        onClose={() => setIsOpenEdit(false)}
        title="Editar identificador de orden de servicio"
      >
        <FormsModal
          onSubmit={handleSubmitEdit((data) => {
            updateIdOrdenServicio(
              { id: idOrdenServicioId || 0, data: { descripcionId: data.descripcionId } },
              {
                onSuccess: () => {
                  setIsOpenEdit(false);
                  resetEdit();
                },
              },
            );
          })}
          isLoading={isUpdatingIdOrdenServicio}
          onCancel={() => {
            setIsOpenEdit(false);
            resetEdit();
          }}
          updating={true}
        >
          <InputForm
            type="text"
            id="descripcionId"
            label="Identificador"
            placeholder="Identificador de orden de servicio"
            required
            {...registerEdit("descripcionId")}
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
