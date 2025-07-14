import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { TipoIdentificacion } from "../../../types";
import type {
  ActualizarTipoIdentificacion,
  CreateTipoIdentificacion,
} from "../../../api/types";
import { useState } from "react";
import {
  useActualizarTipoIdentificacion,
  useCrearTipoIdentificacion,
  useTipoIdentificacion,
} from "../../../api/queryFunctions/configuracion/tipo-identificacion";
import { useForm } from "../../../hooks/useForm";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
import Button from "../../../components/common/Button";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";

export const Route = createFileRoute("/dashboard/configuracion/tipo-id")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

function RouteComponent() {
  const { data: tipoIdentificacion, isLoading } = useTipoIdentificacion();
  const { mutate: crearTipoIdentificacion } = useCrearTipoIdentificacion();
  const { mutate: actualizarTipoIdentificacion } =
    useActualizarTipoIdentificacion();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);
  const [editingRow, setEditingRow] = useState<TipoIdentificacion | null>(null);
  const { form, setForm, resetForm } = useForm<CreateTipoIdentificacion>({
    descripcion: "",
  });
  const {
    form: formEditar,
    handleChange: handleChangeEditar,
    setForm: setFormEditar,
    resetForm: resetFormEditar,
  } = useForm<ActualizarTipoIdentificacion>({
    estado: false,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearTipoIdentificacion(form);
    setIsModalOpen(false);
    resetForm();
  };

  const handleShowModalEditar = (row: TipoIdentificacion) => {
    setIsModalOpenEditar(true);
    setFormEditar({
      estado: row.estado,
    });
    setEditingRow(row);
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarTipoIdentificacion({
      id: editingRow?.idTipoIdentificacion as number,
      data: {
        estado: String(formEditar.estado) === "true",
      },
    });
    setIsModalOpenEditar(false);
    resetFormEditar();
  };

  const columns: ColumnDef<TipoIdentificacion>[] = [
    {
      header: "ID",
      accessorKey: "idTipoIdentificacion",
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
            label="Agregar tipo de identificación"
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <Table
          data={tipoIdentificacion?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>

      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar tipo de identificación"
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
              onChange={(e) => setForm({ descripcion: e.target.value })}
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
              <Button type="submit" disabled={isLoading} className="w-auto">
                {isLoading ? "Creando..." : "Agregar"}
              </Button>
            </div>
          </form>
        }
      />
      <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar tipo de identificación"
        size="md"
        onClose={() => {
          setIsModalOpenEditar(false);
          resetFormEditar();
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
              <Button type="submit" disabled={isLoading} className="w-auto">
                {isLoading ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </form>
        }
      />
    </Section>
  );
}
