import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { TipoHorario } from "../../../api/types/servicio";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import { useState } from "react";
import {
  useCreateTipoHorario,
  useDeleteTipoHorario,
  useTipoHorarioDescripcionDiurnoNocturno,
  useTipoHorarios,
  useUpdateTipoHorario,
} from "../../../api/queryFunctions/servicios";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useForm } from "react-hook-form";
import type {
  CreateTipoHorarioDto,
  UpdateTipoHorarioDto,
} from "../../../api/dtos";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputForm } from "../../../components/common/InputForm";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { CheckboxForm } from "../../../components/common/CheckboxForm";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { toast } from "sonner";
import { timeFormat } from "../../../utils/TimeFormat";
import { InputTime24H } from "../../../components/common/InputTime24H";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute(
  "/dashboard/servicios/configurar-horarios",
)({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAddTipoHorario, setIsOpenAddTipoHorario] = useState(false);
  const [isOpenEditTipoHorario, setIsOpenEditTipoHorario] = useState(false);
  const [isOpenDeleteTipoHorario, setIsOpenDeleteTipoHorario] = useState(false);
  const [idTipoHorario, setIdTipoHorario] = useState(0);
  const [isIndefinido, setIsIndefinido] = useState(false);
  // Queries y mutaciones
  const { data: tipoHorarios } = useTipoHorarios();
  const { data: tipoHorarioDescripcionDiurnoNocturno } =
    useTipoHorarioDescripcionDiurnoNocturno();

  const { mutate: crearTipoHorario, isPending: isLoadingCrearTipoHorario } =
    useCreateTipoHorario();
  const { mutate: editarTipoHorario, isPending: isLoadingEditarTipoHorario } =
    useUpdateTipoHorario();
  const { mutate: eliminarTipoHorario } = useDeleteTipoHorario();

  // Formularios
  const {
    register: registerCrear,
    handleSubmit: handleSubmitCrear,
    reset: resetCrear,
    setValue: setValueCrear,
  } = useForm<CreateTipoHorarioDto>({
    defaultValues: {
      idTipoHorarioDescripcion: 0,
      horaInicio: "",
      horaFin: "",
      fechaVigenciaInicio: "",
      fechaVigenciaFin: "",
    },
  });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<UpdateTipoHorarioDto>({
    defaultValues: {
      idTipoHorarioDescripcion: 0,
      horaInicio: "",
      horaFin: "",
      fechaVigenciaInicio: "",
      fechaVigenciaFin: "",
    },
  });

  const onSubmitCrear = (data: CreateTipoHorarioDto) => {
    if (data.fechaVigenciaFin === "" && !isIndefinido) {
      toast.error("La fecha de vigencia de fin es requerida");
      return;
    }

    if (data.fechaVigenciaInicio === "") {
      toast.error("La fecha de vigencia de inicio es requerida");
      return;
    }

    const formattedData = {
      ...data,
      idTipoHorarioDescripcion: Number(data.idTipoHorarioDescripcion),
      horaInicio:
        data.horaInicio.includes(":") &&
        data.horaInicio.split(":").length === 2
          ? `${data.horaInicio}:00`
          : data.horaInicio,
      horaFin:
        data.horaFin.includes(":") &&
        data.horaFin.split(":").length === 2
          ? `${data.horaFin}:00`
          : data.horaFin,
      fechaVigenciaInicio: new Date(
        data.fechaVigenciaInicio,
      ).toISOString(),
      fechaVigenciaFin: isIndefinido
        ? null
        : new Date(
            data.fechaVigenciaFin || "",
          ).toISOString(),
    };

    crearTipoHorario(formattedData, {
      onSuccess: () => {
        setIsOpenAddTipoHorario(false);
        resetCrear();
      },
    });
  };

  const onSubmitEditar = (data: UpdateTipoHorarioDto) => {
    if (
      data.fechaVigenciaFin === null &&
      !isIndefinido
    ) {
      toast.error("La fecha de vigencia de fin es requerida");
      return;
    }

    if (data.fechaVigenciaInicio === "") {
      toast.error("La fecha de vigencia de inicio es requerida");
      return;
    }
    const formattedData = {
      ...data,
      idTipoHorarioDescripcion: Number(data.idTipoHorarioDescripcion),
      horaInicio: timeFormat(data.horaInicio || ""),
      horaFin: timeFormat(data.horaFin || ""),
      fechaVigenciaInicio: new Date(
        data.fechaVigenciaInicio || "",
      ).toISOString(),
      fechaVigenciaFin: isIndefinido
        ? null
        : new Date(
            data.fechaVigenciaFin || "",
          ).toISOString(),
    };

    editarTipoHorario(
      {
        id: idTipoHorario,
        data: formattedData,
      },
      {
        onSuccess: () => {
          setIsOpenEditTipoHorario(false);
          resetEditar();
        },
      },
    );
  };

  const columns: ColumnDef<TipoHorario>[] = [
    {
      header: "ID",
      accessorKey: "idTipoHorario",
    },
    {
      header: "Tipo de horario",
      accessorKey: "idTipoHorarioDescripcion.nombre",
    },
    {
      header: "Hora de inicio",
      accessorKey: "horaInicio",
    },
    {
      header: "Hora de fin",
      accessorKey: "horaFin",
    },
    {
      header: "Fecha de vigencia de inicio",
      accessorKey: "fechaVigenciaInicio",
    },
    {
      header: "Fecha de vigencia de fin",
      accessorKey: "fechaVigenciaFin",
      cell: ({ row }) => {
        return <span>{row.original.fechaVigenciaFin || "Vigente"}</span>;
      },
    },
    {
      header: "Acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idTipoHorario}`}
          actions={[
            {
              label: "Editar",
              onClick: () => {
                setIsOpenEditTipoHorario(true);
                setIsIndefinido(row.original.fechaVigenciaFin === null);
                setIdTipoHorario(row.original.idTipoHorario);
                resetEditar({
                  idTipoHorarioDescripcion:
                    row.original.idTipoHorarioDescripcion.idTipoHorarioDescripcion,
                  horaInicio: row.original.horaInicio,
                  horaFin: row.original.horaFin,
                  fechaVigenciaInicio: row.original.fechaVigenciaInicio,
                  fechaVigenciaFin: row.original.fechaVigenciaFin || null,
                });
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIdTipoHorario(row.original.idTipoHorario);
                setIsOpenDeleteTipoHorario(true);
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
            label="Agregar Horario"
            onClick={() => {
              setIsOpenAddTipoHorario(true);
              setIsIndefinido(false);
            }}
          />
        </div>
        <Table
          data={tipoHorarios?.data || []}
          columns={columns}
          pageSize={5}
          enableSorting={true}
          enablePagination={false}
        />
      </div>
      <SimpleModal
        isOpen={isOpenAddTipoHorario}
        onClose={() => {
          setIsOpenAddTipoHorario(false);
          setIsIndefinido(false);
        }}
        title="Agregar Horario"
      >
        <FormsModal
          onSubmit={handleSubmitCrear(onSubmitCrear)}
          isLoading={isLoadingCrearTipoHorario}
          onCancel={() => {
            setIsOpenAddTipoHorario(false);
            resetCrear();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-4">
            <InputSelect
              label="Tipo de horario"
              placeholder="Selecciona un tipo de horario"
              id="idTipoHorarioDescripcion"
              options={
                tipoHorarioDescripcionDiurnoNocturno?.data?.map((tipo) => ({
                  id: tipo.idTipoHorarioDescripcion,
                  descripcion: tipo.nombre,
                })) || []
              }
              required={true}
              {...registerCrear("idTipoHorarioDescripcion", { valueAsNumber: true })}
            />
            <InputTime24H
              label="Hora de inicio"
              placeholder="Selecciona una hora de inicio"
              id="horaInicio"
              required={true}
              {...registerCrear("horaInicio")}
            />
            <InputTime24H
              label="Hora de fin"
              placeholder="Selecciona una hora de fin"
              id="horaFin"
              required={true}
              {...registerCrear("horaFin")}
            />
            <InputForm
              label="Fecha de vigencia de inicio"
              placeholder="Selecciona una fecha de vigencia de inicio"
              id="fechaVigenciaInicio"
              required={true}
              type="date"
              {...registerCrear("fechaVigenciaInicio")}
            />
            <InputForm
              label="Fecha de vigencia de fin"
              placeholder="Selecciona una fecha de vigencia de fin"
              id="fechaVigenciaFin"
              required={false}
              disabled={isIndefinido}
              type="date"
              {...registerCrear("fechaVigenciaFin")}
            />
            <CheckboxForm
              label="Indefinido (sin fecha de vigencia de fin)"
              id="indefinido"
              checked={isIndefinido}
              onChange={(e) => {
                setIsIndefinido(e.target.checked);
                if (e.target.checked) {
                  setValueCrear("fechaVigenciaFin", null as any);
                }
              }}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditTipoHorario}
        onClose={() => {
          setIsOpenEditTipoHorario(false);
          setIsIndefinido(false);
        }}
        title="Editar Horario"
      >
        <FormsModal
          onSubmit={handleSubmitEditar(onSubmitEditar)}
          isLoading={isLoadingEditarTipoHorario}
          onCancel={() => {
            setIsOpenEditTipoHorario(false);
            resetEditar();
          }}
          updating={true}
        >
          <div className="flex flex-col gap-4">
            <InputSelect
              label="Tipo de horario"
              placeholder="Selecciona un tipo de horario"
              id="idTipoHorarioDescripcion"
              options={
                tipoHorarioDescripcionDiurnoNocturno?.data?.map((tipo) => ({
                  id: tipo.idTipoHorarioDescripcion,
                  descripcion: tipo.nombre,
                })) || []
              }
              required={true}
              {...registerEditar("idTipoHorarioDescripcion", { valueAsNumber: true })}
            />
            <InputTime24H
              label="Hora de inicio"
              placeholder="Selecciona una hora de inicio"
              id="horaInicio"
              required={true}
              {...registerEditar("horaInicio")}
            />
            <InputTime24H
              label="Hora de fin"
              placeholder="Selecciona una hora de fin"
              id="horaFin"
              required={true}
              {...registerEditar("horaFin")}
            />
            <InputForm
              label="Fecha de vigencia de inicio"
              placeholder="Selecciona una fecha de vigencia de inicio"
              id="fechaVigenciaInicio"
              required={true}
              type="date"
              {...registerEditar("fechaVigenciaInicio")}
            />
            <InputForm
              label="Fecha de vigencia de fin"
              placeholder="Selecciona una fecha de vigencia de fin"
              id="fechaVigenciaFin"
              required={false}
              disabled={isIndefinido}
              type="date"
              {...registerEditar("fechaVigenciaFin")}
            />
            <CheckboxForm
              label="Indefinido (sin fecha de vigencia de fin)"
              id="indefinido"
              checked={isIndefinido}
              onChange={(e) => {
                setIsIndefinido(e.target.checked);
              }}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDeleteTipoHorario}
        text="¿Estás seguro de querer eliminar este tipo de horario?"
        onDelete={() => {
          eliminarTipoHorario(idTipoHorario, {
            onSuccess: () => {
              setIsOpenDeleteTipoHorario(false);
              setIdTipoHorario(0);
            },
          });
        }}
        onClose={() => setIsOpenDeleteTipoHorario(false)}
      />
    </Section>
  );
}
