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
  DollarSign,
  EyeIcon,
  PencilIcon,
  Settings,
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
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { FormsModal } from "../../../components/ui/modals/FormsModal";

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
  const calcularPrecios = (precioBase: number) => {
    const iva = precioBase * 0.019; // IVA del 19%
    const precioTotal = precioBase + iva;
    return { iva, precioTotal };
  };

  const handleChangeUpdateTarifaPrecio = (value: number) => {
    const { iva, precioTotal } = calcularPrecios(Number(value));

    setUpdateTarifaForm({
      ...updateTarifaForm,
      precioSinIva: value,
      iva: iva,
      precioTotal: precioTotal,
    });
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
          <span className="text-center text-base font-medium text-green-700">
            $
            {row.original.precioSinIva?.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
            })}
          </span>
        );
      },
    },
    {
      header: "IVA",
      accessorKey: "iva",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-medium text-green-700">
            $
            {row.original.iva?.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
            })}
          </span>
        );
      },
    },
    {
      header: "Precio total",
      accessorKey: "precioTotal",
      cell: ({ row }) => {
        return (
          <span className="text-center text-base font-medium text-green-700">
            $
            {row.original.precioTotal?.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
            })}
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
                setTarifaSelected(row.original);
                console.log(row.original);
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
                  {tarifaSelected?.idTipoTarifa.nombre}
                </p>
                <p>
                  <span className="font-medium">Estado:</span>{" "}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      tarifaSelected?.estado
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
                  {new Date(tarifaSelected?.fechaCreacion || "").toLocaleString(
                    "es-ES",
                  )}
                </p>
                <p>
                  <span className="font-medium">Última Actualización:</span>{" "}
                  {new Date(
                    tarifaSelected?.fechaActualizacion || "",
                  ).toLocaleString("es-ES")}
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
                  {tarifaSelected?.idPeriodo.nombre}
                </p>
                <p>
                  <span className="font-medium">Fecha Inicio:</span>{" "}
                  {new Date(
                    tarifaSelected?.idPeriodo.fechaInicio || "",
                  ).toLocaleDateString("es-ES")}
                </p>
                <p>
                  <span className="font-medium">Fecha Fin:</span>{" "}
                  {new Date(
                    tarifaSelected?.idPeriodo.fechaFin || "",
                  ).toLocaleDateString("es-ES")}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Mes Inicio:</span>{" "}
                  {tarifaSelected?.idPeriodo.mesInicio}/
                  {tarifaSelected?.idPeriodo.anioInicio}
                </p>
                <p>
                  <span className="font-medium">Mes Fin:</span>{" "}
                  {tarifaSelected?.idPeriodo.mesFin}/
                  {tarifaSelected?.idPeriodo.anioFin}
                </p>
                <p>
                  <span className="font-medium">Activo para Facturación:</span>{" "}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      tarifaSelected?.idPeriodo.periodoActivoFacturacion
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tarifaSelected?.idPeriodo.periodoActivoFacturacion
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
                  {tarifaSelected?.idServicio.codigo}
                </p>
                <p>
                  <span className="font-medium">Descripción:</span>{" "}
                  {tarifaSelected?.idServicio.descripcion}
                </p>
                <p>
                  <span className="font-medium">Tipo de Servicio:</span>{" "}
                  {tarifaSelected?.idServicio.idTipoServicio?.descripcion}
                </p>
                <p>
                  <span className="font-medium">Tipo de Duración:</span>{" "}
                  {tarifaSelected?.idServicio.idTipoDuracion?.descripcion}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Tipo de Horario:</span>{" "}
                  {
                    tarifaSelected?.idServicio.idTipoHorarioDescripcion
                      ?.descripcion
                  }
                </p>
                <p>
                  <span className="font-medium">Estado del Servicio:</span>{" "}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      tarifaSelected?.idServicio.estado
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tarifaSelected?.idServicio.estado ? "Activo" : "Inactivo"}
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
                  $ {tarifaSelected?.precioSinIva?.toLocaleString("es-ES")}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">IVA (19%)</p>
                <p className="text-2xl font-bold whitespace-nowrap text-blue-600">
                  $ {tarifaSelected?.iva?.toLocaleString("es-ES")}
                </p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-900">
                  Precio Total
                </p>
                <p className="text-2xl font-bold whitespace-nowrap text-green-600">
                  $ {tarifaSelected?.precioTotal?.toLocaleString("es-ES")}
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
              </div>

              {/* Información de Precios */}
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-lg font-medium text-gray-900">
                  Información de Precios
                </h3>
                <InputPrice
                  size="full"
                  label="Precio Base:"
                  value={updateTarifaForm.precioSinIva?.toString() || ""}
                  onChange={(e) => handleChangeUpdateTarifaPrecio(e)}
                />
                <InputPrice
                  size="full"
                  label="Precio con IVA:"
                  value={updateTarifaForm.iva?.toString() || ""}
                  disabled
                  readOnly
                />
                <InputPrice
                  size="full"
                  label="Precio Total:"
                  value={updateTarifaForm.precioTotal?.toString() || ""}
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>
        </FormsModal>
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
