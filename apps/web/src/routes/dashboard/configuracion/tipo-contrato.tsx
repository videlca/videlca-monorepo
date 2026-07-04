import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import type { TipoContrato } from "../../../api/types/configuracion";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { StateLabel } from "../../../components/common/StateLabel";
import { useForm } from "react-hook-form";
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
  const { register: registerCrear, handleSubmit: handleSubmitCrear, reset: resetCrear } =
    useForm<CreateTipoContrato>({
      defaultValues: { descripcion: "", indefinido: false },
    });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<ActualizarTipoContrato>({
    defaultValues: { descripcion: "", indefinido: false, estado: false },
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
                resetEditar({
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
          data={tipoContrato?.data?.data || []}
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
          resetCrear();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmitCrear((data) => {
              crearTipoContrato(data, {
                onSuccess: () => {
                  setIsModalOpen(false);
                  resetCrear();
                },
              });
            })}
            isLoading={false}
            onCancel={() => {
              setIsModalOpen(false);
              resetCrear();
            }}
            updating={false}
          >
            <div className="flex flex-col gap-2">
              <InputForm
                label="Descripción"
                placeholder="Descripción"
                id="descripcion"
                required
                type="text"
                {...registerCrear("descripcion")}
              />
              <CheckboxForm
                label="Tipo de contrato indefinido (sin fecha de fin)?"
                id="indefinido"
                {...registerCrear("indefinido")}
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
          resetEditar();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmitEditar((data) => {
              actualizarTipoContrato(
                {
                  id: idContrato as number,
                  data: {
                    descripcion: data.descripcion,
                    indefinido: data.indefinido || false,
                    estado: String(data.estado) === "true",
                  },
                },
                {
                  onSuccess: () => {
                    setIsModalOpenEditar(false);
                    setIdContrato(null);
                    resetEditar();
                  },
                },
              );
            })}
            isLoading={false}
            onCancel={() => {
              setIsModalOpenEditar(false);
              resetEditar();
            }}
            updating={true}
          >
            <div className="flex flex-col gap-2">
              <InputForm
                label="Descripción"
                placeholder="Descripción"
                id="descripcion"
                required
                type="text"
                {...registerEditar("descripcion")}
              />
              <InputSelectStateBoolean
                label="Estado"
                placeholder="Estado"
                id="estado"
                {...registerEditar("estado")}
              />
              <CheckboxForm
                label="Tipo de contrato indefinido (sin fecha de fin)?"
                id="indefinido"
                {...registerEditar("indefinido")}
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
