import { PageHeader } from "../../../components/ui/common/PageHeader";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
import { useForm } from "react-hook-form";
import type { UpdateNovedadDto } from "../../../api/dtos/personal";
import { useTipoNovedad } from "../../../api/queryFunctions/configuracion";
import { useGetPersonalNovedad } from "../../../api/queryFunctions/personal";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputForm } from "../../../components/common/InputForm";
import { timeFormat } from "../../../utils/TimeFormat";
import { InputTime24H } from "../../../components/common/InputTime24H";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

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
    register,
    control,
    handleSubmit,
    reset,
  } = useForm<UpdateNovedadDto>({
    defaultValues: {
      descripcion: "",
      fechaInicio: "",
      horaInicio: "",
      fechaFin: "",
      horaFin: "",
      idTipoNovedad: 0,
    },
  });

  const onSubmitEditar = (data: UpdateNovedadDto) => {
    updateNovedad(
      {
        id: novedad?.idNovedad || 0,
        data: {
          ...data,
          idTipoNovedad: Number(data.idTipoNovedad),
          horaFin: timeFormat(data.horaFin || ""),
          horaInicio: timeFormat(data.horaInicio || ""),
        },
      },
      {
        onSuccess: () => {
          setIsOpenEditModal(false);
          reset();
          setNovedad(null);
        },
      },
    );
  };

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
        <MoreActionsButton
          menuId={`actions-${row.original.idNovedad}`}
          actions={[
            {
              label: "Editar",
              onClick: () => {
                setIsOpenEditModal(true);
                setNovedad(row.original);
                reset({
                  descripcion: row.original.descripcion,
                  fechaInicio: row.original.fechaInicio,
                  horaInicio: row.original.horaInicio,
                  fechaFin: row.original.fechaFin,
                  horaFin: row.original.horaFin,
                  idTipoNovedad: row.original.idTipoNovedad?.idTipoNovedad,
                });
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIsOpenDeleteModal(true);
                setNovedad(row.original);
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
        <PageHeader
          title="Novedades del personal"
          actions={
            <ButtonAction
              Icon={ArrowBackIcon}
              label="Ir a personal"
              onClick={() => {
                navigate({
                  to: "/dashboard/personal",
                });
              }}
            />
          }
        />
        <Table
          data={novedades?.data || []}
          columns={columns}
          pageSize={5}
          enablePagination={true}
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
          onSubmit={handleSubmit(onSubmitEditar)}
          onCancel={() => {
            setIsOpenEditModal(false);
            reset();
            setNovedad(null);
          }}
          updating={true}
          isLoading={isLoadingUpdateNovedad}
        >
          <div className="flex flex-col gap-4">
            <InputSelect
              label="Tipo de novedad"
              placeholder="Tipo de novedad"
              id="idTipoNovedad"
              options={
                tiposNovedades?.data?.data?.map((tipo) => ({
                  id: tipo.idTipoNovedad,
                  descripcion: tipo.descripcion,
                })) || []
              }
              control={control}
              name="idTipoNovedad"
              valueAsNumber
            />
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              type="text"
              {...register("descripcion")}
            />
            <InputForm
              label="Fecha de inicio"
              placeholder="Fecha de inicio"
              id="fechaInicio"
              type="date"
              {...register("fechaInicio")}
            />
            <InputTime24H
              label="Hora de inicio"
              placeholder="Selecciona una hora de inicio"
              id="horaInicio"
              required={true}
              {...register("horaInicio")}
            />
            <InputForm
              label="Fecha de fin"
              placeholder="Fecha de fin"
              id="fechaFin"
              type="date"
              {...register("fechaFin")}
            />
            <InputTime24H
              label="Hora de fin"
              placeholder="Selecciona una hora de fin"
              id="horaFin"
              required={true}
              {...register("horaFin")}
            />
          </div>
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
