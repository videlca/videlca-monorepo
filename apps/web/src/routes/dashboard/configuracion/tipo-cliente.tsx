import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { StateLabel } from "../../../components/common/StateLabel";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { TipoCliente } from "../../../types";
import {
  useActualizarTipoCliente,
  useCrearTipoCliente,
  useEliminarTipoCliente,
  useTipoCliente,
} from "../../../api/queryFunctions/configuracion/tipo-cliente";
import { useState } from "react";
import type {
  ActualizarTipoCliente,
  CreateTipoCliente,
} from "../../../api/types";
import { useForm } from "react-hook-form";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute("/dashboard/configuracion/tipo-cliente")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

function RouteComponent() {
  // Estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);
  const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
  const [selectIdRow, setSelectIdRow] = useState<number | null>(null);

  // Queries y mutaciones
  const { data: tipoCliente } = useTipoCliente();
  const { mutate: crearTipoCliente, isPending: isCreatingTipoCliente } =
    useCrearTipoCliente();
  const {
    mutate: actualizarTipoCliente,
    isPending: isActualizandoTipoCliente,
  } = useActualizarTipoCliente();
  const { mutate: eliminarTipoCliente } = useEliminarTipoCliente();

  // Formularios
  const { register: registerCrear, handleSubmit: handleSubmitCrear, reset: resetCrear } =
    useForm<CreateTipoCliente>({
      defaultValues: { descripcion: "" },
    });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<ActualizarTipoCliente>({
    defaultValues: { descripcion: "", estado: false },
  });

  const onSubmitCrear = (data: CreateTipoCliente) => {
    crearTipoCliente(data);
    setIsModalOpen(false);
    resetCrear();
  };

  const handleShowModalEditar = (row: TipoCliente) => {
    setIsModalOpenEditar(true);
    resetEditar({
      estado: row.estado,
      descripcion: row.descripcion,
    });
    setSelectIdRow(row.idTipoCliente);
  };

  const onSubmitEditar = (data: ActualizarTipoCliente) => {
    actualizarTipoCliente({
      id: selectIdRow as number,
      data: {
        estado: String(data.estado) === "true",
        descripcion: data.descripcion,
      },
    });
    setIsModalOpenEditar(false);
    resetEditar();
  };

  const columns: ColumnDef<TipoCliente>[] = [
    {
      header: "ID",
      accessorKey: "idTipoCliente",
    },
    {
      header: "Descripción",
      accessorKey: "descripcion",
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: ({ row }) => {
        return <StateLabel state={row.original.estado} />;
      },
    },
    {
      header: "Acciones",
      accessorKey: "acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idTipoCliente}`}
          actions={[
            {
              label: "Editar",
              onClick: () => handleShowModalEditar(row.original),
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIsModalOpenEliminar(true);
                setSelectIdRow(row.original.idTipoCliente);
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
            label="Agregar tipo de cliente"
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <Table
          data={tipoCliente?.data?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={5}
          enableSorting={true}
        />
      </div>
      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar tipo de cliente"
        size="md"
        onClose={() => {
          setIsModalOpen(false);
          resetCrear();
        }}
      >
        <FormsModal
          onSubmit={handleSubmitCrear(onSubmitCrear)}
          isLoading={isCreatingTipoCliente}
          onCancel={() => {
            setIsModalOpen(false);
            resetCrear();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-2">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              required
              type="text"
              {...registerCrear("descripcion")}
            />
          </div>
        </FormsModal>
      </SimpleModal>
      <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar tipo de cliente"
        size="md"
        onClose={() => {
          setIsModalOpenEditar(false);
          resetEditar();
        }}
      >
        <FormsModal
          onSubmit={handleSubmitEditar(onSubmitEditar)}
          isLoading={isActualizandoTipoCliente}
          onCancel={() => {
            setIsModalOpenEditar(false);
            resetEditar();
          }}
          updating={true}
        >
          <div className="flex flex-col gap-2">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              required
              type="text"
              {...registerEditar("descripcion")}
            />
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              {...registerEditar("estado")}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isModalOpenEliminar}
        text="¿Estás seguro de querer eliminar este tipo de cliente?"
        onClose={() => {
          setIsModalOpenEliminar(false);
        }}
        onDelete={() => {
          eliminarTipoCliente(
            { id: selectIdRow as number },
            {
              onSettled: () => {
                setIsModalOpenEliminar(false);
                setSelectIdRow(null);
              },
            },
          );
        }}
      />
    </Section>
  );
}
