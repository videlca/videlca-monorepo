import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { StateLabel } from "../../../components/common/StateLabel";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
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
import { useForm } from "../../../hooks/useForm";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { FormsModal } from "../../../components/ui/modals/FormsModal";

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
  const {
    form: formCrear,
    resetForm: resetFormCrear,
    handleChange: handleChangeCrear,
  } = useForm<CreateTipoCliente>({
    descripcion: "",
  });
  const {
    form: formEditar,
    handleChange: handleChangeEditar,
    setForm: setFormEditar,
    resetForm: resetFormEditar,
  } = useForm<ActualizarTipoCliente>({
    descripcion: "",
    estado: false,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearTipoCliente(formCrear);
    setIsModalOpen(false);
    resetFormCrear();
  };

  const handleShowModalEditar = (row: TipoCliente) => {
    setIsModalOpenEditar(true);
    setFormEditar({
      estado: row.estado,
      descripcion: row.descripcion,
    });
    setSelectIdRow(row.idTipoCliente);
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarTipoCliente({
      id: selectIdRow as number,
      data: {
        estado: String(formEditar.estado) === "true",
        descripcion: formEditar.descripcion,
      },
    });
    setIsModalOpenEditar(false);
    resetFormEditar();
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
      cell: ({ row }) => {
        return (
          <div className="flex justify-center gap-2">
            <ButtonAction
              Icon={PencilIcon}
              label="Editar"
              onClick={() => {
                handleShowModalEditar(row.original);
              }}
            />
            <ButtonAction
              Icon={TrashIcon}
              label="Eliminar"
              onClick={() => {
                setIsModalOpenEliminar(true);
                setSelectIdRow(row.original.idTipoCliente);
              }}
              color="red"
            />
          </div>
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
            label="Agregar tipo de cliente"
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <Table
          data={tipoCliente?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar tipo de cliente"
        size="md"
        onClose={() => {
          setIsModalOpen(false);
          resetFormCrear();
        }}
      >
        <FormsModal
          onSubmit={handleSubmit}
          isLoading={isCreatingTipoCliente}
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
      </SimpleModal>
      <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar tipo de cliente"
        size="md"
        onClose={() => {
          setIsModalOpenEditar(false);
          resetFormEditar();
        }}
      >
        <FormsModal
          onSubmit={handleSubmitEditar}
          isLoading={isActualizandoTipoCliente}
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
