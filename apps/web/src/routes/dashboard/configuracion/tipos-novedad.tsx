import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import AddIcon from "@mui/icons-material/Add";
import Table from "../../../components/common/Table";
import type { TipoNovedad } from "../../../types";
import { useForm } from "react-hook-form";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import {
  useActualizarTipoNovedad,
  useCrearTipoNovedad,
  useTipoNovedad,
} from "../../../api/queryFunctions/configuracion";
import type {
  ActualizarTipoNovedad,
  CreateTipoNovedad,
} from "../../../api/types";
import { useState } from "react";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute("/dashboard/configuracion/tipos-novedad")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: tipoNovedad, isLoading } = useTipoNovedad();
  const { mutate: crearTipoNovedad } = useCrearTipoNovedad();
  const { mutate: actualizarTipoNovedad } = useActualizarTipoNovedad();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);
  const [editingRow, setEditingRow] = useState<TipoNovedad | null>(null);

  const { register, handleSubmit, reset } = useForm<CreateTipoNovedad>({
    defaultValues: { descripcion: "" },
  });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<ActualizarTipoNovedad>({
    defaultValues: { estado: false },
  });

  const onSubmit = (data: CreateTipoNovedad) => {
    crearTipoNovedad(data);
    setIsModalOpen(false);
    reset();
  };

  const handleShowModalEditar = (row: TipoNovedad) => {
    setIsModalOpenEditar(true);
    resetEditar({ estado: row.estado });
    setEditingRow(row);
  };

  const onSubmitEditar = (data: ActualizarTipoNovedad) => {
    actualizarTipoNovedad({
      id: editingRow?.idTipoNovedad as number,
      data: {
        estado: String(data.estado) === "true",
      },
    });
    setIsModalOpenEditar(false);
    resetEditar();
  };

  const columns: ColumnDef<TipoNovedad>[] = [
    {
      header: "ID",
      accessorKey: "idTipoNovedad",
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
      header: "Retirado",
      accessorKey: "retirado",
      cell: ({ row }) => {
        return <StateLabel state={row.original.retirado} />;
      },
    },
    {
      header: "Acciones",
      accessorKey: "acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idTipoNovedad}`}
          actions={[
            {
              label: "Editar",
              onClick: () => handleShowModalEditar(row.original),
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
            Icon={AddIcon}
            label="Agregar tipo novedad"
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <Table
          data={tipoNovedad?.data?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={5}
          enableSorting={true}
        />
      </div>

      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar tipo de novedad"
        size="md"
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmit(onSubmit)}
            isLoading={isLoading}
            onCancel={() => {
              setIsModalOpen(false);
              reset();
            }}
            updating={false}
          >
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              required
              type="text"
              {...register("descripcion")}
            />
          </FormsModal>
        }
      />
      <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar tipo de novedad"
        size="md"
        onClose={() => {
          setIsModalOpenEditar(false);
          resetEditar();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmitEditar(onSubmitEditar)}
            isLoading={isLoading}
            onCancel={() => {
              setIsModalOpenEditar(false);
              resetEditar();
            }}
            updating={true}
          >
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              {...registerEditar("estado")}
            />
          </FormsModal>
        }
      />
    </Section>
  );
}
