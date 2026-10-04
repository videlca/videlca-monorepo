import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import AddIcon from "@mui/icons-material/Add";
import Table from "../../../components/common/Table";
import type { TipoGenero } from "../../../types";
import {
  useActualizarTipoGenero,
  useCrearTipoGenero,
  useTipoGenero,
} from "../../../api/queryFunctions/configuracion";
import { useState } from "react";
import type {
  ActualizarTipoGenero,
  CreateTipoGenero,
} from "../../../api/types";
import { useForm } from "react-hook-form";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
import Button from "../../../components/common/Button";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute("/dashboard/configuracion/tipo-genero")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

function RouteComponent() {
  const { data: tipoGenero, isLoading } = useTipoGenero();
  const { mutate: crearTipoGenero } = useCrearTipoGenero();
  const { mutate: actualizarTipoGenero } = useActualizarTipoGenero();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);
  const [editingRow, setEditingRow] = useState<TipoGenero | null>(null);

  const { register, handleSubmit, reset } = useForm<CreateTipoGenero>({
    defaultValues: { descripcion: "" },
  });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<ActualizarTipoGenero>({
    defaultValues: { estado: false },
  });

  const onSubmit = (data: CreateTipoGenero) => {
    crearTipoGenero(data);
    setIsModalOpen(false);
    reset();
  };

  const handleShowModalEditar = (row: TipoGenero) => {
    setIsModalOpenEditar(true);
    resetEditar({ estado: row.estado });
    setEditingRow(row);
  };

  const onSubmitEditar = (data: ActualizarTipoGenero) => {
    actualizarTipoGenero({
      id: editingRow?.idTipoGenero as number,
      data: {
        estado: String(data.estado) === "true",
      },
    });
    setIsModalOpenEditar(false);
    resetEditar();
  };

  const columns: ColumnDef<TipoGenero>[] = [
    {
      header: "ID",
      accessorKey: "idTipoGenero",
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
          menuId={`actions-${row.original.idTipoGenero}`}
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
            label="Agregar tipo de género"
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <Table
          data={tipoGenero?.data?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={5}
          enableSorting={true}
        />
      </div>

      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar tipo de género"
        size="md"
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        children={
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              required
              type="text"
              {...register("descripcion")}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                }}
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isLoading}>
                {isLoading ? "Creando..." : "Agregar"}
              </Button>
            </div>
          </form>
        }
      />
      <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar tipo de género"
        size="md"
        onClose={() => {
          setIsModalOpenEditar(false);
          resetEditar();
        }}
        children={
          <form onSubmit={handleSubmitEditar(onSubmitEditar)} className="flex flex-col gap-4">
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              {...registerEditar("estado")}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsModalOpenEditar(false);
                  resetEditar();
                }}
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isLoading}>
                {isLoading ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </form>
        }
      />
    </Section>
  );
}
