import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { Section } from "../../../components/ui/dashboard/Section";
import {
  AlertCircle,
  ArrowLeftIcon,
  CheckCircle2,
  ChevronDown,
  Clock,
  PlusIcon,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { usePeriodoById } from "../../../api/queryFunctions/tarifas/periodo";
import {
  useServiciosByPeriodo,
  useTipoServicios,
} from "../../../api/queryFunctions/servicios";
import { InputPrice } from "../../../components/common/InputPrice";
import { useEffect, useRef, useState } from "react";
import {
  useCalcularPrecios,
  useGuardarTarifas,
} from "../../../api/queryFunctions/tarifas/tarifa";
import {
  useGuardarTarifasHora,
  useTarifasHoraByPeriodo,
} from "../../../api/queryFunctions/tarifas/tarifa-hora";
import type {
  CreateTarifaDto,
  CreateTarifaHoraDto,
} from "../../../api/dtos/tarifas";
import { toast } from "sonner";
import { priceFormat } from "../../../utils/PriceFormat";
import type { ServicioPrecioCalculado } from "../../../api/types/periodo";

// Interfaz para manejar, localmente, un servicio ya calculado/configurado (calculados y manuales
// se manejan de la misma forma en el front, la unica diferencia es si "calculado" viene en true o false)
interface ServicioConfigurado
  extends Omit<
    ServicioPrecioCalculado,
    | "costosDirectos"
    | "seguroVida"
    | "aui"
    | "costosDirectosSeguroVida"
    | "precioAntesIva"
    | "iva"
    | "precioTotal"
  > {
  costosDirectos: number | string;
  seguroVida: number | string;
  aui: number | string;
  costosDirectosSeguroVida: number;
  precioAntesIva: number;
  iva: number;
  precioTotal: number;
}

// Interfaz para manejar, localmente, las 4 filas editables de la tarifa hora de un periodo
interface TarifaHoraFila {
  idTarifaHora: number | null;
  idTarifaHoraDescripcion: number;
  nombre: string;
  costosDirectos: string;
  seguroVida: string;
  aui: string;
}

// Formatea un valor numerico (o string) con separador de miles, quitando comas previas
const formatMiles = (value: string) => {
  const raw = value.replace(/,/g, "");
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const soloNumero = (value: string | number) => Number(String(value).replace(/,/g, "")) || 0;

export const Route = createFileRoute(
  "/dashboard/tarifas/configurar-servicios/$id-periodo",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { "id-periodo": idPeriodoParam } = useParams({
    from: "/dashboard/tarifas/configurar-servicios/$id-periodo",
  });
  const idPeriodo = Number(idPeriodoParam);

  // Estados - servicios / precios
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    number[]
  >([]);
  const [serviciosConfigurados, setServiciosConfigurados] = useState<
    ServicioConfigurado[]
  >([]);
  const [mostrarSoloSeleccionados, setMostrarSoloSeleccionados] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipoServicio, setFiltroTipoServicio] = useState<number | null>(
    null,
  );

  // Estados - tarifa hora del periodo
  const [tarifaHoraRows, setTarifaHoraRows] = useState<TarifaHoraFila[]>([]);

  // Queries y mutaciones
  const { data: periodo } = usePeriodoById(idPeriodo);
  const { data: servicios } = useServiciosByPeriodo(idPeriodo);
  const { data: tiposServicios } = useTipoServicios();
  const { data: tarifasHoraData } = useTarifasHoraByPeriodo(idPeriodo);
  const { mutate: guardarTarifasHora, isPending: isLoadingGuardarTarifasHora } =
    useGuardarTarifasHora();
  const { mutate: calcularPrecios, isPending: isLoadingCalcularPrecios } =
    useCalcularPrecios();
  const { mutate: guardarTarifas, isPending: isLoadingGuardarTarifas } =
    useGuardarTarifas();

  // Sincronizar las filas editables de tarifa hora con lo que responde el backend para este periodo.
  // Solo se sincroniza una vez (la primera vez que llegan los datos): si se sincronizara en cada refetch
  // (ej. al recuperar el foco de la ventana, refetchOnWindowFocus esta activo globalmente) se perderia
  // lo que el usuario esté escribiendo.
  const tarifaHoraCargada = useRef(false);

  useEffect(() => {
    if (!tarifasHoraData?.data || tarifaHoraCargada.current) return;

    tarifaHoraCargada.current = true;

    setTarifaHoraRows(
      tarifasHoraData.data.map((th) => ({
        idTarifaHora: th.idTarifaHora,
        idTarifaHoraDescripcion: th.idTarifaHoraDescripcion.idTarifaHoraDescripcion,
        nombre: th.idTarifaHoraDescripcion.nombre,
        costosDirectos:
          th.costosDirectos != null ? formatMiles(String(th.costosDirectos)) : "",
        seguroVida:
          th.seguroVida != null ? formatMiles(String(th.seguroVida)) : "",
        aui: th.aui != null ? formatMiles(String(th.aui)) : "",
      })),
    );
  }, [tarifasHoraData?.data]);

  // Función para verificar si un servicio ya fue calculado/configurado
  const isServicioConfigurado = (idServicio: number) => {
    return serviciosConfigurados.some((sc) => sc.idServicio === idServicio);
  };

  // Función para obtener la configuración (precio calculado/manual) de un servicio
  const getServicioConfigurado = (idServicio: number) => {
    return serviciosConfigurados.find((sc) => sc.idServicio === idServicio);
  };

  // Función para obtener los datos completos de un servicio (tipo de servicio, requierePersonal, etc.),
  // que no vienen en la respuesta de calcular-precios
  const obtenerServicioCompleto = (idServicio: number) => {
    return servicios?.data?.data.find((s) => s.idServicio === idServicio);
  };

  // Función para editar un campo (costos directos, seguro vida o aui) de un servicio ya calculado/configurado
  // y recalcular el resto de los totales (aplica tanto a calculados como a manuales, ya que ambos son editables)
  const actualizarServicioConfigurado = (
    idServicio: number,
    campo: "costosDirectos" | "seguroVida" | "aui",
    valor: string,
  ) => {
    setServiciosConfigurados((prev) =>
      prev.map((sc) => {
        if (sc.idServicio !== idServicio) return sc;

        const actualizado = { ...sc, [campo]: formatMiles(valor) };

        const costosDirectos = soloNumero(actualizado.costosDirectos);
        const seguroVida = soloNumero(actualizado.seguroVida);
        const aui = soloNumero(actualizado.aui);

        const costosDirectosSeguroVida = costosDirectos + seguroVida;
        const precioAntesIva = costosDirectosSeguroVida + aui;
        const iva = Math.round(precioAntesIva * 0.19); // IVA del 19%
        const precioTotal = Math.round(precioAntesIva + iva);

        return {
          ...actualizado,
          costosDirectosSeguroVida,
          precioAntesIva,
          iva,
          precioTotal,
        };
      }),
    );
  };

  // Función para remover un servicio de la selección/configuración
  const removerServicioConfigurado = (idServicio: number) => {
    setServiciosConfigurados((prev) =>
      prev.filter((sc) => sc.idServicio !== idServicio),
    );
    setServiciosSeleccionados((prev) => prev.filter((id) => id !== idServicio));
  };

  // Función para calcular el precio de los servicios recién seleccionados (los que aún no se han calculado),
  // usando la tarifa hora del periodo. No se recalculan los que ya están configurados para no perder ediciones manuales.
  const handleCalcularPrecios = () => {
    const pendientes = serviciosSeleccionados.filter(
      (id) => !isServicioConfigurado(id),
    );

    if (pendientes.length === 0) {
      toast.error("No hay servicios nuevos seleccionados para calcular");
      return;
    }

    calcularPrecios(
      { idPeriodo, idsServicios: pendientes },
      {
        onSuccess: (response) => {
          if (
            (response.status !== 200 && response.status !== 201) ||
            !response.data
          ) {
            return;
          }

          const { calculados, manuales } = response.data;

          const nuevos: ServicioConfigurado[] = [...calculados, ...manuales].map(
            (item) => ({
              ...item,
              costosDirectos:
                item.costosDirectos != null
                  ? formatMiles(String(item.costosDirectos))
                  : "",
              seguroVida:
                item.seguroVida != null
                  ? formatMiles(String(item.seguroVida))
                  : "",
              aui: item.aui != null ? formatMiles(String(item.aui)) : "",
              costosDirectosSeguroVida: item.costosDirectosSeguroVida ?? 0,
              precioAntesIva: item.precioAntesIva ?? 0,
              iva: item.iva ?? 0,
              precioTotal: item.precioTotal ?? 0,
            }),
          );

          setServiciosConfigurados((prev) => [...prev, ...nuevos]);
        },
      },
    );
  };

  // Función para editar una fila de la tarifa hora del periodo
  const actualizarTarifaHoraRow = (
    idTarifaHoraDescripcion: number,
    campo: "costosDirectos" | "seguroVida" | "aui",
    valor: string,
  ) => {
    setTarifaHoraRows((prev) =>
      prev.map((row) =>
        row.idTarifaHoraDescripcion === idTarifaHoraDescripcion
          ? { ...row, [campo]: formatMiles(valor) }
          : row,
      ),
    );
  };

  // Función para guardar (upsert) las 4 tarifas por hora del periodo
  const handleGuardarTarifaHora = () => {
    const tarifas: CreateTarifaHoraDto[] = tarifaHoraRows.map((row) => ({
      idPeriodo,
      idTarifaHoraDescripcion: row.idTarifaHoraDescripcion,
      costosDirectos: soloNumero(row.costosDirectos),
      seguroVida: row.seguroVida ? soloNumero(row.seguroVida) : undefined,
      aui: soloNumero(row.aui),
    }));

    guardarTarifasHora({ idPeriodo, tarifas });
  };

  // Función para enviar las tarifas de los servicios al endpoint
  const handleAgregarServiciosSeleccionados = () => {
    if (serviciosConfigurados.length === 0) {
      toast.error("No hay servicios configurados para agregar");
      return;
    }

    // Validar que al menos un servicio tenga el precio completo (calculado o ingresado manualmente)
    const serviciosCompletos = serviciosConfigurados.filter(
      (sc) => sc.precioAntesIva > 0,
    );

    if (serviciosCompletos.length === 0) {
      toast.error(
        "Debe completar el precio (costos directos y aui) de al menos un servicio",
      );
      return;
    }

    // Crear el DTO para enviar al endpoint
    const tarifasData: CreateTarifaDto[] = serviciosCompletos.map((sc) => ({
      idPeriodo,
      idServicio: sc.idServicio,
      idTipoTarifa: sc.idTipoTarifa,
      precioAntesIva: sc.precioAntesIva,
      costosDirectos: soloNumero(sc.costosDirectos),
      seguroVida: soloNumero(sc.seguroVida),
      costosDirectosSeguroVida: sc.costosDirectosSeguroVida,
      aui: soloNumero(sc.aui),
      iva: sc.iva,
      precioTotal: sc.precioTotal,
    }));

    guardarTarifas(
      {
        idPeriodo,
        tarifas: tarifasData,
      },
      {
        onSuccess: () => {
          navigate({
            to: "/dashboard/tarifas/ver-tarifas/$id-periodo",
            params: {
              "id-periodo": idPeriodoParam as string,
            },
          });
        },
      },
    );
  };

  // Filtrar servicios según búsqueda y filtros
  const serviciosFiltrados =
    servicios?.data?.data.filter((servicio) => {
      const matchSearch =
        !searchTerm ||
        servicio.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.idTipoServicio?.descripcion
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchTipo =
        !filtroTipoServicio ||
        servicio.idTipoServicio?.idTipoServicio === filtroTipoServicio;

      const matchSeleccionados =
        !mostrarSoloSeleccionados ||
        serviciosSeleccionados.includes(servicio.idServicio);

      return matchSearch && matchTipo && matchSeleccionados;
    }) || [];

  return (
    <Section>
      <div className="flex items-center justify-between gap-8">
        <div className="flex w-full flex-col gap-2">
          <h1 className="flex flex-col gap-2 text-3xl font-bold lg:flex-row lg:items-center">
            {" "}
            Periodo {periodo?.data?.anioInicio}{" "}
            <p
              className={`ml-2 w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${periodo?.data?.periodoActivoFacturacion
                ? "bg-green-200 text-green-700"
                : "bg-red-200 text-red-700"
                }`}
            >
              {periodo?.data?.periodoActivoFacturacion
                ? "Activo para facturación"
                : "Inactivo para facturación"}
            </p>
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
            Icon={PlusIcon}
            label="Agregar Servicios seleccionados"
            onClick={handleAgregarServiciosSeleccionados}
            disabled={isLoadingGuardarTarifas}
          />
        </div>
      </div>

      {/* Tarifa Hora del periodo */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
              <Clock className="h-5 w-5 text-blue-600" />
              Tarifa Hora del Periodo
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Valor de la hora diurna, diurna dominical/festiva, nocturna y
              nocturna dominical/festiva. Se usa para calcular
              automáticamente el precio de los servicios diurnos/nocturnos.
            </p>
          </div>
          <ButtonAction
            Icon={PlusIcon}
            label="Guardar Tarifa Hora"
            onClick={handleGuardarTarifaHora}
            disabled={isLoadingGuardarTarifasHora || tarifaHoraRows.length === 0}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Tarifa Hora</th>
                <th className="px-6 py-3">Costos Directos *</th>
                <th className="px-6 py-3">Seguro de Vida</th>
                <th className="px-6 py-3">AUI *</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tarifaHoraRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-500">
                    No hay tarifas por hora configuradas para este periodo
                    todavía.
                  </td>
                </tr>
              ) : (
                tarifaHoraRows.map((row) => (
                  <tr key={row.idTarifaHoraDescripcion}>
                    <td className="px-6 py-3 font-medium text-gray-900 capitalize">
                      {row.nombre}
                    </td>
                    <td className="px-6 py-3">
                      <InputPrice
                        label=""
                        size="md"
                        value={row.costosDirectos}
                        onChange={(e) =>
                          actualizarTarifaHoraRow(
                            row.idTarifaHoraDescripcion,
                            "costosDirectos",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-6 py-3">
                      <InputPrice
                        label=""
                        size="md"
                        value={row.seguroVida}
                        onChange={(e) =>
                          actualizarTarifaHoraRow(
                            row.idTarifaHoraDescripcion,
                            "seguroVida",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-6 py-3">
                      <InputPrice
                        label=""
                        size="md"
                        value={row.aui}
                        onChange={(e) =>
                          actualizarTarifaHoraRow(
                            row.idTarifaHoraDescripcion,
                            "aui",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">
                Servicios Seleccionados: {serviciosSeleccionados.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">
                Servicios Calculados: {serviciosConfigurados.length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mostrarSoloSeleccionados"
                checked={mostrarSoloSeleccionados}
                onChange={(e) => setMostrarSoloSeleccionados(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="mostrarSoloSeleccionados"
                className="text-sm text-gray-700"
              >
                Mostrar solo seleccionados
              </label>
            </div>
            <ButtonAction
              Icon={PlusIcon}
              label="Calcular precios de seleccionados"
              onClick={handleCalcularPrecios}
              disabled={isLoadingCalcularPrecios}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar servicios por código, descripción o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="relative w-48">
            <select
              value={filtroTipoServicio || ""}
              onChange={(e) =>
                setFiltroTipoServicio(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todos los tipos</option>
              {tiposServicios?.data?.data.map((tipo) => (
                <option key={tipo.idTipoServicio} value={tipo.idTipoServicio}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Lista de servicios configurados */}
      {serviciosConfigurados.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">
              Servicios Configurados
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Servicios listos para ser agregados al período
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {serviciosConfigurados.map((sc) => {
              const servicioCompleto = obtenerServicioCompleto(sc.idServicio);

              return (
                <div key={sc.idServicio} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="font-medium text-gray-900">
                            {sc.codigo}
                          </span>
                          {servicioCompleto?.idTipoServicio?.descripcion && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              {servicioCompleto.idTipoServicio.descripcion}
                            </span>
                          )}
                          {servicioCompleto?.idTipoServicio?.requierePersonal && (
                            <UserCheck className="h-4 w-4 text-blue-500" />
                          )}
                          {sc.calculado ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              <CheckCircle2 className="h-3 w-3" /> Calculado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              <AlertCircle className="h-3 w-3" /> Manual
                            </span>
                          )}
                        </div>
                        <p className="mb-2 text-sm text-gray-600">
                          {sc.descripcion}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="font-semibold capitalize">
                            Tipo de Tarifa: {sc.tipoTarifa}
                          </span>
                          <span className="font-semibold">
                            Precio Antes de IVA: {priceFormat(sc.precioAntesIva)}
                          </span>
                          <span className="font-semibold">
                            IVA: {priceFormat(sc.iva)}
                          </span>
                          <span className="font-semibold">
                            Total: {priceFormat(sc.precioTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removerServicioConfigurado(sc.idServicio)}
                      className="ml-4 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Servicios Disponibles
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Seleccione los servicios que estarán disponibles en el periodo y
            use "Calcular precios de seleccionados" para obtener su precio
            (o ingréselo manualmente cuando el sistema no pueda calcularlo)
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {serviciosFiltrados.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No hay servicios disponibles con los filtros aplicados
            </div>
          ) : (
            serviciosFiltrados.map((item) => {
              const servicioConfig = getServicioConfigurado(item.idServicio);
              const seleccionado = serviciosSeleccionados.includes(
                item.idServicio,
              );

              return (
                <div key={item.idServicio} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setServiciosSeleccionados((prev) => [
                                ...prev,
                                item.idServicio,
                              ]);
                            } else {
                              removerServicioConfigurado(item.idServicio);
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="font-medium text-gray-900">
                            {item.codigo}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {item.idTipoServicio?.descripcion}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
                            {item.idTipoTarifa?.nombre}
                          </span>
                          {item.idTipoServicio?.requierePersonal && (
                            <UserCheck className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <p className="mb-2 text-sm text-gray-600">
                          {item.descripcion}
                        </p>

                        {seleccionado && !servicioConfig && (
                          <p className="mb-4 text-sm text-amber-600">
                            Seleccionado — use "Calcular precios de
                            seleccionados" para continuar.
                          </p>
                        )}

                        {servicioConfig && (
                          <>
                            <p className="mb-4 text-sm text-gray-500 italic">
                              {servicioConfig.mensaje}
                            </p>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <InputPrice
                                  label="Costos Directos:"
                                  size="full"
                                  value={servicioConfig.costosDirectos}
                                  onChange={(e) => {
                                    actualizarServicioConfigurado(
                                      item.idServicio,
                                      "costosDirectos",
                                      e.target.value,
                                    );
                                  }}
                                />
                                <InputPrice
                                  label="Seguro de Vida:"
                                  size="full"
                                  value={servicioConfig.seguroVida}
                                  onChange={(e) => {
                                    actualizarServicioConfigurado(
                                      item.idServicio,
                                      "seguroVida",
                                      e.target.value,
                                    );
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <InputPrice
                                  label="AUI:"
                                  size="full"
                                  value={servicioConfig.aui}
                                  onChange={(e) => {
                                    actualizarServicioConfigurado(
                                      item.idServicio,
                                      "aui",
                                      e.target.value,
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Section>
  );
}
