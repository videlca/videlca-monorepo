import { createFileRoute } from "@tanstack/react-router";
import {
  useActualizarTipoTarifa,
  useTipoTarifa,
} from "../../../api/queryFunctions/tarifas/tipo-tarifa";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TipoTarifa } from "../../../api/types/periodo";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon } from "lucide-react";
import Table from "../../../components/common/Table";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useForm } from "../../../hooks/useForm";
import type { UpdateTipoTarifaDto } from "../../../api/dtos";
import { InputForm } from "../../../components/common/InputForm";
import { Section } from "../../../components/ui/dashboard/Section";
import { FormsModal } from "../../../components/ui/modals/FormsModal";

export const Route = createFileRoute("/dashboard/tarifas/tipo-tarifa")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<TipoTarifa | null>(null);
  // Queries y mutaciones
  const { data: tipoTarifa } = useTipoTarifa();
  const { mutate: actualizarTipoTarifa, isPending: isLoading } =
    useActualizarTipoTarifa();

  // Formularios
  const {
    form: formTarifaEditar,
    handleChange: handleChangeTarifaEditar,
    resetForm: resetFormTarifaEditar,
    setForm: setFormTarifaEditar,
  } = useForm<UpdateTipoTarifaDto>({
    cantidadTiempo: 0,
  });

  const columns: ColumnDef<TipoTarifa>[] = [
    {
      header: "ID",
      accessorKey: "idTipoTarifa",
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
      header: "Tipo de unidad de tiempo",
      accessorKey: "idTipoUnidadTiempo.descripcion",
    },
    {
      header: "Cantidad de tiempo",
      accessorKey: "cantidadTiempo",
      cell: ({ row }) => {
        return <span>{row.original.cantidadTiempo || 0}</span>;
      },
    },
    {
      header: "Acciones",
      accessorKey: "acciones",
      cell: ({ row }) => {
        if (!row.original.idTipoUnidadTiempo.requiereTiempo) {
          return <span>No se puede editar</span>;
        }
        return (
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => {
              setEditingRow(row.original);
              setIsOpenEditModal(true);
              setFormTarifaEditar({
                cantidadTiempo: row.original.cantidadTiempo || 0,
              });
            }}
          />
        );
      },
    },
  ];
  return (
    <Section>
      <Table
        data={tipoTarifa?.data || []}
        columns={columns}
        pageSize={10}
        enableSorting={true}
        enablePagination={false}
      />

      <SimpleModal
        isOpen={isOpenEditModal}
        onClose={() => setIsOpenEditModal(false)}
        title="Editar tipo de tarifa"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            actualizarTipoTarifa(
              {
                id: editingRow?.idTipoTarifa as number,
                data: formTarifaEditar,
              },
              {
                onSuccess: () => {
                  setIsOpenEditModal(false);
                  resetFormTarifaEditar();
                  setEditingRow(null);
                },
              },
            );
          }}
          isLoading={isLoading}
          onCancel={() => {
            setIsOpenEditModal(false);
            resetFormTarifaEditar();
            setEditingRow(null);
          }}
          updating={true}
        >
          <div className="flex flex-col gap-4">
            <InputForm
              label="Cantidad de tiempo"
              id="cantidadTiempo"
              type="number"
              value={formTarifaEditar.cantidadTiempo.toString()}
              onChange={handleChangeTarifaEditar}
              placeholder="Cantidad de tiempo"
              required={true}
            />
          </div>
        </FormsModal>
      </SimpleModal>
    </Section>
  );
}
