import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import {
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";
import type { Periodo } from "../../../api/types/periodo";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import {
  useActualizarPeriodo,
  useCrearPeriodo,
  usePeriodos,
} from "../../../api/queryFunctions/tarifas/periodo";
import { useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
import { CheckboxForm } from "../../../components/common/CheckboxForm";
import { useForm } from "../../../hooks/useForm";
import type { CreatePeriodoDto, UpdatePeriodoDto } from "../../../api/dtos";
import Button from "../../../components/common/Button";

export const Route = createFileRoute("/dashboard/tarifas/periodo")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAddTarifa, setIsOpenAddTarifa] = useState(false);
  const [isOpenEditTarifa, setIsOpenEditTarifa] = useState(false);
  const [editingRow, setEditingRow] = useState<Periodo | null>(null);

  const navigate = useNavigate();
  // Mutaciones y queries
  const { data: periodos } = usePeriodos();
  const { mutate: crearPeriodo, isPending: isLoadingCrearPeriodo } =
    useCrearPeriodo();
  const { mutate: actualizarPeriodo, isPending: isLoadingActualizarPeriodo } =
    useActualizarPeriodo();
  // Formularios
  const {
    form: formAddPeriodo,
    handleChange: handleChangeAddPeriodo,
    resetForm: resetFormAddPeriodo,
  } = useForm<CreatePeriodoDto>({
    fechaFin: "",
    fechaInicio: "",
    periodoActivoFacturacion: false,
  });

  const {
    form: formEditPeriodo,
    handleChange: handleChangeEditPeriodo,
    resetForm: resetFormEditPeriodo,
    setForm: setFormEditPeriodo,
  } = useForm<UpdatePeriodoDto>({
    fechaFin: "",
    fechaInicio: "",
    periodoActivoFacturacion: false,
  });

  const columns: ColumnDef<Periodo>[] = [
    {
      header: "Periodo",
      accessorKey: "nombre",
      cell: ({ row }) => {
        return (
          <span className="font-semibold whitespace-nowrap">
            {row.original.nombre}
          </span>
        );
      },
    },
    {
      header: "Fecha de inicio",
      accessorKey: "fechaInicio",
    },
    {
      header: "Fecha de fin",
      accessorKey: "fechaFin",
    },
    {
      header: "Activo para facturación",
      accessorKey: "periodoActivoFacturacion",
      cell: ({ row }) => {
        return <StateLabel state={row.original.periodoActivoFacturacion} />;
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
                setIsOpenEditTarifa(true);
                setEditingRow(row.original);
                setFormEditPeriodo({
                  fechaFin: row.original.fechaFin,
                  fechaInicio: row.original.fechaInicio,
                  periodoActivoFacturacion:
                    row.original.periodoActivoFacturacion,
                });
              }}
            />
            <ButtonAction
              Icon={EyeIcon}
              label="Ver tarifas"
              onClick={() => {
                // setIsOpenSeeTarifa(true);
                navigate({
                  to: "/dashboard/tarifas/ver-tarifas/$id-periodo",
                  params: {
                    "id-periodo": row.original.idPeriodo.toString(),
                  },
                });
              }}
            />
            <ButtonAction
              Icon={SettingsIcon}
              label="Configurar servicios"
              onClick={() => {
                navigate({
                  to: "/dashboard/tarifas/configurar-servicios/$id-periodo",
                  params: {
                    "id-periodo": row.original.idPeriodo.toString(),
                  },
                });
              }}
            />
            <ButtonAction
              Icon={TrashIcon}
              label="Eliminar"
              onClick={() => {}}
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
            label="Agregar Periodo"
            onClick={() => setIsOpenAddTarifa(true)}
          />
        </div>
        <Table
          data={periodos?.data || []}
          columns={columns}
          pageSize={10}
          enableSorting={false}
          enablePagination={true}
        />
      </div>
      <SimpleModal
        isOpen={isOpenAddTarifa}
        onClose={() => setIsOpenAddTarifa(false)}
        title="Agregar Periodo"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            crearPeriodo(
              {
                periodoActivoFacturacion: Boolean(
                  formAddPeriodo.periodoActivoFacturacion,
                ),
                fechaInicio: new Date(formAddPeriodo.fechaInicio)
                  .toISOString()
                  .split("T")[0],
                fechaFin: new Date(formAddPeriodo.fechaFin)
                  .toISOString()
                  .split("T")[0],
              },
              {
                onSuccess: () => {
                  setIsOpenAddTarifa(false);
                  resetFormAddPeriodo();
                },
              },
            );
          }}
        >
          <InputForm
            label="Fecha de inicio"
            id="fechaInicio"
            type="date"
            placeholder="Fecha de inicio"
            value={formAddPeriodo.fechaInicio}
            onChange={handleChangeAddPeriodo}
            required={true}
          />
          <InputForm
            label="Fecha de fin"
            id="fechaFin"
            type="date"
            placeholder="Fecha de fin"
            value={formAddPeriodo.fechaFin}
            onChange={handleChangeAddPeriodo}
            required={true}
          />
          <CheckboxForm
            label="Activo para facturación"
            id="periodoActivoFacturacion"
            checked={formAddPeriodo.periodoActivoFacturacion}
            onChange={handleChangeAddPeriodo}
            required={false}
          />
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsOpenAddTarifa(false);
                resetFormAddPeriodo();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-auto">
              {isLoadingCrearPeriodo ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </SimpleModal>
      <SimpleModal
        isOpen={isOpenEditTarifa}
        onClose={() => setIsOpenEditTarifa(false)}
        title="Editar Periodo"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            actualizarPeriodo(
              {
                id: editingRow?.idPeriodo || 0,
                data: {
                  fechaInicio: new Date(formEditPeriodo.fechaInicio)
                    .toISOString()
                    .split("T")[0],
                  fechaFin: new Date(formEditPeriodo.fechaFin)
                    .toISOString()
                    .split("T")[0],
                  periodoActivoFacturacion: Boolean(
                    formEditPeriodo.periodoActivoFacturacion,
                  ),
                },
              },
              {
                onSuccess: () => {
                  setIsOpenEditTarifa(false);
                  resetFormEditPeriodo();
                },
              },
            );
          }}
        >
          <InputForm
            label="Fecha de inicio"
            id="fechaInicio"
            type="date"
            placeholder="Fecha de inicio"
            value={formEditPeriodo.fechaInicio}
            onChange={handleChangeEditPeriodo}
            required={true}
          />
          <InputForm
            label="Fecha de fin"
            id="fechaFin"
            type="date"
            placeholder="Fecha de fin"
            value={formEditPeriodo.fechaFin}
            onChange={handleChangeEditPeriodo}
            required={true}
          />
          <CheckboxForm
            label="Activo para facturación"
            id="periodoActivoFacturacion"
            checked={formEditPeriodo.periodoActivoFacturacion}
            onChange={handleChangeEditPeriodo}
            required={false}
          />
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsOpenEditTarifa(false);
                resetFormEditPeriodo();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-auto">
              {isLoadingActualizarPeriodo ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </form>
      </SimpleModal>
    </Section>
  );
}
