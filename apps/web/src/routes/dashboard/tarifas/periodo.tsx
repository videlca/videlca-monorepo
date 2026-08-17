import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PlusIcon } from "lucide-react";
import type { Periodo } from "../../../api/types/periodo";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import {
  useActualizarPeriodo,
  useCrearPeriodo,
  useEliminarPeriodo,
  usePeriodos,
} from "../../../api/queryFunctions/tarifas/periodo";
import { useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
import { CheckboxForm } from "../../../components/common/CheckboxForm";
import { useForm } from "react-hook-form";
import type { CreatePeriodoDto, UpdatePeriodoDto } from "../../../api/dtos";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";
import { useServerPagination } from "../../../hooks/useServerPagination";

export const Route = createFileRoute("/dashboard/tarifas/periodo")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  // Estados
  const [isOpenAddTarifa, setIsOpenAddTarifa] = useState(false);
  const [isOpenEditTarifa, setIsOpenEditTarifa] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | null>(null);
  const [isOpenDeleteTarifa, setIsOpenDeleteTarifa] = useState(false);
  
  // Paginación server-side
  const { page, setPage, pageSize, setPageSize, paginationParams } = useServerPagination(5);

  // Mutaciones y queries
  const { data: periodos } = usePeriodos(paginationParams);
  const { mutate: crearPeriodo, isPending: isLoadingCrearPeriodo } =
    useCrearPeriodo();
  const { mutate: actualizarPeriodo, isPending: isLoadingActualizarPeriodo } =
    useActualizarPeriodo();
  const { mutate: eliminarPeriodo } = useEliminarPeriodo();

  // Formularios
  const {
    register: registerCrear,
    handleSubmit: handleSubmitCrear,
    reset: resetCrear,
  } = useForm<CreatePeriodoDto>({
    defaultValues: {
      fechaFin: "",
      fechaInicio: "",
      periodoActivoFacturacion: false,
    },
  });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<UpdatePeriodoDto>({
    defaultValues: {
      fechaFin: "",
      fechaInicio: "",
      periodoActivoFacturacion: false,
    },
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
      cell: ({ row }) => {
        return (
          <span className="whitespace-nowrap">{row.original.fechaInicio}</span>
        );
      },
    },
    {
      header: "Fecha de fin",
      accessorKey: "fechaFin",
      cell: ({ row }) => {
        return (
          <span className="whitespace-nowrap">{row.original.fechaFin}</span>
        );
      },
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
          <MoreActionsButton
            menuId={`actions-${row.original.idPeriodo}`}
            actions={[
              {
                label: "Editar",
                onClick: () => {
                  setIsOpenEditTarifa(true);
                  setSelectedPeriodo(row.original);
                  resetEditar({
                    fechaFin: row.original.fechaFin,
                    fechaInicio: row.original.fechaInicio,
                    periodoActivoFacturacion:
                      row.original.periodoActivoFacturacion,
                  });
                },
              },
              {
                label: "Ver tarifas",
                onClick: () => {
                  navigate({
                    to: "/dashboard/tarifas/ver-tarifas/$id-periodo",
                    params: {
                      "id-periodo": row.original.idPeriodo.toString(),
                    },
                  });
                },
              },
              {
                label: "Configurar servicios",
                onClick: () => {
                  navigate({
                    to: "/dashboard/tarifas/configurar-servicios/$id-periodo",
                    params: {
                      "id-periodo": row.original.idPeriodo.toString(),
                    },
                  });
                },
              },
              {
                label: "Eliminar",
                onClick: () => {
                  setIsOpenDeleteTarifa(true);
                  setSelectedPeriodo(row.original);
                },
                color: "red" as const,
              },
            ]}
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
            label="Agregar Periodo"
            onClick={() => setIsOpenAddTarifa(true)}
          />
        </div>
        <Table
          data={periodos?.data?.data || []}
          columns={columns}
          serverPagination={true}
          totalRows={periodos?.data?.pagination?.total ?? 0}
          currentPage={page}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          pageSize={pageSize}
          // enableFiltering={true}
          enableFiltering={false}
          enableSorting={false}
          enablePagination={true}
        />
      </div>
      <SimpleModal
        isOpen={isOpenAddTarifa}
        onClose={() => {
          setIsOpenAddTarifa(false);
          resetCrear();
        }}
        title="Agregar Periodo"
      >
        <FormsModal
          isLoading={isLoadingCrearPeriodo}
          onCancel={() => {
            setIsOpenAddTarifa(false);
            resetCrear();
          }}
          updating={false}
          onSubmit={handleSubmitCrear((data) => {
            crearPeriodo(
              {
                periodoActivoFacturacion: Boolean(
                  data.periodoActivoFacturacion,
                ),
                fechaInicio: new Date(data.fechaInicio)
                  .toISOString()
                  .split("T")[0],
                fechaFin: new Date(data.fechaFin)
                  .toISOString()
                  .split("T")[0],
              },
              {
                onSuccess: () => {
                  setIsOpenAddTarifa(false);
                  resetCrear();
                },
              },
            );
          })}
        >
          <div className="flex flex-col gap-4">
            <InputForm
              label="Fecha de inicio"
              id="fechaInicio"
              type="date"
              placeholder="Fecha de inicio"
              required={true}
              {...registerCrear("fechaInicio")}
            />
            <InputForm
              label="Fecha de fin"
              id="fechaFin"
              type="date"
              placeholder="Fecha de fin"
              required={true}
              {...registerCrear("fechaFin")}
            />
            <CheckboxForm
              label="Activo para facturación"
              id="periodoActivoFacturacion"
              required={false}
              {...registerCrear("periodoActivoFacturacion")}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditTarifa}
        onClose={() => {
          setIsOpenEditTarifa(false);
          resetEditar();
          setSelectedPeriodo(null);
        }}
        title="Editar Periodo"
      >
        <FormsModal
          isLoading={isLoadingActualizarPeriodo}
          onCancel={() => {
            setIsOpenEditTarifa(false);
            resetEditar();
            setSelectedPeriodo(null);
          }}
          updating={true}
          onSubmit={handleSubmitEditar((data) => {
            actualizarPeriodo(
              {
                id: selectedPeriodo?.idPeriodo || 0,
                data: {
                  fechaInicio: new Date(data.fechaInicio)
                    .toISOString()
                    .split("T")[0],
                  fechaFin: new Date(data.fechaFin)
                    .toISOString()
                    .split("T")[0],
                  periodoActivoFacturacion: Boolean(
                    data.periodoActivoFacturacion,
                  ),
                },
              },
              {
                onSuccess: () => {
                  setIsOpenEditTarifa(false);
                  resetEditar();
                },
              },
            );
          })}
        >
          <div className="flex flex-col gap-4">
            <InputForm
              label="Fecha de inicio"
              id="fechaInicio"
              type="date"
              placeholder="Fecha de inicio"
              required={true}
              {...registerEditar("fechaInicio")}
            />
            <InputForm
              label="Fecha de fin"
              id="fechaFin"
              type="date"
              placeholder="Fecha de fin"
              required={true}
              {...registerEditar("fechaFin")}
            />
            <CheckboxForm
              label="Activo para facturación"
              id="periodoActivoFacturacion"
              required={false}
              {...registerEditar("periodoActivoFacturacion")}
            />
          </div>
        </FormsModal>
      </SimpleModal>
      <ConfirmarDelete
        isOpenDelete={isOpenDeleteTarifa}
        text="¿Estás seguro de querer eliminar este periodo?"
        onDelete={() => {
          eliminarPeriodo(selectedPeriodo?.idPeriodo || 0, {
            onSuccess: () => {
              setIsOpenDeleteTarifa(false);
              setSelectedPeriodo(null);
            },
          });
        }}
        onClose={() => setIsOpenDeleteTarifa(false)}
      />
    </Section>
  );
}
