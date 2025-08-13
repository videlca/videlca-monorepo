import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { TipoHorario } from "../../../api/types/servicio";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
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
import { useForm } from "../../../hooks/useForm";
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
import { InputTime } from "../../../components/common/InputTime";

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
    form: formAddTipoHorario,
    handleChange: handleChangeAddTipoHorario,
    handleChangeTime: handleChangeTimeAddTipoHorario,
    resetForm: resetFormAddTipoHorario,
  } = useForm<CreateTipoHorarioDto>({
    idTipoHorarioDescripcion: 0,
    horaInicio: "",
    horaFin: "",
    fechaVigenciaInicio: "",
    fechaVigenciaFin: "",
  });
  const {
    form: formEditTipoHorario,
    handleChange: handleChangeEditTipoHorario,
    handleChangeTime: handleChangeTimeEditTipoHorario,
    resetForm: resetFormEditTipoHorario,
  } = useForm<UpdateTipoHorarioDto>({
    idTipoHorarioDescripcion: 0,
    horaInicio: "",
    horaFin: "",
    fechaVigenciaInicio: "",
    fechaVigenciaFin: "",
  });

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
    // {
    //   header: "Estado",
    //   accessorKey: "estado",
    //   cell: ({ row }) => {
    //     return <StateLabel state={row.original.estado} />;
    //   },
    // },
    {
      header: "Acciones",
      cell: ({ row }) => {
        return (
          <div className="flex gap-2">
            <ButtonAction
              Icon={PencilIcon}
              label="Editar"
              onClick={() => {
                setIsOpenEditTipoHorario(true);
                setIsIndefinido(row.original.fechaVigenciaFin === null);
                setIdTipoHorario(row.original.idTipoHorario);
                formEditTipoHorario.idTipoHorarioDescripcion =
                  row.original.idTipoHorarioDescripcion.idTipoHorarioDescripcion;
                formEditTipoHorario.horaInicio = row.original.horaInicio;
                formEditTipoHorario.horaFin = row.original.horaFin;
                formEditTipoHorario.fechaVigenciaInicio =
                  row.original.fechaVigenciaInicio;
                formEditTipoHorario.fechaVigenciaFin =
                  row.original.fechaVigenciaFin || null;
              }}
            />
            <ButtonAction
              Icon={TrashIcon}
              label="Eliminar"
              onClick={() => {
                setIdTipoHorario(row.original.idTipoHorario);
                setIsOpenDeleteTipoHorario(true);
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
          pageSize={10}
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
          onSubmit={(e) => {
            e.preventDefault();
            if (formAddTipoHorario.fechaVigenciaFin === "") {
              toast.error("La fecha de vigencia de fin es requerida");
              return;
            }

            if (formAddTipoHorario.fechaVigenciaInicio === "") {
              toast.error("La fecha de vigencia de inicio es requerida");
              return;
            }

            const formattedData = {
              ...formAddTipoHorario,
              horaInicio:
                formAddTipoHorario.horaInicio.includes(":") &&
                formAddTipoHorario.horaInicio.split(":").length === 2
                  ? `${formAddTipoHorario.horaInicio}:00`
                  : formAddTipoHorario.horaInicio,
              horaFin:
                formAddTipoHorario.horaFin.includes(":") &&
                formAddTipoHorario.horaFin.split(":").length === 2
                  ? `${formAddTipoHorario.horaFin}:00`
                  : formAddTipoHorario.horaFin,
              fechaVigenciaInicio: new Date(
                formAddTipoHorario.fechaVigenciaInicio,
              ).toISOString(),
              fechaVigenciaFin: isIndefinido
                ? null
                : new Date(
                    formAddTipoHorario.fechaVigenciaFin || "",
                  ).toISOString(),
            };

            crearTipoHorario(formattedData, {
              onSuccess: () => {
                setIsOpenAddTipoHorario(false);
                resetFormAddTipoHorario();
              },
            });
          }}
          isLoading={isLoadingCrearTipoHorario}
          onCancel={() => {
            setIsOpenAddTipoHorario(false);
            resetFormAddTipoHorario();
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
              value={formAddTipoHorario.idTipoHorarioDescripcion}
              onChange={handleChangeAddTipoHorario}
              required={true}
            />
            <InputTime
              label="Hora de inicio"
              placeholder="Selecciona una hora de inicio"
              id="horaInicio"
              value={formAddTipoHorario.horaInicio}
              onChange={handleChangeTimeAddTipoHorario}
              required={true}
            />
            <InputTime
              label="Hora de fin"
              placeholder="Selecciona una hora de fin"
              id="horaFin"
              value={formAddTipoHorario.horaFin}
              onChange={handleChangeTimeAddTipoHorario}
              required={true}
            />
            <InputForm
              label="Fecha de vigencia de inicio"
              placeholder="Selecciona una fecha de vigencia de inicio"
              id="fechaVigenciaInicio"
              value={formAddTipoHorario.fechaVigenciaInicio}
              onChange={handleChangeAddTipoHorario}
              required={true}
              type="date"
            />
            <InputForm
              label="Fecha de vigencia de fin"
              placeholder="Selecciona una fecha de vigencia de fin"
              id="fechaVigenciaFin"
              value={formAddTipoHorario.fechaVigenciaFin || ""}
              onChange={handleChangeAddTipoHorario}
              required={false}
              disabled={isIndefinido}
              type="date"
            />
            <CheckboxForm
              label="Indefinido (sin fecha de vigencia de fin)"
              id="indefinido"
              checked={isIndefinido}
              onChange={(e) => {
                setIsIndefinido(e.target.checked);
                if (e.target.checked) {
                  setIsIndefinido(true);
                  formAddTipoHorario.fechaVigenciaFin = null;
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
          onSubmit={(e) => {
            e.preventDefault();
            if (
              formEditTipoHorario.fechaVigenciaFin === null &&
              !isIndefinido
            ) {
              toast.error("La fecha de vigencia de fin es requerida");
              return;
            }

            if (formEditTipoHorario.fechaVigenciaInicio === "") {
              toast.error("La fecha de vigencia de inicio es requerida");
              return;
            }
            const formattedData = {
              ...formEditTipoHorario,
              horaInicio: timeFormat(formEditTipoHorario.horaInicio || ""),
              horaFin: timeFormat(formEditTipoHorario.horaFin || ""),
              fechaVigenciaInicio: new Date(
                formEditTipoHorario.fechaVigenciaInicio || "",
              ).toISOString(),
              fechaVigenciaFin: isIndefinido
                ? null
                : new Date(
                    formEditTipoHorario.fechaVigenciaFin || "",
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
                  resetFormEditTipoHorario();
                },
              },
            );
          }}
          isLoading={isLoadingEditarTipoHorario}
          onCancel={() => {
            setIsOpenEditTipoHorario(false);
            resetFormEditTipoHorario();
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
              value={formEditTipoHorario.idTipoHorarioDescripcion || 0}
              onChange={handleChangeEditTipoHorario}
              required={true}
            />
            <InputTime
              label="Hora de inicio"
              placeholder="Selecciona una hora de inicio"
              id="horaInicio"
              value={formEditTipoHorario.horaInicio || ""}
              onChange={handleChangeTimeEditTipoHorario}
              required={true}
            />
            <InputTime
              label="Hora de fin"
              placeholder="Selecciona una hora de fin"
              id="horaFin"
              value={formEditTipoHorario.horaFin || ""}
              onChange={handleChangeTimeEditTipoHorario}
              required={true}
            />
            <InputForm
              label="Fecha de vigencia de inicio"
              placeholder="Selecciona una fecha de vigencia de inicio"
              id="fechaVigenciaInicio"
              value={formEditTipoHorario.fechaVigenciaInicio || ""}
              onChange={handleChangeEditTipoHorario}
              required={true}
              type="date"
            />
            <InputForm
              label="Fecha de vigencia de fin"
              placeholder="Selecciona una fecha de vigencia de fin"
              id="fechaVigenciaFin"
              value={formEditTipoHorario.fechaVigenciaFin || ""}
              onChange={handleChangeEditTipoHorario}
              required={false}
              disabled={isIndefinido}
              type="date"
            />
            <CheckboxForm
              label="Indefinido (sin fecha de vigencia de fin)"
              id="indefinido"
              checked={isIndefinido}
              onChange={(e) => {
                setIsIndefinido(e.target.checked);
                if (e.target.checked) {
                  setIsIndefinido(true);
                  formEditTipoHorario.fechaVigenciaFin = null;
                }
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
