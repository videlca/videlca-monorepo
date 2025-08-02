import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { StateLabel } from "../../../components/common/StateLabel";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { TipoPersonal } from "../../../types";
import {
  useActualizarTipoPersonal,
  useCrearTipoPersonal,
  useEliminarTipoPersonal,
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
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import type { UpdateTipoPersonalDto } from "../../../api/dtos";

export const Route = createFileRoute("/dashboard/configuracion/tipo-personal")({
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
  const { form, handleChange, resetForm } = useForm<CreateTipoPersonal>({
    descripcion: "",
  });
  const {
    form: formEditar,
    handleChange: handleChangeEditar,
    resetForm: resetFormEditar,
    setForm: setFormEditar,
  } = useForm<UpdateTipoPersonalDto>({
    descripcion: "",
    estado: false,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearTipoPersonal(form, {
      onSettled: () => {
        setIsModalOpen(false);
        resetForm();
      },
    });
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarTipoPersonal(
      {
        id: selectedRow as number,
        data: {
          descripcion: formEditar.descripcion,
          estado: String(formEditar.estado) === "true",
        },
      },
      {
        onSettled: () => {
          setIsModalOpenEditar(false);
          resetFormEditar();
          setSelectedRow(null);
        },
      },
    );
  };

  const handleShowModalEditar = (row: TipoPersonal) => {
    setIsModalOpenEditar(true);
    setFormEditar({
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
                setSelectedRow(row.original.idTipoPersonal);
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
      >
        <FormsModal
          onSubmit={handleSubmit}
          isLoading={isCreatingTipoPersonal}
          onCancel={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-2">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              required
              value={form.descripcion}
              onChange={handleChange}
              type="text"
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
          resetForm();
        }}
      >
        <FormsModal
          onSubmit={handleSubmitEditar}
          isLoading={isActualizandoTipoPersonal}
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
              value={formEditar.estado?.toString() || "false"}
              onChange={handleChangeEditar}
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
