import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import Table from "../../../components/common/Table";
import {
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Tarifa } from "../../../api/types/periodo";
import {
  useActualizarTarifa,
  useEliminarTarifa,
  usePeriodoById,
  useTarifas,
  useTipoTarifa,
} from "../../../api/queryFunctions/tarifas";
import { StateLabel } from "../../../components/common/StateLabel";
import { useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { useForm } from "../../../hooks/useForm";
import type { UpdateTarifaDto } from "../../../api/dtos";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputPrice } from "../../../components/common/InputPrice";
import Button from "../../../components/common/Button";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";

export const Route = createFileRoute(
  "/dashboard/tarifas/ver-tarifas/$id-periodo",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { "id-periodo": idPeriodoParam } = useParams({
    from: "/dashboard/tarifas/ver-tarifas/$id-periodo",
  });
  const { data: periodo } = usePeriodoById(Number(idPeriodoParam));
  // Estados
  const [isOpenSeeTarifa, setIsOpenSeeTarifa] = useState(false);
  const [isOpenEditTarifa, setIsOpenEditTarifa] = useState(false);
  const [isOpenDeleteTarifa, setIsOpenDeleteTarifa] = useState(false);
  const [tarifaSelected, setTarifaSelected] = useState<Tarifa | null>(null);

  // Queries y Mutaciones
  const { data: tarifas } = useTarifas(Number(idPeriodoParam));
  const { data: tiposTarifa } = useTipoTarifa();
  const { mutate: eliminarTarifa } = useEliminarTarifa();
  const { mutate: actualizarTarifa, isPending: isLoadingActualizarTarifa } =
    useActualizarTarifa();
  // Formularios
  const {
    form: updateTarifaForm,
    handleChange: handleChangeUpdateTarifa,
    setForm: setUpdateTarifaForm,
  } = useForm<UpdateTarifaDto>({
    idPeriodo: Number(idPeriodoParam),
    idServicio: 0,
    idTipoTarifa: 0,
    precioSinIva: 0,
    iva: 0,
    precioTotal: 0,
    estado: false,
  });

  const handleSubmitUpdateTarifa = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarTarifa(
      {
        id: tarifaSelected?.idTarifa || 0,
        data: {
          ...updateTarifaForm,
          estado: String(updateTarifaForm.estado) === "true",
        },
      },
      {
        onSuccess: () => {
          setIsOpenEditTarifa(false);
          setTarifaSelected(null);
        },
      },
    );
  };

  const columns: ColumnDef<Tarifa>[] = [
    {
      header: "Servicio",
      accessorKey: "idServicio.codigo",
      cell: ({ row }) => {
        return (
          <div className="flex flex-col text-left">
            <span className="text-base font-semibold">
              {row.original.idServicio.codigo}
            </span>
            <span className="text-sm">
              {row.original.idServicio.descripcion}
            </span>
          </div>
        );
      },
    },
    {
      header: "Periodo",
      accessorKey: "idPeriodo.nombre",
      cell: ({ row }) => {
        return (
          <div className="flex flex-col text-left whitespace-nowrap">
            <span className="text-base font-semibold">
              {row.original.idPeriodo.nombre}
            </span>
          </div>
        );
      },
    },
    {
      header: "Precio sin IVA",
      accessorKey: "precioSinIva",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-semibold">
            ${row.original.precioSinIva.toLocaleString("es-ES")}
          </span>
        );
      },
    },
    {
      header: "IVA",
      accessorKey: "iva",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-semibold">
            ${row.original.iva.toLocaleString("es-ES")}
          </span>
        );
      },
    },
    {
      header: "Precio total",
      accessorKey: "precioTotal",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-semibold">
            ${row.original.precioTotal.toLocaleString("es-ES")}
          </span>
        );
      },
    },
    {
      header: "Tipo de tarifa",
      accessorKey: "idTipoTarifa.nombre",
      cell: ({ row }) => {
        return (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-center text-sm whitespace-nowrap text-blue-600">
            {row.original.idTipoTarifa.nombre}
          </span>
        );
      },
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
          <div className="flex gap-2">
            <ButtonAction
              Icon={EyeIcon}
              label="Ver"
              onClick={() => {
                setIsOpenSeeTarifa(true);
              }}
            />
            <ButtonAction
              Icon={PencilIcon}
              label="Editar"
              onClick={() => {
                setIsOpenEditTarifa(true);
                setTarifaSelected(row.original);
                setUpdateTarifaForm({
                  idPeriodo: row.original.idPeriodo.idPeriodo,
                  idServicio: row.original.idServicio.idServicio,
                  idTipoTarifa: row.original.idTipoTarifa.idTipoTarifa,
                  precioSinIva: row.original.precioSinIva,
                  iva: row.original.iva,
                  precioTotal: row.original.precioTotal,
                  estado: row.original.estado,
                });
              }}
            />
            <ButtonAction
              Icon={TrashIcon}
              label="Eliminar"
              onClick={() => {
                setIsOpenDeleteTarifa(true);
                setTarifaSelected(row.original);
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
      <div className="flex items-center justify-between gap-8">
        <div className="flex w-full flex-col gap-2">
          <h1 className="text-3xl font-bold">
            {" "}
            Periodo {periodo?.data?.anioInicio}{" "}
            <span
              className={`ml-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                periodo?.data?.periodoActivoFacturacion
                  ? "bg-green-200 text-green-700"
                  : "bg-red-200 text-red-700"
              }`}
            >
              {periodo?.data?.periodoActivoFacturacion
                ? "Activo para facturación"
                : "Inactivo para facturación"}
            </span>
          </h1>
          <h1 className="text-base font-semibold text-gray-600">
            {periodo?.data?.nombre}
          </h1>
        </div>
        <div className="flex justify-end gap-2">
          <ButtonAction
            Icon={ArrowLeftIcon}
            label="Volver"
            onClick={() => {
              navigate({
                to: "/dashboard/tarifas/periodo",
              });
            }}
          />
          <ButtonAction
            Icon={SettingsIcon}
            label="Configurar Servicios para este periodo"
            onClick={() => {
              navigate({
                to: "/dashboard/tarifas/configurar-servicios/$id-periodo",
                params: {
                  "id-periodo": idPeriodoParam,
                },
              });
            }}
          />
        </div>
      </div>
      <Table
        columns={columns}
        data={tarifas?.data || []}
        enablePagination={true}
        enableSorting={true}
        pageSize={10}
        enableFiltering={true}
      />

      {/* TODO: mostrar datos de la tarifa */}
      <SimpleModal
        isOpen={isOpenSeeTarifa}
        onClose={() => setIsOpenSeeTarifa(false)}
        title="Ver Tarifa"
        size="xl"
      >
        <div className="flex flex-col gap-4"></div>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditTarifa}
        onClose={() => setIsOpenEditTarifa(false)}
        title="Editar Tarifa"
        size="xl"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmitUpdateTarifa}
        >
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Selección de Periodo y Servicio */}
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-lg font-medium text-gray-900">
                  Periodo y Servicio
                </h3>
                <InputSelect
                  label="Tipo de tarifa"
                  options={
                    tiposTarifa?.data?.map((tipo) => ({
                      id: tipo.idTipoTarifa,
                      descripcion: tipo.nombre,
                    })) || []
                  }
                  placeholder="Seleccione un tipo de tarifa"
                  id="idTipoTarifa"
                  value={updateTarifaForm.idTipoTarifa?.toString() || ""}
                  onChange={handleChangeUpdateTarifa}
                />
                <InputSelectStateBoolean
                  label="Estado"
                  id="estado"
                  value={updateTarifaForm.estado?.toString() || ""}
                  onChange={handleChangeUpdateTarifa}
                  placeholder="Seleccione un estado"
                />

                {/* <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="estado"
                        checked={estado}
                        onChange={(e) => setEstado(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="estado" className="text-sm text-gray-700">
                        Tarifa Activa
                    </label>
                  </div> */}
              </div>

              {/* Información de Precios */}
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-lg font-medium text-gray-900">
                  Información de Precios
                </h3>
                <InputForm
                  label="Precio sin IVA"
                  id="precioSinIva"
                  value={updateTarifaForm.precioSinIva?.toString() || ""}
                  onChange={handleChangeUpdateTarifa}
                  type="number"
                  placeholder="0.00"
                  required={false}
                />
                <InputForm
                  label="IVA"
                  id="iva"
                  value={updateTarifaForm.iva?.toString() || ""}
                  onChange={handleChangeUpdateTarifa}
                  type="number"
                  placeholder="0.00"
                  required={false}
                />
                <InputForm
                  label="Precio total"
                  id="precioTotal"
                  value={updateTarifaForm.precioTotal?.toString() || ""}
                  onChange={handleChangeUpdateTarifa}
                  type="number"
                  placeholder="0.00"
                  required={false}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsOpenEditTarifa(false);
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-auto">
              {isLoadingActualizarTarifa ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </form>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDeleteTarifa}
        text="¿Estás seguro de querer eliminar esta tarifa?"
        onDelete={() => {
          eliminarTarifa(tarifaSelected?.idTarifa || 0, {
            onSuccess: () => {
              setIsOpenDeleteTarifa(false);
              setTarifaSelected(null);
            },
          });
        }}
        onClose={() => setIsOpenDeleteTarifa(false)}
      />
    </Section>
  );
}
