import { createFileRoute } from "@tanstack/react-router";
import { getYear, subMonths, subYears } from "date-fns";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownIcon,
  ArrowUpIcon,
  BarChart3,
  MinusIcon,
  RefreshCw,
  Search,
} from "lucide-react";
import { Section } from "../../../components/ui/dashboard/Section";
import { InputSelect } from "../../../components/common/InputSelect";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { FiltroTiposServicio } from "../../../components/common/FiltroTiposServicio";
import { useClientes } from "../../../api/queryFunctions/clientes";
import { useCompararLiquidacionesCliente } from "../../../api/queryFunctions/liquidaciones";
import type { CompararLiquidacionesClienteDto } from "../../../api/dtos/liquidaciones";
import type {
  DiferenciaComparacion,
  DiferenciaMetrica,
  PeriodoComparacion,
  TipoServicioFiltro,
} from "../../../api/types/liquidaciones";
import { priceFormat } from "../../../utils/PriceFormat";
import {
  serializarTiposServicio,
  TIPOS_SERVICIO_FILTRO,
} from "../../../utils/tiposServicio";

export const Route = createFileRoute(
  "/dashboard/liquidaciones/comparar-cliente",
)({
  component: RouteComponent,
});

const monthsOptions = [
  { id: 1, descripcion: "Enero" },
  { id: 2, descripcion: "Febrero" },
  { id: 3, descripcion: "Marzo" },
  { id: 4, descripcion: "Abril" },
  { id: 5, descripcion: "Mayo" },
  { id: 6, descripcion: "Junio" },
  { id: 7, descripcion: "Julio" },
  { id: 8, descripcion: "Agosto" },
  { id: 9, descripcion: "Septiembre" },
  { id: 10, descripcion: "Octubre" },
  { id: 11, descripcion: "Noviembre" },
  { id: 12, descripcion: "Diciembre" },
];

const yearsOptions = Array.from({ length: 10 }, (_, i) => {
  const year = getYear(subYears(new Date(), i));
  return { id: year, descripcion: year.toString() };
});

const hoy = new Date();
const mesAnterior = subMonths(hoy, 1);

const nombreMes = (mes: number) =>
  monthsOptions.find((m) => m.id === mes)?.descripcion ?? String(mes);

const metricas: {
  clave: keyof DiferenciaComparacion;
  label: string;
  esMoneda: boolean;
}[] = [
  { clave: "cantidadGrupos", label: "Grupos (facturas)", esMoneda: false },
  { clave: "cantidadOrdenes", label: "Órdenes", esMoneda: false },
  {
    clave: "cantidadLiquidacionesOrdenes",
    label: "Liquidaciones de órdenes",
    esMoneda: false,
  },
  { clave: "cantidadAdicionales", label: "Adicionales", esMoneda: false },
  { clave: "totalAntesIva", label: "Total antes de IVA", esMoneda: true },
  { clave: "totalIva", label: "IVA", esMoneda: true },
  { clave: "totalConIva", label: "Total con IVA", esMoneda: true },
];

const DiferenciaBadge = ({
  metrica,
  esMoneda,
}: {
  metrica: DiferenciaMetrica;
  esMoneda: boolean;
}) => {
  const { valor } = metrica;
  const texto = esMoneda ? priceFormat(valor) : String(valor);
  if (valor > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        <ArrowUpIcon className="h-3 w-3" />+{texto}
      </span>
    );
  }
  if (valor < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        <ArrowDownIcon className="h-3 w-3" />
        {texto}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
      <MinusIcon className="h-3 w-3" />
      {texto}
    </span>
  );
};

const PorcentajeTexto = ({ porcentaje }: { porcentaje: number | null }) => {
  if (porcentaje === null) {
    return <span className="text-xs font-medium text-gray-400">N/A</span>;
  }
  const color =
    porcentaje > 0
      ? "text-green-700"
      : porcentaje < 0
        ? "text-red-700"
        : "text-gray-500";
  return (
    <span className={`text-sm font-semibold ${color}`}>
      {porcentaje > 0 ? "+" : ""}
      {porcentaje}%
    </span>
  );
};

