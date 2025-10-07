import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
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
  useEliminarTipoIdentificacion,
  useTipoIdentificacion,
} from "../../../api/queryFunctions/configuracion/tipo-identificacion";
import { useForm } from "../../../hooks/useForm";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
import Button from "../../../components/common/Button";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute("/dashboard/configuracion/tipo-id")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

function RouteComponent() {
  // Estados
  const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
  const [selectIdRow, setSelectIdRow] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);

  // Queries y mutaciones
  const { data: tipoIdentificacion, isLoading } = useTipoIdentificacion();
  const {
    mutate: crearTipoIdentificacion,
    isPending: isCreatingTipoIdentificacion,
  } = useCrearTipoIdentificacion();
  const {
    mutate: actualizarTipoIdentificacion,
    isPending: isActualizandoTipoIdentificacion,
  } = useActualizarTipoIdentificacion();
  const { mutate: eliminarTipoIdentificacion } =
    useEliminarTipoIdentificacion();

  // Formularios
  const {
    form: formCrear,
    setForm: setFormCrear,
    resetForm: resetFormCrear,
    handleChange: handleChangeCrear,
  } = useForm<CreateTipoIdentificacion>({
    descripcion: "",
  });
  const {
    form: formEditar,
    handleChange: handleChangeEditar,
    setForm: setFormEditar,
    resetForm: resetFormEditar,
  } = useForm<ActualizarTipoIdentificacion>({
    descripcion: "",
    estado: false,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearTipoIdentificacion(formCrear);
    setIsModalOpen(false);
    resetFormCrear();
  };

  const handleShowModalEditar = (row: TipoIdentificacion) => {
    setIsModalOpenEditar(true);
    setFormEditar({
      estado: row.estado,
      descripcion: row.descripcion,
    });
    setSelectIdRow(row.idTipoIdentificacion);
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarTipoIdentificacion({
      id: selectIdRow as number,
      data: {
        descripcion: formEditar.descripcion,
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
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idTipoIdentificacion}`}
          actions={[
            {
              label: "Editar",
              onClick: () => handleShowModalEditar(row.original),
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIsModalOpenEliminar(true);
                setSelectIdRow(row.original.idTipoIdentificacion);
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
          pageSize={5}
          enableSorting={true}
        />
      </div>

      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar tipo de identificación"
        size="md"
        onClose={() => {
          setIsModalOpen(false);
          resetFormCrear();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmit}
            isLoading={isCreatingTipoIdentificacion}
            onCancel={() => {
              setIsModalOpen(false);
              resetFormCrear();
            }}
            updating={false}
          >
            <div className="flex flex-col gap-2">
              <InputForm
                label="Descripción"
                placeholder="Descripción"
                id="descripcion"
                required
                value={formCrear.descripcion || ""}
                onChange={handleChangeCrear}
                type="text"
              />
            </div>
          </FormsModal>
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
      >
        <FormsModal
          onSubmit={handleSubmitEditar}
          isLoading={isActualizandoTipoIdentificacion}
          onCancel={() => {
            setIsModalOpenEditar(false);
            resetFormEditar();
          }}
          updating={true}
        >
          <div className="flex flex-col gap-2">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              required
              value={formEditar.descripcion || ""}
              onChange={handleChangeEditar}
              type="text"
            />
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              value={formEditar.estado?.toString() || ""}
              onChange={handleChangeEditar}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isModalOpenEliminar}
        text="¿Estás seguro de querer eliminar este tipo de identificación?"
        onClose={() => {
          setIsModalOpenEliminar(false);
        }}
        onDelete={() => {
          eliminarTipoIdentificacion(
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
