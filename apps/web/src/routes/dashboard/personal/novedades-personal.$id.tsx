import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { ArrowLeftIcon, PencilIcon, TrashIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import type { Novedad } from "../../../api/types";
import {
  useDeleteNovedad,
  useUpdateNovedad,
} from "../../../api/queryFunctions/personal/novedades";
import { useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { useForm } from "../../../hooks/useForm";
import type { UpdateNovedadDto } from "../../../api/dtos/personal";
import { useTipoNovedad } from "../../../api/queryFunctions/configuracion";
import { useGetPersonalNovedad } from "../../../api/queryFunctions/personal";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputForm } from "../../../components/common/InputForm";

export const Route = createFileRoute(
  "/dashboard/personal/novedades-personal/$id",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({
    from: "/dashboard/personal/novedades-personal/$id",
  });
  const navigate = useNavigate({
    from: "/dashboard/personal/novedades-personal/$id",
  });
  // Estados
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [novedad, setNovedad] = useState<Novedad | null>(null);

  // Queries y mutaciones
  const { data: novedades } = useGetPersonalNovedad(Number(id));
  const { data: tiposNovedades } = useTipoNovedad();

  const { mutate: updateNovedad, isPending: isLoadingUpdateNovedad } =
    useUpdateNovedad();
  const { mutate: deleteNovedad } = useDeleteNovedad();

  // Formularios
  const {
    form: formEditNovedad,
    handleChange: handleChangeEditNovedad,
    setForm: setFormEditNovedad,
    resetForm: resetFormEditNovedad,
  } = useForm<UpdateNovedadDto>({
    descripcion: "",
    fechaInicio: "",
    horaInicio: "",
    fechaFin: "",
    horaFin: "",
    idTipoNovedad: 0,
  });

  const columns: ColumnDef<Novedad>[] = [
    {
      accessorKey: "idNovedad",
      header: "ID",
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
    },
    {
      accessorKey: "fechaInicio",
      header: "Fecha de inicio",
      cell: ({ row }) => {
        return (
          <span className="whitespace-nowrap">{row.original.fechaInicio}</span>
        );
      },
    },
    {
      accessorKey: "horaInicio",
      header: "Hora de inicio",
    },
    {
      accessorKey: "fechaFin",
      header: "Fecha de fin",
      cell: ({ row }) => {
        return (
          <span className="whitespace-nowrap">{row.original.fechaFin}</span>
        );
      },
    },
    {
      accessorKey: "horaFin",
      header: "Hora de fin",
    },
    {
      accessorKey: "idPersonal.primerNombre",
      header: "Personal",
    },
    {
      accessorKey: "idTipoNovedad.descripcion",
      header: "Tipo de novedad",
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => {
              setIsOpenEditModal(true);
              setNovedad(row.original);
              setFormEditNovedad({
                descripcion: row.original.descripcion,
                fechaInicio: row.original.fechaInicio,
                horaInicio: row.original.horaInicio,
                fechaFin: row.original.fechaFin,
                horaFin: row.original.horaFin,
                idTipoNovedad: row.original.idTipoNovedad?.idTipoNovedad,
              });
            }}
          />
          <ButtonAction
            Icon={TrashIcon}
            label="Eliminar"
            onClick={() => {
              setIsOpenDeleteModal(true);
              setNovedad(row.original);
            }}
            color="red"
          />
        </div>
      ),
    },
  ];

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Novedades del personal </h1>
          <ButtonAction
            Icon={ArrowLeftIcon}
            label="Ir a personal"
            onClick={() => {
              navigate({
                to: "/dashboard/personal",
              });
            }}
          />
        </div>
        <Table
          data={novedades?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
          enableFiltering={true}
        />
      </div>

      <SimpleModal
        isOpen={isOpenEditModal}
        onClose={() => setIsOpenEditModal(false)}
        title={"Editar novedad"}
        size="lg"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            updateNovedad(
              {
                id: novedad?.idNovedad || 0,
                data: formEditNovedad,
              },
              {
                onSuccess: () => {
                  setIsOpenEditModal(false);
                  resetFormEditNovedad();
                  setNovedad(null);
                },
              },
            );
          }}
          onCancel={() => {
            setIsOpenEditModal(false);
            resetFormEditNovedad();
            setNovedad(null);
          }}
          updating={true}
          isLoading={isLoadingUpdateNovedad}
        >
          <InputSelect
            label="Tipo de novedad"
            placeholder="Tipo de novedad"
            id="idTipoNovedad"
            value={formEditNovedad.idTipoNovedad?.toString() || ""}
            onChange={handleChangeEditNovedad}
            options={
              tiposNovedades?.data?.map((tipo) => ({
                id: tipo.idTipoNovedad,
                descripcion: tipo.descripcion,
              })) || []
            }
          />
          <InputForm
            label="Descripción"
            placeholder="Descripción"
            id="descripcion"
            value={formEditNovedad.descripcion || ""}
            onChange={handleChangeEditNovedad}
            type="text"
          />
          <InputForm
            label="Fecha de inicio"
            placeholder="Fecha de inicio"
            id="fechaInicio"
            value={formEditNovedad.fechaInicio || ""}
            onChange={handleChangeEditNovedad}
            type="date"
          />
          <InputForm
            label="Hora de inicio"
            placeholder="Hora de inicio"
            id="horaInicio"
            value={formEditNovedad.horaInicio || ""}
            onChange={handleChangeEditNovedad}
            type="time"
          />
          <InputForm
            label="Fecha de fin"
            placeholder="Fecha de fin"
            id="fechaFin"
            value={formEditNovedad.fechaFin || ""}
            onChange={handleChangeEditNovedad}
            type="date"
          />
          <InputForm
            label="Hora de fin"
            placeholder="Hora de fin"
            id="horaFin"
            value={formEditNovedad.horaFin || ""}
            onChange={handleChangeEditNovedad}
            type="time"
          />
        </FormsModal>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDeleteModal}
        text="¿Estás seguro de querer eliminar esta novedad?"
        onDelete={() => {
          deleteNovedad(novedad?.idNovedad || 0, {
            onSuccess: () => {
              setIsOpenDeleteModal(false);
              setNovedad(null);
            },
          });
        }}
        onClose={() => setIsOpenDeleteModal(false)}
      />
    </Section>
  );
}
