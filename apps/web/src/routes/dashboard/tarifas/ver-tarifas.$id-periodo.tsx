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
  ChevronDown,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Tarifa } from "../../../api/types/periodo";
import {
  usePeriodoById,
  useTarifas,
} from "../../../api/queryFunctions/tarifas";
import { StateLabel } from "../../../components/common/StateLabel";
import { useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import Button from "../../../components/common/Button";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";

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
  console.log(idPeriodoParam);
  // Estados
  const [isOpenAddTarifa, setIsOpenAddTarifa] = useState(false);
  const [isOpenSeeTarifa, setIsOpenSeeTarifa] = useState(false);
  const [isOpenEditTarifa, setIsOpenEditTarifa] = useState(false);
  const [isOpenDeleteTarifa, setIsOpenDeleteTarifa] = useState(false);
  const [tarifaSelected, setTarifaSelected] = useState<Tarifa | null>(null);
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [idServicio, setIdServicio] = useState<number | null>(null);
  const [idTipoTarifa, setIdTipoTarifa] = useState<number | null>(null);
  const [estado, setEstado] = useState<boolean>(false);
  const [precioSinIva, setPrecioSinIva] = useState<number | null>(null);
  const [iva, setIva] = useState<number | null>(null);
  const [precioTotal, setPrecioTotal] = useState<number | null>(null);
  // Queries y Mutaciones
  // const { data: tarifas } = useTarifas(Number(idPeriodoParam));
  // console.log(tarifas?.data);

  const sampelData: Tarifa[] = [
    {
      idTarifa: 1,
      idPeriodo: {
        idPeriodo: 1,
        nombre: "Periodo 2024-Q1",
        mesInicio: 1,
        anioInicio: 2024,
        mesFin: 3,
        anioFin: 2024,
        fechaInicio: "2024-01-01",
        fechaFin: "2024-03-31",
        estado: true,
        periodoActivoFacturacion: true,
        tarifas: [],
      },
      idServicio: {
        idServicio: 1,
        codigo: "SRV001",
        descripcion: "Servicio de Vigilancia Diurna",
        idTipoServicio: {
          idTipoServicio: 1,
          nombre: "Vigilancia",
          descripcion: "Servicios de seguridad y vigilancia",
          requierePersonal: true,
          estado: true,
        },
        idTipoDuracion: {
          idTipoDuracion: 1,
          descripcion: "Por horas",
          estado: true,
          servicios: [],
        },
        idTipoHorarioDescripcion: {
          idTipoHorarioDescripcion: 1,
          descripcion: "Horario diurno",
          estado: true,
          servicios: [],
          horarios: [],
        },
        horasFijas: 8,
        horasMinimas: 4,
        horasMaximas: 12,
        estado: true,
        tarifas: [],
      },
      idTipoTarifa: {
        idTipoTarifa: 1,
        nombre: "Mensual",
        descripcion: "Tarifa mensual",
        idTipoUnidadTiempo: {
          descripcion: "Horas",
          estado: true,
          idTipoUnidadTiempo: 1,
          requiereTiempo: true,
        },
        cantidadTiempo: 1,
      },
      precioSinIva: 25000,
      iva: 4750,
      precioTotal: 29750,
      estado: true,
      fechaCreacion: "2024-01-15T10:30:00Z",
      fechaActualizacion: "2024-01-15T10:30:00Z",
    },
    {
      idTarifa: 2,
      idPeriodo: {
        idPeriodo: 1,
        nombre: "Periodo 2024-Q1",
        mesInicio: 1,
        anioInicio: 2024,
        mesFin: 3,
        anioFin: 2024,
        fechaInicio: "2024-01-01",
        fechaFin: "2024-03-31",
        estado: true,
        periodoActivoFacturacion: true,
        tarifas: [],
      },
      idServicio: {
        idServicio: 2,
        codigo: "SRV002",
        descripcion: "Servicio de Vigilancia Nocturna",
        idTipoServicio: {
          idTipoServicio: 1,
          nombre: "Vigilancia",
          descripcion: "Servicios de seguridad y vigilancia",
          requierePersonal: true,
          estado: true,
        },
        idTipoDuracion: {
          idTipoDuracion: 1,
          descripcion: "Por horas",
          estado: true,
          servicios: [],
        },
        idTipoHorarioDescripcion: {
          idTipoHorarioDescripcion: 2,
          descripcion: "Horario nocturno",
          estado: true,
          servicios: [],
          horarios: [],
        },
        horasFijas: 12,
        horasMinimas: 8,
        horasMaximas: 16,
        estado: true,
        tarifas: [],
      },
      idTipoTarifa: {
        idTipoTarifa: 2,
        nombre: "Mensual",
        descripcion: "Tarifa mensual",
        idTipoUnidadTiempo: {
          descripcion: "Horas",
          estado: true,
          idTipoUnidadTiempo: 1,
          requiereTiempo: true,
        },
        cantidadTiempo: 1,
      },
      precioSinIva: 32000,
      iva: 6080,
      precioTotal: 38080,
      estado: true,
      fechaCreacion: "2024-01-15T11:00:00Z",
      fechaActualizacion: "2024-01-20T14:30:00Z",
    },
    {
      idTarifa: 3,
      idPeriodo: {
        idPeriodo: 2,
        nombre: "Periodo 2024-Q2",
        mesInicio: 4,
        anioInicio: 2024,
        mesFin: 6,
        anioFin: 2024,
        fechaInicio: "2024-04-01",
        fechaFin: "2024-06-30",
        estado: true,
        periodoActivoFacturacion: false,
        tarifas: [],
      },
      idServicio: {
        idServicio: 3,
        codigo: "SRV003",
        descripcion: "Servicio de Limpieza Integral",
        idTipoServicio: {
          idTipoServicio: 2,
          nombre: "Limpieza",
          descripcion: "Servicios de aseo y mantenimiento",
          requierePersonal: true,
          estado: true,
        },
        idTipoDuracion: {
          idTipoDuracion: 2,
          descripcion: "Por metros cuadrados",
          estado: true,
          servicios: [],
        },
        idTipoHorarioDescripcion: {
          idTipoHorarioDescripcion: 3,
          descripcion: "Horario flexible",
          estado: true,
          servicios: [],
          horarios: [],
        },
        horasFijas: 0,
        horasMinimas: 2,
        horasMaximas: 8,
        estado: true,
        tarifas: [],
      },
      idTipoTarifa: {
        idTipoTarifa: 3,
        nombre: "Por horas",
        descripcion: "Tarifa por horas",
        idTipoUnidadTiempo: {
          descripcion: "Horas",
          estado: true,
          idTipoUnidadTiempo: 2,
          requiereTiempo: false,
        },
      },
      precioSinIva: 1500,
      iva: 285,
      precioTotal: 1785,
      estado: true,
      fechaCreacion: "2024-03-25T09:15:00Z",
      fechaActualizacion: "2024-03-25T09:15:00Z",
    },
  ];

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
            <span className="text-sm">
              {row.original.idPeriodo.fechaInicio} -{" "}
              {row.original.idPeriodo.fechaFin}
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
            ${row.original.precioSinIva.toFixed(2)}
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
            ${row.original.iva.toFixed(2)}
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
            ${row.original.precioTotal.toFixed(2)}
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
        data={sampelData}
        enablePagination={true}
        enableSorting={true}
        pageSize={10}
        enableFiltering={true}
      />
      <SimpleModal
        isOpen={isOpenAddTarifa}
        onClose={() => setIsOpenAddTarifa(false)}
        title="Agregar Tarifa"
        size="xl"
      >
        <form className="flex flex-col gap-4">
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Selección de Periodo y Servicio */}
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-lg font-medium text-gray-900">
                  Periodo y Servicio
                </h3>

                <div>
                  <label
                    htmlFor="idPeriodo"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Periodo *
                  </label>
                  <div className="relative mt-1">
                    <select
                      id="idPeriodo"
                      value={idPeriodo || ""}
                      onChange={(e) => setIdPeriodo(Number(e.target.value))}
                      className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Seleccione un periodo...</option>
                      {sampelData
                        .filter((periodo) => periodo.idPeriodo.estado)
                        .map((periodo) => (
                          <option
                            key={periodo.idPeriodo.idPeriodo}
                            value={periodo.idPeriodo.idPeriodo}
                          >
                            {periodo.idPeriodo.nombre} (
                            {new Date(
                              periodo.idPeriodo.fechaInicio,
                            ).getFullYear()}{" "}
                            -{" "}
                            {new Date(periodo.idPeriodo.fechaFin).getFullYear()}
                            )
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="idServicio"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Servicio *
                  </label>
                  <div className="relative mt-1">
                    <select
                      id="idServicio"
                      value={idServicio || ""}
                      onChange={(e) => setIdServicio(Number(e.target.value))}
                      className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Seleccione un servicio...</option>
                      {sampelData
                        .filter((servicio) => servicio.idServicio.estado)
                        .map((servicio) => (
                          <option
                            key={servicio.idServicio.idServicio}
                            value={servicio.idServicio.idServicio}
                          >
                            {servicio.idServicio.codigo} -{" "}
                            {servicio.idServicio.descripcion}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="idTipoTarifa"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tipo de Tarifa *
                  </label>
                  <div className="relative mt-1">
                    <select
                      id="idTipoTarifa"
                      value={idTipoTarifa || ""}
                      onChange={(e) => setIdTipoTarifa(Number(e.target.value))}
                      className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Seleccione tipo de tarifa...</option>
                      {sampelData.map((tipo) => (
                        <option
                          key={tipo.idTipoTarifa.idTipoTarifa}
                          value={tipo.idTipoTarifa.idTipoTarifa}
                        >
                          {tipo.idTipoTarifa.nombre}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

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

                <div>
                  <label
                    htmlFor="precioSinIva"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Precio Sin IVA *
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      id="precioSinIva"
                      value={precioSinIva || ""}
                      onChange={(e) => setPrecioSinIva(Number(e.target.value))}
                      className="block w-full rounded-md border border-gray-300 py-2 pr-3 pl-8 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="iva"
                    className="block text-sm font-medium text-gray-700"
                  >
                    IVA (19%) *
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      id="iva"
                      value={iva || ""}
                      onChange={(e) => setIva(Number(e.target.value))}
                      className="block w-full rounded-md border border-gray-300 bg-gray-50 py-2 pr-3 pl-8 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      placeholder="0.00"
                      readOnly
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Se calcula automáticamente (19% del precio sin IVA)
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="precioTotal"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Precio Total *
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      id="precioTotal"
                      value={precioTotal || ""}
                      onChange={(e) => setPrecioTotal(Number(e.target.value))}
                      className="block w-full rounded-md border border-gray-300 bg-gray-50 py-2 pr-3 pl-8 font-bold shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      placeholder="0.00"
                      readOnly
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Precio sin IVA + IVA
                  </p>
                </div>

                {/* Información del servicio seleccionado */}
                {idServicio && (
                  <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 text-sm font-medium text-blue-900">
                      Información del Servicio
                    </h4>
                    {(() => {
                      const servicio = sampelData.find(
                        (s) => s.idServicio.idServicio === idServicio,
                      );
                      if (!servicio) return null;
                      return (
                        <div className="space-y-1 text-xs text-blue-800">
                          <p>
                            <span className="font-medium">Código:</span>{" "}
                            {servicio.idServicio.codigo}
                          </p>
                          <p>
                            <span className="font-medium">Tipo:</span>{" "}
                            {servicio.idServicio.idTipoServicio.nombre}
                          </p>
                          <p>
                            <span className="font-medium">Duración:</span>{" "}
                            {servicio.idServicio.idTipoDuracion.descripcion}
                          </p>
                          <p>
                            <span className="font-medium">Horario:</span>{" "}
                            {
                              servicio.idServicio.idTipoHorarioDescripcion
                                .descripcion
                            }
                          </p>
                          <p>
                            <span className="font-medium">Horas:</span>{" "}
                            {servicio.idServicio.horasMinimas} -{" "}
                            {servicio.idServicio.horasMaximas} hrs (Recomendado:{" "}
                            {servicio.idServicio.horasFijas} hrs)
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsOpenAddTarifa(false);
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-auto">
              {/* {true ? "Creando..." : "Crear"} */}
              Crear
            </Button>
          </div>
        </form>
      </SimpleModal>

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
        <form className="flex flex-col gap-4"></form>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDeleteTarifa}
        text="¿Estás seguro de querer eliminar esta tarifa?"
        onDelete={() => {}}
        onClose={() => setIsOpenDeleteTarifa(false)}
      />
    </Section>
  );
}
