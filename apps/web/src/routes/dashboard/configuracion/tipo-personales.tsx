import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { StateLabel } from "../../../components/common/StateLabel";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { TipoPersonal } from "../../../types";
import {
  useActualizarTipoPersonal,
  useCrearTipoPersonal,
  useEliminarTipoPersonal,
  useTipoPersonal,
} from "../../../api/queryFunctions/configuracion";
import type { CreateTipoPersonal } from "../../../api/types";
import { useForm } from "react-hook-form";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useState } from "react";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import type { UpdateTipoPersonalDto } from "../../../api/dtos";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute(
  "/dashboard/configuracion/tipo-personales",
)({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState<boolean>(false);
  const [isModalOpenEliminar, setIsModalOpenEliminar] =
    useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Queries y mutations
  const { data: tipoPersonal, isLoading } = useTipoPersonal();
  const { mutate: crearTipoPersonal, isPending: isCreatingTipoPersonal } =
    useCrearTipoPersonal();
  const {
    mutate: actualizarTipoPersonal,
    isPending: isActualizandoTipoPersonal,
  } = useActualizarTipoPersonal();
  const { mutate: eliminarTipoPersonal } = useEliminarTipoPersonal();

  // Formularios
  const { register, handleSubmit, reset } = useForm<CreateTipoPersonal>({
    defaultValues: { descripcion: "" },
  });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<UpdateTipoPersonalDto>({
    defaultValues: { descripcion: "", estado: false },
  });

  const onSubmit = (data: CreateTipoPersonal) => {
    crearTipoPersonal(data, {
      onSettled: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const onSubmitEditar = (data: UpdateTipoPersonalDto) => {
    actualizarTipoPersonal(
      {
        id: selectedRow as number,
        data: {
          descripcion: data.descripcion,
          estado: String(data.estado) === "true",
        },
      },
      {
        onSettled: () => {
          setIsModalOpenEditar(false);
          resetEditar();
          setSelectedRow(null);
        },
      },
    );
  };

  const handleShowModalEditar = (row: TipoPersonal) => {
    setIsModalOpenEditar(true);
    resetEditar({
      estado: row.estado,
      descripcion: row.descripcion,
    });
    setSelectedRow(row.idTipoPersonal);
  };

  const columns: ColumnDef<TipoPersonal>[] = [
    {
      header: "ID",
      accessorKey: "idTipoPersonal",
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
          menuId={`actions-${row.original.idTipoPersonal}`}
          actions={[
            {
              label: "Editar",
              onClick: () => handleShowModalEditar(row.original),
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIsModalOpenEliminar(true);
                setSelectedRow(row.original.idTipoPersonal);
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
            label="Agregar tipo de personal"
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <Table
          data={tipoPersonal?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={5}
          enableSorting={true}
          loading={isLoading}
        />
      </div>
      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar tipo de personal"
        size="md"
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
      >
        <FormsModal
          onSubmit={handleSubmit(onSubmit)}
          isLoading={isCreatingTipoPersonal}
          onCancel={() => {
            setIsModalOpen(false);
            reset();
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
              {...register("descripcion")}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar tipo de personal"
        size="md"
        onClose={() => {
          setIsModalOpenEditar(false);
          resetEditar();
        }}
      >
        <FormsModal
          onSubmit={handleSubmitEditar(onSubmitEditar)}
          isLoading={isActualizandoTipoPersonal}
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
        text="¿Estás seguro de querer eliminar este tipo de personal?"
        onClose={() => {
          setIsModalOpenEliminar(false);
        }}
        onDelete={() => {
          eliminarTipoPersonal(
            { id: selectedRow as number },
            {
              onSettled: () => {
                setIsModalOpenEliminar(false);
                setSelectedRow(null);
              },
            },
          );
        }}
      />
    </Section>
  );
}
