import { createFileRoute } from "@tanstack/react-router";
import type { TipoServicio } from "../../../api/types/servicio";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import {
  useCreateTipoServicio,
  useDeleteTipoServicio,
  useTipoServicios,
  useUpdateTipoServicio,
} from "../../../api/queryFunctions/servicios/tipo-servicio";
import { StateLabel } from "../../../components/common/StateLabel";
import { useState } from "react";
import type {
  CreateTipoServicioDto,
  UpdateTipoServicioDto,
} from "../../../api/dtos";
import { useForm } from "../../../hooks/useForm";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
import { CheckboxForm } from "../../../components/common/CheckboxForm";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute("/dashboard/servicios/tipo-servicio")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAddTipoServicio, setIsOpenAddTipoServicio] = useState(false);
  const [isOpenEditTipoServicio, setIsOpenEditTipoServicio] = useState(false);
  const [isOpenDeleteTipoServicio, setIsOpenDeleteTipoServicio] =
    useState(false);
  const [idTipoServicio, setIdTipoServicio] = useState(0);

  // Queries y Mutaciones
  const { data: tipoServicios } = useTipoServicios();
  const { mutate: crearTipoServicio, isPending: isLoadingCrearTipoServicio } =
    useCreateTipoServicio();
  const { mutate: editarTipoServicio, isPending: isLoadingEditarTipoServicio } =
    useUpdateTipoServicio();
  const { mutate: eliminarTipoServicio } = useDeleteTipoServicio();

  // Formularios

  const {
    form: formAddTipoServicio,
    handleChange: handleChangeAddTipoServicio,
    resetForm: resetFormAddTipoServicio,
  } = useForm<CreateTipoServicioDto>({
    nombre: "",
    descripcion: "",
    prefijo: "",
    requierePersonal: false,
  });

  const {
    form: formEditTipoServicio,
    handleChange: handleChangeEditTipoServicio,
    resetForm: resetFormEditTipoServicio,
    handleBooleanChange: handleBooleanChangeEditTipoServicio,
  } = useForm<UpdateTipoServicioDto>({
    nombre: "",
    descripcion: "",
    prefijo: "",
    requierePersonal: false,
    estado: false,
  });

  const columns: ColumnDef<TipoServicio>[] = [
    {
      header: "ID",
      accessorKey: "idTipoServicio",
    },
    {
      header: "Nombre",
      accessorKey: "nombre",
    },
    {
      header: "Descripción",
      accessorKey: "descripcion",
    },
    {
      header: "Prefijo",
      accessorKey: "prefijo",
      cell: ({ row }) => {
        return <span className="capitalize">{row.original.prefijo}</span>;
      },
    },
    {
      header: "Requiere personal",
      cell: ({ row }) => {
        return <StateLabel state={row.original.requierePersonal} />;
      },
    },
    {
      header: "Estado",
      cell: ({ row }) => {
        return <StateLabel state={row.original.estado} />;
      },
    },
    {
      header: "Acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idTipoServicio}`}
          actions={[
            {
              label: "Editar",
              onClick: () => {
                setIsOpenEditTipoServicio(true);
                setIdTipoServicio(row.original.idTipoServicio);
                formEditTipoServicio.nombre = row.original.nombre;
                formEditTipoServicio.descripcion = row.original.descripcion;
                formEditTipoServicio.prefijo = row.original.prefijo;
                formEditTipoServicio.requierePersonal =
                  row.original.requierePersonal;
                formEditTipoServicio.estado = row.original.estado;
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIdTipoServicio(row.original.idTipoServicio);
                setIsOpenDeleteTipoServicio(true);
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
      <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Agregar Tipo de Servicio"
          onClick={() => {
            setIsOpenAddTipoServicio(true);
          }}
        />
      </div>
      <Table
        columns={columns}
        data={tipoServicios?.data || []}
        enablePagination={true}
        enableSorting={true}
        enableFiltering={true}
      />
      <SimpleModal
        isOpen={isOpenAddTipoServicio}
        onClose={() => {
          setIsOpenAddTipoServicio(false);
          resetFormAddTipoServicio();
        }}
        title="Agregar Tipo de Servicio"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            crearTipoServicio(formAddTipoServicio, {
              onSuccess: () => {
                setIsOpenAddTipoServicio(false);
                resetFormAddTipoServicio();
              },
            });
          }}
          isLoading={isLoadingCrearTipoServicio}
          onCancel={() => {
            setIsOpenAddTipoServicio(false);
            resetFormAddTipoServicio();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-2">
            <InputForm
              label="Nombre"
              id="nombre"
              type="text"
              required
              placeholder="Nombre"
              value={formAddTipoServicio.nombre}
              onChange={handleChangeAddTipoServicio}
            />
            <InputForm
              label="Descripción"
              id="descripcion"
              type="text"
              required
              placeholder="Descripción"
              value={formAddTipoServicio.descripcion}
              onChange={handleChangeAddTipoServicio}
            />
            <InputForm
              label="Prefijo"
              id="prefijo"
              type="text"
              required
              placeholder="Prefijo"
              value={formAddTipoServicio.prefijo}
              onChange={handleChangeAddTipoServicio}
            />
            <CheckboxForm
              label="Requiere personal"
              id="requierePersonal"
              required={false}
              checked={formAddTipoServicio.requierePersonal}
              onChange={handleChangeAddTipoServicio}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditTipoServicio}
        onClose={() => setIsOpenEditTipoServicio(false)}
        title="Editar Tipo de Servicio"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            editarTipoServicio(
              {
                id: idTipoServicio,
                data: formEditTipoServicio,
              },
              {
                onSuccess: () => {
                  setIsOpenEditTipoServicio(false);
                  resetFormEditTipoServicio();
                },
              },
            );
          }}
          isLoading={isLoadingEditarTipoServicio}
          onCancel={() => {
            setIsOpenEditTipoServicio(false);
            resetFormEditTipoServicio();
          }}
          updating={true}
        >
          <div className="flex flex-col gap-2">
            <InputForm
              label="Nombre"
              id="nombre"
              type="text"
              required={false}
              placeholder="Nombre"
              value={formEditTipoServicio.nombre || ""}
              onChange={handleChangeEditTipoServicio}
            />
            <InputForm
              label="Descripción"
              id="descripcion"
              type="text"
              required={false}
              placeholder="Descripción"
              value={formEditTipoServicio.descripcion || ""}
              onChange={handleChangeEditTipoServicio}
            />
            <InputForm
              label="Prefijo"
              id="prefijo"
              type="text"
              required={false}
              placeholder="Prefijo"
              value={formEditTipoServicio.prefijo || ""}
              onChange={handleChangeEditTipoServicio}
            />
            <InputSelectStateBoolean
              label="Estado"
              id="estado"
              placeholder="Estado"
              value={formEditTipoServicio.estado?.toString() || ""}
              onChange={handleBooleanChangeEditTipoServicio}
            />
            <CheckboxForm
              label="Requiere personal"
              id="requierePersonal"
              required={false}
              checked={formEditTipoServicio.requierePersonal ?? false}
              onChange={handleChangeEditTipoServicio}
            />
          </div>
        </FormsModal>
      </SimpleModal>
      <ConfirmarDelete
        isOpenDelete={isOpenDeleteTipoServicio}
        text="¿Estás seguro de querer eliminar este tipo de servicio?"
        onDelete={() => {
          eliminarTipoServicio(idTipoServicio, {
            onSuccess: () => {
              setIsOpenDeleteTipoServicio(false);
              setIdTipoServicio(0);
            },
          });
        }}
        onClose={() => {
          setIsOpenDeleteTipoServicio(false);
          setIdTipoServicio(0);
        }}
      />
    </Section>
  );
}
