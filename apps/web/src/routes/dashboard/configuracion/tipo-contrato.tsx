import { createFileRoute } from "@tanstack/react-router";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import type { TipoContrato } from "../../../api/types/configuracion";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { StateLabel } from "../../../components/common/StateLabel";
import { useForm } from "../../../hooks/useForm";
import type {
  ActualizarTipoContrato,
  CreateTipoContrato,
} from "../../../api/dtos/configuracion";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { InputForm } from "../../../components/common/InputForm";
import { CheckboxForm } from "../../../components/common/CheckboxForm";
import {
  useActualizarTipoContrato,
  useCrearTipoContrato,
  useEliminarTipoContrato,
  useTipoContrato,
} from "../../../api/queryFunctions/configuracion";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute("/dashboard/configuracion/tipo-contrato")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);
  const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
  const [idContrato, setIdContrato] = useState<number | null>(null);

  // Queries y mutaciones
  const { data: tipoContrato } = useTipoContrato();
  const { mutate: crearTipoContrato } = useCrearTipoContrato();
  const { mutate: actualizarTipoContrato } = useActualizarTipoContrato();
  const { mutate: eliminarTipoContrato } = useEliminarTipoContrato();

  // Formularios
  const {
    form: formCrear,
    handleChange: handleChangeCrear,
    resetForm: resetFormCrear,
  } = useForm<CreateTipoContrato>({
    descripcion: "",
    indefinido: false,
  });

  const {
    form: formEditar,
    handleChange: handleChangeEditar,
    resetForm: resetFormEditar,
    setForm: setFormEditar,
  } = useForm<ActualizarTipoContrato>({
    descripcion: "",
    indefinido: false,
    estado: false,
  });

  const columns: ColumnDef<TipoContrato>[] = [
    {
      header: "Descripción",
      accessorKey: "descripcion",
    },
    {
      header: "Indefinido",
      accessorKey: "indefinido",
      cell: ({ row }) => {
        return <StateLabel state={row.original.indefinido} />;
      },
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
          menuId={`actions-${row.original.idTipoContrato}`}
          actions={[
            {
              label: "Editar",
              onClick: () => {
                setIsModalOpenEditar(true);
                setIdContrato(row.original.idTipoContrato);
                setFormEditar({
                  descripcion: row.original.descripcion,
                  indefinido: row.original.indefinido || false,
                  estado: row.original.estado,
                });
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIsModalOpenEliminar(true);
                setIdContrato(row.original.idTipoContrato);
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
            label="Agregar tipo de contrato"
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <Table
          data={tipoContrato?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={5}
          enableSorting={true}
        />
      </div>

      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar tipo de contrato"
        size="md"
        onClose={() => {
          setIsModalOpen(false);
          resetFormCrear();
        }}
        children={
          <FormsModal
            onSubmit={(e) => {
              e.preventDefault();
              crearTipoContrato(formCrear, {
                onSuccess: () => {
                  setIsModalOpen(false);
                  resetFormCrear();
                },
              });
            }}
            isLoading={false}
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
              <CheckboxForm
                label="Tipo de contrato indefinido (sin fecha de fin)?"
                id="indefinido"
                checked={formCrear.indefinido}
                onChange={handleChangeCrear}
              />
            </div>
          </FormsModal>
        }
      />

      <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar tipo de contrato"
        size="md"
        onClose={() => {
          setIsModalOpenEditar(false);
          resetFormEditar();
        }}
        children={
          <FormsModal
            onSubmit={(e) => {
              e.preventDefault();
              actualizarTipoContrato(
                {
                  id: idContrato as number,
                  data: {
                    descripcion: formEditar.descripcion,
                    indefinido: formEditar.indefinido || false,
                    estado: String(formEditar.estado) === "true",
                  },
                },
                {
                  onSuccess: () => {
                    setIsModalOpenEditar(false);
                    setIdContrato(null);
                    resetFormEditar();
                  },
                },
              );
            }}
            isLoading={false}
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
              <CheckboxForm
                label="Tipo de contrato indefinido (sin fecha de fin)?"
                id="indefinido"
                checked={formEditar.indefinido || false}
                onChange={handleChangeEditar}
              />
            </div>
          </FormsModal>
        }
      />

      <ConfirmarDelete
        isOpenDelete={isModalOpenEliminar}
        text="¿Estás seguro de querer eliminar este tipo de contrato?"
        onClose={() => {
          setIsModalOpenEliminar(false);
          setIdContrato(null);
        }}
        onDelete={() => {
          eliminarTipoContrato(
            { id: idContrato as number },
            {
              onSettled: () => {
                setIsModalOpenEliminar(false);
                setIdContrato(null);
              },
            },
          );
        }}
      />
    </Section>
  );
}
