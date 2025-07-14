import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { StateLabel } from "../../../components/common/StateLabel";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { TipoPersonal } from "../../../types";
import {
  useActualizarTipoPersonal,
  useCrearTipoPersonal,
  useTipoPersonal,
} from "../../../api/queryFunctions/configuracion";
import type {
  ActualizarTipoPersonal,
  CreateTipoPersonal,
} from "../../../api/types";
import { useForm } from "../../../hooks/useForm";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useState } from "react";
import { InputForm } from "../../../components/common/InputForm";
import Button from "../../../components/common/Button";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";

export const Route = createFileRoute("/dashboard/configuracion/tipo-personal")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: tipoPersonal, isLoading } = useTipoPersonal();
  const { mutate: crearTipoPersonal, isPending: isCreatingTipoPersonal } =
    useCrearTipoPersonal();
  const {
    mutate: actualizarTipoPersonal,
    isPending: isActualizandoTipoPersonal,
  } = useActualizarTipoPersonal();
  const { form, handleChange, resetForm } = useForm<CreateTipoPersonal>({
    descripcion: "",
  });
  const {
    form: formEditar,
    handleChange: handleChangeEditar,
    resetForm: resetFormEditar,
    setForm: setFormEditar,
  } = useForm<ActualizarTipoPersonal>({
    estado: false,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState<boolean>(false);
  const [editingRow, setEditingRow] = useState<TipoPersonal | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearTipoPersonal(form);
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarTipoPersonal({
      id: editingRow?.idTipoPersonal as number,
      data: {
        estado: String(formEditar.estado) === "true",
      },
    });
    console.log(formEditar.estado);
    setIsModalOpenEditar(false);
    resetFormEditar();
  };

  const handleShowModalEditar = (row: TipoPersonal) => {
    setIsModalOpenEditar(true);
    setFormEditar({
      estado: row.estado,
    });
    setEditingRow(row);
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
      cell: ({ row }) => {
        return (
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => {
              handleShowModalEditar(row.original);
            }}
          />
        );
      },
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
          pageSize={10}
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
          resetForm();
        }}
        children={
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              required
              value={form.descripcion}
              onChange={handleChange}
              type="text"
            />
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="w-auto bg-gray-500 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingTipoPersonal}
                className="w-auto"
              >
                {isCreatingTipoPersonal ? "Creando..." : "Agregar"}
              </Button>
            </div>
          </form>
        }
      />
      <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar tipo de personal"
        size="md"
        onClose={() => {
          setIsModalOpenEditar(false);
          resetForm();
        }}
        children={
          <form onSubmit={handleSubmitEditar} className="flex flex-col gap-4">
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              value={formEditar.estado.toString()}
              onChange={handleChangeEditar}
            />
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setIsModalOpenEditar(false);
                  resetFormEditar();
                }}
                className="w-auto bg-gray-500 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isActualizandoTipoPersonal}
                className="w-auto"
              >
                {isActualizandoTipoPersonal ? "Actualizando..." : "Guardar"}
              </Button>
            </div>
          </form>
        }
      />
    </Section>
  );
}
