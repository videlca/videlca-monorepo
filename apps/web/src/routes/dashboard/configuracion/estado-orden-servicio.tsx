import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Button from "../../../components/common/Button";
import type { EstadoOrden } from "../../../types";
import {
  useActualizarEstadoOrden,
  useCrearEstadoOrden,
  useEstadoOrden,
} from "../../../api/queryFunctions/configuracion";
import { useForm } from "../../../hooks/useForm";
import { InputForm } from "../../../components/common/InputForm";
import { SimpleModal } from "../../../components/common/SimpleModal";
import type {
  CreateEstadoOrdenDto,
  UpdateEstadoOrdenDto,
} from "../../../api/dtos";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";

export const Route = createFileRoute(
  "/dashboard/configuracion/estado-orden-servicio",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { form, handleChange, resetForm } = useForm<CreateEstadoOrdenDto>({
    nombre: "",
    descripcion: "",
  });
  const {
    form: formEditar,
    handleChange: handleChangeEditar,
    resetForm: resetFormEditar,
    setForm: setFormEditar,
  } = useForm<UpdateEstadoOrdenDto>({
    estado: false,
  });
  const { data: estadosOrden } = useEstadoOrden();
  const { mutate: crearEstadoOrden, isPending: isCreatingEstadoOrden } =
    useCrearEstadoOrden();
  const { mutate: editarEstadoOrden, isPending: isEditingEstadoOrden } =
    useActualizarEstadoOrden();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<EstadoOrden | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearEstadoOrden({
      nombre: form.nombre as string,
      descripcion: form.descripcion as string,
    });
    resetForm();
    setIsModalOpen(false);
  };

  const handleShowModal = () => {
    setIsModalOpen(true);
  };

  const handleShowModalEditar = (row: EstadoOrden) => {
    setFormEditar({
      estado: row.estado,
    });
    setEditingRow(row);
    setIsEditModalOpen(true);
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    editarEstadoOrden({
      id: editingRow?.idEstadoOrdenServicio as number,
      data: {
        estado: formEditar.estado as boolean,
      },
    });
    resetFormEditar();
    setIsEditModalOpen(false);
  };

  const columns: ColumnDef<EstadoOrden>[] = [
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
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("nombre")}</span>
      ),
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("descripcion")}</span>
      ),
    },
    // {
    //   accessorKey: "estado",
    //   header: "Estado",
    //   cell: ({ row }) => (
    //     <span className="rounded-md bg-green-500 px-2 py-1 text-white">
    //       {row.getValue("estado") ? "Activo" : "Inactivo"}
    //     </span>
    //   ),
    // },
    // {
    //   accessorKey: "programable",
    //   header: "Programable",
    //   cell: ({ row }) => (
    //     <span>{row.getValue("programable") ? "Si" : "No"}</span>
    //   ),
    // },
    // {
    //   accessorKey: "actions",
    //   header: "Acciones",
    //   cell: ({ row }) => {
    //     if (row.getValue("programable")) {
    //       return (
    //         <ButtonAction
    //           Icon={PencilIcon}
    //           label="Editar"
    //           onClick={() => {
    //             handleShowModalEditar(row.original);
    //           }}
    //         />
    //       );
    //     }
    //     return <span>No disponible</span>;
    //   },
    // },
  ];

  // TODO: revisar cambios de la tabla y actualizar por cambios nuevos
  return (
    <Section>
      <div className="flex flex-col gap-8">
        {/* <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar estado de orden de servicio"
            onClick={() => handleShowModal()}
          />
        </div> */}
        <Table
          data={estadosOrden?.data || []}
          columns={columns}
          enablePagination={false}
          pageSize={20}
          enableSorting={false}
        />
      </div>

      {/* Modal para agregar un tipo de orden de servicio */}
      {/* <SimpleModal
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
              label="Nombre"
              placeholder="Nombre"
              type="text"
              id="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              type="text"
              id="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              required
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
      </SimpleModal> */}

      {/* Modal para editar un estado de orden de servicio */}
      {/* <SimpleModal
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
      </SimpleModal> */}
    </Section>
  );
}
