import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Button from "../../../components/common/Button";
import type { TipoOrdenServicio } from "../../../types";
import {
  useActualizarEstadoOrden,
  useCrearEstadoOrden,
  useEstadoOrden,
} from "../../../api/queryFunctions/configuracion";
import { useForm } from "../../../hooks/useForm";
import type {
  ActualizarEstadoOrden,
  CrearEstadoOrden,
} from "../../../api/types";
import { InputForm } from "../../../components/common/InputForm";
import { SimpleModal } from "../../../components/common/SimpleModal";

export const Route = createFileRoute(
  "/dashboard/configuracion/estado-orden-servicio",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { form, handleChange, resetForm } = useForm<CrearEstadoOrden>({
    descripcion: "",
  });
  const {
    form: formEditar,
    handleChange: handleChangeEditar,
    resetForm: resetFormEditar,
    setForm: setFormEditar,
  } = useForm<ActualizarEstadoOrden>({
    dias: 0,
  });
  const { data: estadosOrden } = useEstadoOrden();
  const { mutate: crearEstadoOrden, isPending: isCreatingEstadoOrden } =
    useCrearEstadoOrden();
  const { mutate: editarEstadoOrden, isPending: isEditingEstadoOrden } =
    useActualizarEstadoOrden();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TipoOrdenServicio | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearEstadoOrden({
      descripcion: form.descripcion as string,
    });
    resetForm();
    setIsModalOpen(false);
  };

  const handleShowModal = () => {
    setIsModalOpen(true);
  };

  const handleShowModalEditar = (row: TipoOrdenServicio) => {
    setFormEditar({
      dias: row.dias,
    });
    setEditingRow(row);
    setIsEditModalOpen(true);
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    editarEstadoOrden({
      id: editingRow?.idEstadoOrdenServicio as number,
      data: {
        dias: formEditar.dias,
      },
    });
    resetFormEditar();
    setIsEditModalOpen(false);
  };

  const columns: ColumnDef<TipoOrdenServicio>[] = [
    {
      accessorKey: "idEstadoOrdenServicio",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.getValue("idEstadoOrdenServicio")}
        </span>
      ),
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => <span>{row.getValue("descripcion")}</span>,
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => (
        <span className="rounded-md bg-green-500 px-2 py-1 text-white">
          {row.getValue("estado") ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      accessorKey: "programable",
      header: "Programable",
      cell: ({ row }) => (
        <span>{row.getValue("programable") ? "Si" : "No"}</span>
      ),
    },
    {
      accessorKey: "dias",
      header: "Días",
      cell: ({ row }) => <span>{row.getValue("dias")}</span>,
    },
    {
      accessorKey: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        if (row.getValue("programable")) {
          return (
            <ButtonAction
              Icon={PencilIcon}
              label="Editar"
              onClick={() => {
                handleShowModalEditar(row.original);
              }}
            />
          );
        }
        return <span>No disponible</span>;
      },
    },
  ];
  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar estado de orden de servicio"
            onClick={() => handleShowModal()}
          />
        </div>
        <Table
          data={estadosOrden?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>

      {/* Modal para agregar un tipo de orden de servicio */}
      <SimpleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Agregar estado de orden de servicio"
        size="md"
      >
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              type="text"
              id="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              required
              disabled={false}
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
                className="w-auto"
                disabled={isCreatingEstadoOrden}
              >
                {isCreatingEstadoOrden ? "Creando..." : "Agregar"}
              </Button>
            </div>
          </form>
        </div>
      </SimpleModal>

      {/* Modal para editar un tipo de orden de servicio */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title="Editar estado de orden de servicio"
        size="md"
      >
        <div className="space-y-4">
          <form onSubmit={handleSubmitEditar} className="flex flex-col gap-4">
            <InputForm
              label="Días"
              placeholder="Días"
              type="number"
              id="dias"
              value={formEditar.dias.toString()}
              onChange={handleChangeEditar}
              required
              disabled={false}
            />
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetFormEditar();
                }}
                className="w-auto bg-gray-500 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-auto"
                disabled={isEditingEstadoOrden}
              >
                {isEditingEstadoOrden ? "Editando..." : "Editar"}
              </Button>
            </div>
          </form>
        </div>
      </SimpleModal>
    </Section>
  );
}