const PeriodoCard = ({
  titulo,
  periodo,
  acento,
}: {
  titulo: string;
  periodo: PeriodoComparacion;
  acento: "blue" | "purple";
}) => {
  const estilos =
    acento === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-600"
      : "border-purple-200 bg-purple-50 text-purple-600";
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className={`border-b p-4 ${estilos}`}>
        <p className="text-xs font-semibold tracking-wide uppercase">
          {titulo}
        </p>
        <p className="mt-1 text-lg font-bold text-gray-900">
          {nombreMes(periodo.mes)} {periodo.anio}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 text-sm">
        <Dato label="Grupos (facturas)" valor={periodo.cantidadGrupos} />
        <Dato label="Órdenes" valor={periodo.cantidadOrdenes} />
        <Dato
          label="Liquidaciones de órdenes"
          valor={periodo.cantidadLiquidacionesOrdenes}
        />
        <Dato label="Adicionales" valor={periodo.cantidadAdicionales} />
      </div>

      <div className="space-y-1 border-t border-gray-100 px-4 py-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Total antes de IVA</span>
          <span className="font-medium text-gray-800">
            {priceFormat(periodo.totalAntesIva)}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>IVA</span>
          <span className="font-medium text-gray-800">
            {priceFormat(periodo.totalIva)}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Total con IVA</span>
          <span className="text-base font-semibold text-green-600">
            {priceFormat(periodo.totalConIva)}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 p-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
          Grupos de liquidación
        </p>
        {periodo.grupos.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 py-4 text-center text-sm text-gray-400">
            Sin grupos aprobados en este mes.
          </p>
        ) : (
          <ul className="space-y-2">
            {periodo.grupos.map((grupo) => (
              <li
                key={grupo.idGrupoLiquidacion}
                className="rounded-md border border-gray-200 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">
                    {grupo.descripcion}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(grupo.fechaCreacion).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {grupo.cantidadOrdenes} órdenes ·{" "}
                  {grupo.cantidadAdicionales} adicionales
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-gray-600">
                  <span>
                    Antes de IVA: {priceFormat(grupo.totalAntesIva)}
                  </span>
                  <span>IVA: {priceFormat(grupo.totalIva)}</span>
                  <span className="font-semibold text-green-600">
                    Total: {priceFormat(grupo.totalConIva)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const Dato = ({ label, valor }: { label: string; valor: number }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-xl font-bold text-gray-900">{valor}</p>
  </div>
);

function RouteComponent() {
  const [cliente, setCliente] = useState<string>("");
  const [anioA, setAnioA] = useState<string>(
    getYear(mesAnterior).toString(),
  );
  const [mesA, setMesA] = useState<string>(
    (mesAnterior.getMonth() + 1).toString(),
  );
  const [anioB, setAnioB] = useState<string>(getYear(hoy).toString());
  const [mesB, setMesB] = useState<string>((hoy.getMonth() + 1).toString());
  const [tipos, setTipos] =
    useState<TipoServicioFiltro[]>(TIPOS_SERVICIO_FILTRO);
  const [consulta, setConsulta] =
    useState<CompararLiquidacionesClienteDto | null>(null);

  const { data: clientes } = useClientes();
  const clientesOptions =
    clientes?.data?.data?.map((c) => ({
      id: c.idCliente,
      descripcion: c.nombre,
    })) ?? [];

  const parametros: CompararLiquidacionesClienteDto = consulta ?? {
    idCliente: 0,
    anioA: 0,
    mesA: 0,
    anioB: 0,
    mesB: 0,
    tiposServicio: "",
  };
  const {
    data: comparacionData,
    isFetching,
    isError,
    error,
  } = useCompararLiquidacionesCliente(parametros, consulta !== null);

  const comparacion = comparacionData?.data;
  const tiposSerializados = serializarTiposServicio(tipos);
  const puedeBuscar = Number(cliente) > 0 && tiposSerializados !== "";
  const aDespuesDeB =
    Number(anioA) * 100 + Number(mesA) > Number(anioB) * 100 + Number(mesB);

  const buscar = () => {
    if (!puedeBuscar) return;
    setConsulta({
      idCliente: Number(cliente),
      anioA: Number(anioA),
      mesA: Number(mesA),
      anioB: Number(anioB),
      mesB: Number(mesB),
      tiposServicio: tiposSerializados,
    });
  };

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Comparar liquidaciones de un cliente
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Compara lo liquidado a un cliente entre dos meses. Solo se tienen
            en cuenta los grupos aprobados.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="max-w-xl">
              <InputSelect
                label="Cliente"
                placeholder="Selecciona un cliente"
                id="compararCliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                options={clientesOptions}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-md border border-blue-200 p-4">
                <p className="mb-3 text-sm font-semibold text-blue-600">
                  Mes A (base)
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="min-w-40 flex-1">
                    <InputSelect
                      label="Año"
                      placeholder="Selecciona un año"
                      id="anioA"
                      value={anioA}
                      onChange={(e) => setAnioA(e.target.value)}
                      options={yearsOptions}
                    />
                  </div>
                  <div className="min-w-40 flex-1">
                    <InputSelect
                      label="Mes"
                      placeholder="Selecciona un mes"
                      id="mesA"
                      value={mesA}
                      onChange={(e) => setMesA(e.target.value)}
                      options={monthsOptions}
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-purple-200 p-4">
                <p className="mb-3 text-sm font-semibold text-purple-600">
                  Mes B (comparar)
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="min-w-40 flex-1">
                    <InputSelect
                      label="Año"
                      placeholder="Selecciona un año"
                      id="anioB"
                      value={anioB}
                      onChange={(e) => setAnioB(e.target.value)}
                      options={yearsOptions}
                    />
                  </div>
                  <div className="min-w-40 flex-1">
                    <InputSelect
                      label="Mes"
                      placeholder="Selecciona un mes"
                      id="mesB"
                      value={mesB}
                      onChange={(e) => setMesB(e.target.value)}
                      options={monthsOptions}
                    />
                  </div>
                </div>
              </div>
            </div>

            {aDespuesDeB && (
              <p className="flex items-center gap-2 text-sm font-medium text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                El mes A es posterior al mes B. La diferencia siempre se
                calcula como B − A.
              </p>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4">
              <FiltroTiposServicio value={tipos} onChange={setTipos} />
              <ButtonAction
                type="button"
                onClick={buscar}
                disabled={!puedeBuscar || isFetching}
                Icon={Search}
                label={isFetching ? "Buscando..." : "Buscar"}
              />
            </div>
          </div>
        </div>

        {isFetching && (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm">Cargando comparación...</span>
          </div>
        )}

        {!isFetching && isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message || "Error al comparar las liquidaciones del cliente"}
          </div>
        )}

        {!isFetching && !isError && comparacion && (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-lg font-semibold text-gray-900">
                {comparacion.cliente.nombre}
              </p>
              <p className="text-sm text-gray-500">
                NIT: {comparacion.cliente.numeroIdentificacion}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PeriodoCard
                titulo="Mes A"
                periodo={comparacion.periodoA}
                acento="blue"
              />
              <PeriodoCard
                titulo="Mes B"
                periodo={comparacion.periodoB}
                acento="purple"
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              <h2 className="border-b border-gray-200 p-4 text-lg font-semibold text-gray-900">
                Diferencia (B − A)
              </h2>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-2">Métrica</th>
                    <th className="px-4 py-2">Valor</th>
                    <th className="px-4 py-2">Porcentaje</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.map(({ clave, label, esMoneda }) => (
                    <tr key={clave} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-700">
                        {label}
                      </td>
                      <td className="px-4 py-2">
                        <DiferenciaBadge
                          metrica={comparacion.diferencia[clave]}
                          esMoneda={esMoneda}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <PorcentajeTexto
                          porcentaje={comparacion.diferencia[clave].porcentaje}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!consulta && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
            <BarChart3 className="h-12 w-12" />
            <p className="text-sm">
              Selecciona un cliente y dos meses para ver la comparación.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}
