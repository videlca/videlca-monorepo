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
import Button from "../../../components/common/Button";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";

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
      cell: ({ row }) => {
        return (
          <div className="flex gap-2">
            <ButtonAction
              Icon={PencilIcon}
              label="Editar"
              onClick={() => {
                setIsOpenEditTipoServicio(true);
                setIdTipoServicio(row.original.idTipoServicio);
                formEditTipoServicio.nombre = row.original.nombre;
                formEditTipoServicio.descripcion = row.original.descripcion;
                formEditTipoServicio.requierePersonal =
                  row.original.requierePersonal;
              }}
            />
            <ButtonAction
              Icon={TrashIcon}
              label="Eliminar"
              onClick={() => {
                setIdTipoServicio(row.original.idTipoServicio);
                setIsOpenDeleteTipoServicio(true);
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            crearTipoServicio(formAddTipoServicio, {
              onSuccess: () => {
                setIsOpenAddTipoServicio(false);
                resetFormAddTipoServicio();
              },
            });
          }}
          className="flex flex-col gap-4"
        >
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
          <CheckboxForm
            label="Requiere personal"
            id="requierePersonal"
            required={false}
            checked={formAddTipoServicio.requierePersonal}
            onChange={handleChangeAddTipoServicio}
          />
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsOpenAddTipoServicio(false);
                resetFormAddTipoServicio();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-auto">
              {isLoadingCrearTipoServicio ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditTipoServicio}
        onClose={() => setIsOpenEditTipoServicio(false)}
        title="Editar Tipo de Servicio"
      >
        <form
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
          className="flex flex-col gap-4"
        >
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
          <InputSelectStateBoolean
            label="Estado"
            id="estado"
            placeholder="Estado"
            value={formEditTipoServicio.estado?.toString() || "true"}
            onChange={handleBooleanChangeEditTipoServicio}
          />
          <CheckboxForm
            label="Requiere personal"
            id="requierePersonal"
            required={false}
            checked={formEditTipoServicio.requierePersonal ?? false}
            onChange={handleChangeEditTipoServicio}
          />
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsOpenEditTipoServicio(false);
                resetFormEditTipoServicio();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-auto">
              {isLoadingEditarTipoServicio ? "Editando..." : "Editar"}
            </Button>
          </div>
        </form>
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
        onClose={() => setIsOpenDeleteTipoServicio(false)}
      />
    </Section>
  );
}
