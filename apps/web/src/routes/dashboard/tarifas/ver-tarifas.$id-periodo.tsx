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
  Calculator,
  Calendar,
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileSpreadsheet,
  Mail,
  Settings,
  SettingsIcon,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Tarifa } from "../../../api/types/periodo";
import {
  useActualizarTarifa,
  useDescargarExcel,
  useEliminarTarifa,
  useEnviarExcelPorCorreo,
  usePeriodoById,
  useTarifas,
  useTipoTarifa,
} from "../../../api/queryFunctions/tarifas";
import { StateLabel } from "../../../components/common/StateLabel";
import { useMemo, useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { useForm } from "react-hook-form";
import type { UpdateTarifaDto } from "../../../api/dtos";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputPrice } from "../../../components/common/InputPrice";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { priceCalculate, priceFormat } from "../../../utils/PriceFormat";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";
import { EnvioCorreos } from "../../../components/ui/modals/EnvioCorreos";

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
  const [isOpenSendExcel, setIsOpenSendExcel] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Queries y Mutaciones
  const { data: tarifas } = useTarifas(Number(idPeriodoParam));
  const { data: tiposTarifa } = useTipoTarifa();
  const { mutate: eliminarTarifa } = useEliminarTarifa();
  const { mutate: actualizarTarifa, isPending: isLoadingActualizarTarifa } =
    useActualizarTarifa();

  // Generacion de archivos
  const {
    mutate: enviarExcelPorCorreo,
    isPending: isLoadingEnviarExcelPorCorreo,
  } = useEnviarExcelPorCorreo();
  const { mutate: descargarExcel } = useDescargarExcel();

  // Formularios
  const {
    register,
    handleSubmit,
    reset,
  } = useForm<UpdateTarifaDto>({
    defaultValues: {
      idPeriodo: Number(idPeriodoParam),
      idServicio: 0,
      idTipoTarifa: 0,
      precioAntesIva: 0,
      aui: 0,
      costosDirectos: 0,
      seguroVida: 0,
      costosDirectosSeguroVida: 0,
      iva: 0,
      precioTotal: 0,
      estado: false,
    },
  });

  const onSubmitUpdate = (data: UpdateTarifaDto) => {
    const { iva, precioTotal, precioAntesIva, costosDirectosSeguroVida } =
      priceCalculate(
        Number(data.costosDirectos),
        Number(data.seguroVida),
        Number(data.aui),
      );
    actualizarTarifa(
      {
        id: tarifaSelected?.idTarifa || 0,
        data: {
          ...data,
          idTipoTarifa: Number(data.idTipoTarifa),
          iva,
          precioTotal,
          precioAntesIva,
          costosDirectosSeguroVida,
          estado: String(data.estado) === "true",
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

  const handleDownloadExcel = (idPeriodo: number) => {
    descargarExcel(idPeriodo);
  };

  const columns: ColumnDef<Tarifa>[] = [
    {
      header: "Servicio",
      accessorKey: "idServicio.codigo",
      cell: ({ row }) => {
        return (
          <div className="flex flex-col text-left">
            <span className="text-base font-semibold">
              {row.original.idServicio?.codigo || "-"}
            </span>
            <span className="text-sm">
              {row.original.idServicio?.descripcion || "-"}
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
              {row.original.idPeriodo?.nombre || "-"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Seguro de vida",
      accessorKey: "seguroVida",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-medium whitespace-nowrap text-green-700">
            {priceFormat(row.original.seguroVida || 0)}
          </span>
        );
      },
    },
    {
      header: "AUI",
      accessorKey: "aui",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-medium whitespace-nowrap text-green-700">
            {priceFormat(row.original.aui || 0)}
          </span>
        );
      },
    },
    {
      header: "Costos directos",
      accessorKey: "costosDirectos",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-medium whitespace-nowrap text-green-700">
            {priceFormat(row.original.costosDirectos || 0)}
          </span>
        );
      },
    },
    {
      header: "Costos directos + seguro de vida",
      accessorKey: "costosDirectosSeguroVida",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-medium whitespace-nowrap text-green-700">
            {priceFormat(row.original.costosDirectosSeguroVida || 0)}
          </span>
        );
      },
    },
    {
      header: "Precio sin IVA",
      accessorKey: "precioAntesIva",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-medium whitespace-nowrap text-green-700">
            {priceFormat(row.original.precioAntesIva || 0)}
          </span>
        );
      },
    },
    {
      header: "IVA",
      accessorKey: "iva",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-medium whitespace-nowrap text-green-700">
            {priceFormat(row.original.iva || 0)}
          </span>
        );
      },
    },
    {
      header: "Precio total",
      accessorKey: "precioTotal",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-medium whitespace-nowrap text-green-700">
            {priceFormat(row.original.precioTotal || 0)}
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
            {row.original.idTipoTarifa?.nombre || "-"}
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
          <MoreActionsButton
            menuId={`actions-${row.original.idTarifa}`}
            actions={[
              {
                label: "Ver",
                onClick: () => {
                  setIsOpenSeeTarifa(true);
                  setTarifaSelected(row.original);
                },
              },
              {
                label: "Editar",
                onClick: () => {
                  setIsOpenEditTarifa(true);
                  setTarifaSelected(row.original);
                  reset({
                    idPeriodo: row.original.idPeriodo?.idPeriodo || 0,
                    idServicio: row.original.idServicio?.idServicio || 0,
                    idTipoTarifa: row.original.idTipoTarifa?.idTipoTarifa || 0,
                    precioAntesIva: row.original.precioAntesIva,
                    iva: row.original.iva,
                    precioTotal: row.original.precioTotal,
                    costosDirectos: row.original.costosDirectos,
                    seguroVida: row.original.seguroVida || 0,
                    costosDirectosSeguroVida:
                      row.original.costosDirectosSeguroVida || 0,
                    aui: row.original.aui,
                    estado: row.original.estado,
                  });
                },
              },
              {
                label: "Eliminar",
                onClick: () => {
                  setIsOpenDeleteTarifa(true);
                  setTarifaSelected(row.original);
                },
              },
            ]}
          />
        );
      },
    },
  ];

  const serviciosData = useMemo(
    () => Object.entries(tarifas?.data || []),
    [tarifas?.data],
  );
  const hasServicios = serviciosData.length > 0;

  return (
    <Section>
      <div className="flex flex-col items-center justify-between gap-8">
        <div className="flex w-full flex-col gap-2">
          <h1 className="text-3xl font-bold">
            {" "}
            Periodo {periodo?.data?.anioInicio}{" "}
            <span
              className={`ml-2 rounded-full px-3 py-1.5 text-sm font-semibold ${periodo?.data?.periodoActivoFacturacion
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
        <div className="flex w-full flex-col justify-end gap-2 lg:flex-row">
          <ButtonAction
            Icon={ArrowLeftIcon}
            label="Volver"
            onClick={() => {
              navigate({
                to: "/dashboard/tarifas/periodo",
              });
            }}
          />
          {hasServicios && (
            <>
              <ButtonAction
                Icon={FileSpreadsheet}
                label="Descargar Excel"
                onClick={() => {
                  handleDownloadExcel(Number(idPeriodoParam));
                }}
                color="green-light"
              />
              <ButtonAction
                Icon={Mail}
                label="Enviar por correo"
                onClick={() => {
                  setIsOpenSendExcel(true);
                }}
                color="yellow-light"
              />
            </>
          )}
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

      <div className="flex flex-col gap-6">
        {!hasServicios ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
            <p className="text-base font-medium text-gray-600">
              No hay tarifas configuradas para este periodo.
            </p>
          </div>
        ) : (
          serviciosData.map(([key, value]: [string, any]) => {
            const isCollapsed = collapsedGroups.has(key);
            return (
              <div
                key={key}
                className="rounded-lg border border-blue-200 bg-blue-100/70 pt-2"
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 px-4 text-left transition-colors hover:bg-blue-200/50"
                  onClick={() => {
                    setCollapsedGroups((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) {
                        next.delete(key);
                      } else {
                        next.add(key);
                      }
                      return next;
                    });
                  }}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-5 w-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                  )}
                  <h2 className="text-xl font-medium text-blue-600">
                    {key}
                  </h2>
                </button>
                {!isCollapsed && (
                  <Table
                    columns={columns}
                    data={value || []}
                    pageSize={200}
                    enablePagination={false}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* TODO: mostrar datos de la tarifa */}
      <SimpleModal
        isOpen={isOpenSeeTarifa}
        onClose={() => setIsOpenSeeTarifa(false)}
        title="Ver detalles de la tarifa"
        size="2xl"
      >
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Información General */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Calculator className="h-5 w-5 text-blue-600" />
              Información General
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <p>
                  <span className="font-medium">ID Tarifa:</span>{" "}
                  {tarifaSelected?.idTarifa}
                </p>
                <p>
                  <span className="font-medium">Tipo de Tarifa:</span>{" "}
                  {tarifaSelected?.idTipoTarifa?.nombre || "-"}
                </p>
                <p>
                  <span className="font-medium">Estado:</span>{" "}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tarifaSelected?.estado
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {tarifaSelected?.estado ? "Activa" : "Inactiva"}
                  </span>
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Fecha Creación:</span>{" "}
                  {tarifaSelected?.fechaCreacion
                    ? new Date(tarifaSelected.fechaCreacion).toLocaleString("es-ES")
                    : "-"}
                </p>
                <p>
                  <span className="font-medium">Última Actualización:</span>{" "}
                  {tarifaSelected?.fechaActualizacion
                    ? new Date(tarifaSelected.fechaActualizacion).toLocaleString("es-ES")
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Información del Periodo */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-blue-600" />
              Periodo
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {tarifaSelected?.idPeriodo?.nombre || "-"}
                </p>
                <p>
                  <span className="font-medium">Fecha Inicio:</span>{" "}
                  {tarifaSelected?.idPeriodo?.fechaInicio
                    ? new Date(tarifaSelected.idPeriodo.fechaInicio).toLocaleDateString("es-ES")
                    : "-"}
                </p>
                <p>
                  <span className="font-medium">Fecha Fin:</span>{" "}
                  {tarifaSelected?.idPeriodo?.fechaFin
                    ? new Date(tarifaSelected.idPeriodo.fechaFin).toLocaleDateString("es-ES")
                    : "-"}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Mes Inicio:</span>{" "}
                  {tarifaSelected?.idPeriodo?.mesInicio}/
                  {tarifaSelected?.idPeriodo?.anioInicio}
                </p>
                <p>
                  <span className="font-medium">Mes Fin:</span>{" "}
                  {tarifaSelected?.idPeriodo?.mesFin}/
                  {tarifaSelected?.idPeriodo?.anioFin}
                </p>
                <p>
                  <span className="font-medium">Activo para Facturación:</span>{" "}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tarifaSelected?.idPeriodo?.periodoActivoFacturacion
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {tarifaSelected?.idPeriodo?.periodoActivoFacturacion
                      ? "Sí"
                      : "No"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Información del Servicio */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Settings className="h-5 w-5 text-blue-600" />
              Servicio
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <p>
                  <span className="font-medium">Código:</span>{" "}
                  {tarifaSelected?.idServicio?.codigo || "-"}
                </p>
                <p>
                  <span className="font-medium">Descripción:</span>{" "}
                  {tarifaSelected?.idServicio?.descripcion || "-"}
                </p>
                <p>
                  <span className="font-medium">Tipo de Servicio:</span>{" "}
                  {tarifaSelected?.idServicio?.idTipoServicio?.descripcion || "-"}
                </p>
                <p>
                  <span className="font-medium">Tipo de Duración:</span>{" "}
                  {tarifaSelected?.idServicio?.idTipoDuracion?.descripcion || "-"}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Tipo de Horario:</span>{" "}
                  {tarifaSelected?.idServicio?.idTipoHorarioDescripcion?.nombre || "-"}
                </p>
                <p>
                  <span className="font-medium">Estado del Servicio:</span>{" "}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tarifaSelected?.idServicio?.estado
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {tarifaSelected?.idServicio?.estado ? "Activo" : "Inactivo"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Información de Precios */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Precios
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">
                  Precio Sin IVA
                </p>
                <p className="text-2xl font-bold whitespace-nowrap text-blue-600">
                  {priceFormat(tarifaSelected?.precioAntesIva || 0)}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">IVA (19%)</p>
                <p className="text-2xl font-bold whitespace-nowrap text-blue-600">
                  {priceFormat(tarifaSelected?.iva || 0)}
                </p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-900">
                  Precio Total
                </p>
                <p className="text-2xl font-bold whitespace-nowrap text-green-600">
                  {priceFormat(tarifaSelected?.precioTotal || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditTarifa}
        onClose={() => {
          setIsOpenEditTarifa(false);
          setTarifaSelected(null);
        }}
        title="Editar Tarifa"
        size="xl"
      >
        <FormsModal
          updating={true}
          onCancel={() => {
            setIsOpenEditTarifa(false);
            setTarifaSelected(null);
          }}
          isLoading={isLoadingActualizarTarifa}
          onSubmit={handleSubmit(onSubmitUpdate)}
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
                    (Array.isArray(tiposTarifa?.data)
                      ? tiposTarifa.data
                      : (tiposTarifa?.data as any)?.data || []
                    ).map((tipo: any) => ({
                      id: tipo.idTipoTarifa,
                      descripcion: tipo.nombre,
                    })) || []
                  }
                  placeholder="Seleccione un tipo de tarifa"
                  id="idTipoTarifa"
                  {...register("idTipoTarifa", { valueAsNumber: true })}
                />
                <InputSelectStateBoolean
                  label="Estado"
                  id="estado"
                  placeholder="Seleccione un estado"
                  {...register("estado")}
                />
              </div>

              {/* Información de Precios */}
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-lg font-medium text-gray-900">
                  Información de Precios
                </h3>
                <InputPrice
                  size="full"
                  label="Costos Directos:"
                  id="costosDirectos"
                  {...register("costosDirectos")}
                />
                <InputPrice
                  size="full"
                  label="Seguro de Vida:"
                  id="seguroVida"
                  {...register("seguroVida")}
                />
                <InputPrice
                  size="full"
                  label="AUI:"
                  id="aui"
                  {...register("aui")}
                />
              </div>
            </div>
          </div>
        </FormsModal>
      </SimpleModal>

      <EnvioCorreos
        isOpen={isOpenSendExcel}
        setIsOpen={setIsOpenSendExcel}
        id={Number(idPeriodoParam)}
        mutationEmail={enviarExcelPorCorreo}
        envioCorreoPending={isLoadingEnviarExcelPorCorreo}
      />

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
