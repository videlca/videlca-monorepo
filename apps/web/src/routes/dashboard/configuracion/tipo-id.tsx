import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import AddIcon from "@mui/icons-material/Add";
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
import { useForm } from "react-hook-form";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
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
  const { data: tipoIdentificacion } = useTipoIdentificacion();
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
    register: registerCrear,
    handleSubmit: handleSubmitCrear,
    reset: resetCrear,
  } = useForm<CreateTipoIdentificacion>({
    defaultValues: { descripcion: "" },
  });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditarForm,
    reset: resetEditar,
  } = useForm<ActualizarTipoIdentificacion>({
    defaultValues: { descripcion: "", estado: false },
  });

  const onSubmitCrear = (data: CreateTipoIdentificacion) => {
    crearTipoIdentificacion(data);
    setIsModalOpen(false);
    resetCrear();
  };

  const handleShowModalEditar = (row: TipoIdentificacion) => {
    setIsModalOpenEditar(true);
    resetEditar({
      estado: row.estado,
      descripcion: row.descripcion,
    });
    setSelectIdRow(row.idTipoIdentificacion);
  };

  const onSubmitEditar = (data: ActualizarTipoIdentificacion) => {
    actualizarTipoIdentificacion({
      id: selectIdRow as number,
      data: {
        descripcion: data.descripcion,
        estado: String(data.estado) === "true",
      },
    });
    setIsModalOpenEditar(false);
    resetEditar();
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
            Icon={AddIcon}
            label="Agregar tipo de identificación"
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <Table
          data={tipoIdentificacion?.data?.data || []}
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
          resetCrear();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmitCrear(onSubmitCrear)}
            isLoading={isCreatingTipoIdentificacion}
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
          resetEditar();
        }}
      >
        <FormsModal
          onSubmit={handleSubmitEditarForm(onSubmitEditar)}
          isLoading={isActualizandoTipoIdentificacion}
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
