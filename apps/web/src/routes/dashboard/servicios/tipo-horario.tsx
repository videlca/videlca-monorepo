import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { TipoHorario } from "../../../api/types/servicio";
import { StateLabel } from "../../../components/common/StateLabel";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import { useState } from "react";
import {
  useCreateTipoHorario,
  useTipoHorarioDescripcion,
  useTipoHorarios,
  useUpdateTipoHorario,
} from "../../../api/queryFunctions/servicios";
import { SimpleModal } from "../../../components/common/SimpleModal";
import Button from "../../../components/common/Button";
import { useForm } from "../../../hooks/useForm";
import type {
  CreateTipoHorarioDto,
  UpdateTipoHorarioDto,
} from "../../../api/dtos";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputForm } from "../../../components/common/InputForm";

export const Route = createFileRoute("/dashboard/servicios/tipo-horario")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAddTipoHorario, setIsOpenAddTipoHorario] = useState(false);
  const [isOpenEditTipoHorario, setIsOpenEditTipoHorario] = useState(false);
  // Queries y mutaciones
  const { data: tipoHorarios } = useTipoHorarios();
  const { data: tipoHorarioDescripcion } = useTipoHorarioDescripcion();

  const { mutate: crearTipoHorario, isPending: isLoadingCrearTipoHorario } =
    useCreateTipoHorario();
  const { mutate: editarTipoHorario, isPending: isLoadingEditarTipoHorario } =
    useUpdateTipoHorario();

  // Formularios
  const {
    form: formAddTipoHorario,
    handleChange: handleChangeAddTipoHorario,
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
      accessorKey: "idTipoHorarioDescripcion.descripcion",
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
      cell: ({ row }) => {
        return (
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => {
              setIsOpenEditTipoHorario(true);
              formEditTipoHorario.idTipoHorarioDescripcion =
                row.original.idTipoHorarioDescripcion.idTipoHorarioDescripcion;
              formEditTipoHorario.horaInicio = row.original.horaInicio;
              formEditTipoHorario.horaFin = row.original.horaFin;
              formEditTipoHorario.fechaVigenciaInicio =
                row.original.fechaVigenciaInicio;
              formEditTipoHorario.fechaVigenciaFin =
                row.original.fechaVigenciaFin || "";
            }}
          />
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
            label="Agregar Tipo de Horario"
            onClick={() => setIsOpenAddTipoHorario(true)}
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
        onClose={() => setIsOpenAddTipoHorario(false)}
        title="Agregar Tipo de Horario"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
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

              fechaVigenciaFin: new Date(
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
        >
          <InputSelect
            label="Tipo de horario"
            placeholder="Selecciona un tipo de horario"
            id="idTipoHorarioDescripcion"
            options={
              tipoHorarioDescripcion?.data?.map((tipo) => ({
                id: tipo.idTipoHorarioDescripcion,
                descripcion: tipo.descripcion,
              })) || []
            }
            value={formAddTipoHorario.idTipoHorarioDescripcion}
            onChange={handleChangeAddTipoHorario}
            required={true}
          />
          <InputForm
            label="Hora de inicio"
            placeholder="Selecciona una hora de inicio"
            id="horaInicio"
            value={formAddTipoHorario.horaInicio}
            onChange={(e) => {
              handleChangeAddTipoHorario(e);
              console.log(e.target.value);
            }}
            required={true}
            type="time"
          />
          <InputForm
            label="Hora de fin"
            placeholder="Selecciona una hora de fin"
            id="horaFin"
            value={formAddTipoHorario.horaFin}
            onChange={(e) => {
              handleChangeAddTipoHorario(e);
              console.log(e.target.value);
            }}
            required={true}
            type="time"
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
            type="date"
          />
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsOpenAddTipoHorario(false);
                resetFormAddTipoHorario();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-auto">
              {isLoadingCrearTipoHorario ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditTipoHorario}
        onClose={() => setIsOpenEditTipoHorario(false)}
        title="Editar Tipo de Horario"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();

            const formattedData = {
              ...formEditTipoHorario,
              horaInicio:
                formEditTipoHorario.horaInicio &&
                formEditTipoHorario.horaInicio.includes(":") &&
                formEditTipoHorario.horaInicio.split(":").length === 2
                  ? `${formEditTipoHorario.horaInicio}:00`
                  : formEditTipoHorario.horaInicio,
              horaFin:
                formEditTipoHorario.horaFin &&
                formEditTipoHorario.horaFin.includes(":") &&
                formEditTipoHorario.horaFin.split(":").length === 2
                  ? `${formEditTipoHorario.horaFin}:00`
                  : formEditTipoHorario.horaFin,
              fechaVigenciaInicio: new Date(
                formEditTipoHorario.fechaVigenciaInicio || "",
              ).toISOString(),
              fechaVigenciaFin: new Date(
                formEditTipoHorario.fechaVigenciaFin || "",
              ).toISOString(),
            };

            editarTipoHorario(
              {
                id: 1,
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
        >
          <InputSelect
            label="Tipo de horario"
            placeholder="Selecciona un tipo de horario"
            id="idTipoHorarioDescripcion"
            options={
              tipoHorarioDescripcion?.data?.map((tipo) => ({
                id: tipo.idTipoHorarioDescripcion,
                descripcion: tipo.descripcion,
              })) || []
            }
            value={formEditTipoHorario.idTipoHorarioDescripcion || 0}
            onChange={handleChangeEditTipoHorario}
            required={true}
          />
          <InputForm
            label="Hora de inicio"
            placeholder="Selecciona una hora de inicio"
            id="horaInicio"
            value={formEditTipoHorario.horaInicio || ""}
            onChange={handleChangeEditTipoHorario}
            required={true}
            type="time"
          />
          <InputForm
            label="Hora de fin"
            placeholder="Selecciona una hora de fin"
            id="horaFin"
            value={formEditTipoHorario.horaFin || ""}
            onChange={handleChangeEditTipoHorario}
            required={true}
            type="time"
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
            type="date"
          />
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsOpenEditTipoHorario(false);
                resetFormEditTipoHorario();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-auto">
              {isLoadingEditarTipoHorario ? "Editando..." : "Editar"}
            </Button>
          </div>
        </form>
      </SimpleModal>
    </Section>
  );
}
