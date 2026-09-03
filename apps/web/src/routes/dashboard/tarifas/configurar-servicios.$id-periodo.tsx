import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { Section } from "../../../components/ui/dashboard/Section";
import { ArrowLeftIcon, Clock, PlusIcon, UserCheck } from "lucide-react";
import { usePeriodoById } from "../../../api/queryFunctions/tarifas/periodo";
import { useServiciosByPeriodo } from "../../../api/queryFunctions/servicios";
import { InputPrice } from "../../../components/common/InputPrice";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useGuardarTarifasHora,
  useTarifasHoraByPeriodo,
} from "../../../api/queryFunctions/tarifas/tarifa-hora";
import {
  useCalcularPrecios,
  useGuardarTarifas,
} from "../../../api/queryFunctions/tarifas/tarifa";
import type {
  CalcularPrecioServicioDto,
  CreateTarifaDto,
  CreateTarifaHoraDto,
} from "../../../api/dtos/tarifas";
import type { Servicio } from "../../../api/types/servicio";
import type { ServicioPrecioCalculado } from "../../../api/types/periodo";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../components/common/Table";
import { toast } from "sonner";
import { priceFormat } from "../../../utils/PriceFormat";

// Interfaz para manejar, localmente, las 5 filas editables de la tarifa hora de un periodo
interface TarifaHoraFila {
  idTarifaHora: number | null;
  idTarifaHoraDescripcion: number;
  nombre: string;
  costosDirectos: string;
}

// Columnas de desglose que se agregan a la tabla de servicios una vez que se calculan sus precios
// (respuesta de /tarifas/calcular-precios), en el mismo orden en el que vienen en esa respuesta
const COLUMNAS_PRECIO_CALCULADO: {
  campo: keyof Pick<
    ServicioPrecioCalculado,
    | "costosDirectos"
    | "seguroVida"
    | "costosDirectosSeguroVida"
    | "aui"
    | "precioAntesIva"
    | "iva"
    | "precioTotal"
  >;
  header: string;
}[] = [
  { campo: "costosDirectos", header: "Costos Directos" },
  { campo: "seguroVida", header: "Seguro de Vida" },
  { campo: "costosDirectosSeguroVida", header: "Costos Directos + Seguro Vida" },
  { campo: "aui", header: "AUI" },
  { campo: "precioAntesIva", header: "Precio Antes de IVA" },
  { campo: "iva", header: "IVA" },
  { campo: "precioTotal", header: "Precio Total" },
];

// De las columnas del desglose calculado, solo estas 3 son valores base editables (costosDirectosSeguroVida,
// precioAntesIva, iva y precioTotal quedan derivados de ellas, ver recalcularPrecioCalculado)
const CAMPOS_EDITABLES_PRECIO_CALCULADO = [
  "costosDirectos",
  "seguroVida",
  "aui",
] as const;

type CampoEditablePrecioCalculado = (typeof CAMPOS_EDITABLES_PRECIO_CALCULADO)[number];

const esCampoEditablePrecioCalculado = (
  campo: string,
): campo is CampoEditablePrecioCalculado =>
  (CAMPOS_EDITABLES_PRECIO_CALCULADO as readonly string[]).includes(campo);

// Recalcula el desglose completo de un servicio ya calculado a partir de sus 3 valores base (costosDirectos,
// seguroVida, aui), igual que calcularTotalesTarifa en el backend (mismo 1.9% de IVA, mismo redondeo hacia
// arriba) — se usa cuando el usuario edita a mano el resultado de /tarifas/calcular-precios antes de guardar
const recalcularPrecioCalculado = (
  actual: ServicioPrecioCalculado,
  campo: CampoEditablePrecioCalculado,
  nuevoValor: number,
): ServicioPrecioCalculado => {
  const costosDirectos = campo === "costosDirectos" ? nuevoValor : actual.costosDirectos;
  const seguroVida = campo === "seguroVida" ? nuevoValor : actual.seguroVida;
  const aui = campo === "aui" ? nuevoValor : actual.aui;

  const costosDirectosSeguroVida = Math.ceil(costosDirectos + seguroVida);
  const precioAntesIva = costosDirectosSeguroVida + aui;
  const iva = Math.ceil(precioAntesIva * 0.019); // IVA del 1.9%, igual que calcularTotalesTarifa en el backend
  const precioTotal = Math.ceil(precioAntesIva + iva);

  return {
    ...actual,
    costosDirectos,
    seguroVida,
    aui,
    costosDirectosSeguroVida,
    precioAntesIva,
    iva,
    precioTotal,
  };
};

// El precio de un servicio "Monitoreo de Alarmas", de tipo de tarifa "por servicio" (Recogida de dinero), o
// mensual de 8 horas, nunca se puede derivar de la tarifa por hora del periodo (no depende de una tarifa
// hora vigente, siempre es un valor propio de ese servicio/cliente): el costo directo se pide desde el
// inicio, antes de calcular siquiera. El resto de servicios (ver serviciosRequierenManual) se intentan
// calcular solos primero, y solo si el backend responde que no pudo se revela su campo manual.
const requiereCostosDirectosManualDesdeElInicio = (servicio: Servicio) =>
  servicio.idTipoServicio?.nombre === "Monitoreo de alarmas" ||
  servicio.idTipoTarifa?.nombre === "por servicio" ||
  (servicio.idTipoTarifa?.nombre === "mensual" && servicio.horasFijas === 8);

// Datos que las columnas de la tabla de servicios leen via context.table.options.meta (ver Table.tsx)
// en vez de por closure, para que `columnasServicios` pueda quedar memoizada/estable y no se pierda el
// foco del input de costo directo en cada tecla (ver flexRender: una funcion `cell` nueva en cada
// render se trata como un componente distinto y React remonta la celda).
interface ServiciosTableMeta {
  costosDirectosManual: Record<number, string>;
  onChangeCostoDirecto: (idServicio: number, valor: string) => void;
  preciosCalculados: Record<number, ServicioPrecioCalculado>;
  // Edita a mano (post-calculo) uno de los 3 valores base de un servicio ya calculado, recalculando el
  // resto del desglose (ver recalcularPrecioCalculado)
  onChangePrecioCalculado: (
    idServicio: number,
    campo: CampoEditablePrecioCalculado,
    valor: string,
  ) => void;
  // idServicio de los servicios que no son de los tipos conocidos de antemano (ver
  // requiereCostosDirectosManualDesdeElInicio) pero para los que /tarifas/calcular-precios ya respondio que
  // igual necesita el costo directo ingresado manualmente (ver handleCalcularPrecios). Se descubren despues
  // de intentar calcular, no se asumen por tipo
  serviciosRequierenManual: Set<number>;
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

  // Estados - tarifa hora del periodo
  const [tarifaHoraRows, setTarifaHoraRows] = useState<TarifaHoraFila[]>([]);

  // Estados - calculo de precios de los servicios disponibles. costosDirectosManual solo se usa para los
  // servicios en serviciosRequierenManual (ver handleCalcularPrecios). preciosCalculados se llena con la
  // respuesta de /tarifas/calcular-precios.
  const [costosDirectosManual, setCostosDirectosManual] = useState<
    Record<number, string>
  >({});
  const [preciosCalculados, setPreciosCalculados] = useState<
    Record<number, ServicioPrecioCalculado>
  >({});
  // idServicio de los servicios que ya se sabe (por un intento previo de calculo) que necesitan el costo
  // directo manual. Ningun servicio empieza aca: no se asume por tipo de servicio/tarifa quien lo necesita,
  // se descubre cuando /tarifas/calcular-precios lo rechaza (ver handleCalcularPrecios)
  const [serviciosRequierenManual, setServiciosRequierenManual] = useState<
    Set<number>
  >(new Set());

  // Queries y mutaciones
  const { data: periodo } = usePeriodoById(idPeriodo);
  const { data: servicios } = useServiciosByPeriodo(idPeriodo);
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
          th.precio != null ? formatMiles(String(th.precio)) : "",
      })),
    );
  }, [tarifasHoraData?.data]);

  // Función para editar una fila de la tarifa hora del periodo
  const actualizarTarifaHoraRow = (
    idTarifaHoraDescripcion: number,
    campo: "costosDirectos",
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

  // Función para guardar (upsert) las 5 tarifas por hora del periodo
  const handleGuardarTarifaHora = () => {
    const tarifas: CreateTarifaHoraDto[] = tarifaHoraRows.map((row) => ({
      idPeriodo,
      idTarifaHoraDescripcion: row.idTarifaHoraDescripcion,
      precio: soloNumero(row.costosDirectos),
    }));

    guardarTarifasHora({ idPeriodo, tarifas });
  };

  // Función para calcular el precio de todos los servicios disponibles del periodo, usando la tarifa
  // hora configurada arriba y el costo directo ingresado manualmente para los servicios que lo necesitan.
  // Dos formas de saber que un servicio lo necesita:
  // 1. De antemano, por su tipo (Monitoreo de Alarmas / "por servicio", ver
  //    requiereCostosDirectosManualDesdeElInicio): su campo ya esta visible desde que se entra a la pantalla.
  // 2. Descubierto: el resto de servicios se intentan calcular solos primero. El backend calcula el lote
  //    servicio por servicio y se detiene en el primero que no puede resolver automaticamente (no es
  //    parcial); su mensaje de error trae el codigo de ESE servicio entre parentesis (ver
  //    calcularPrecioServicio -> errorServicio en el backend). Se usa ese codigo para revelar el campo de
  //    costo directo manual justo de ese servicio (serviciosRequierenManual) y dejar que el usuario lo
  //    complete y vuelva a calcular; los servicios que ya habian calculado bien no se tocan.
  const handleCalcularPrecios = () => {
    const todosLosServicios = Object.values(serviciosPorTipo).flat();

    if (todosLosServicios.length === 0) {
      toast.error("No hay servicios disponibles para calcular");
      return;
    }

    const serviciosDto: CalcularPrecioServicioDto[] = todosLosServicios.map(
      (servicio) => ({
        idServicio: servicio.idServicio,
        ...(requiereCostosDirectosManualDesdeElInicio(servicio) ||
        serviciosRequierenManual.has(servicio.idServicio)
          ? {
              costosDirectos: soloNumero(
                costosDirectosManual[servicio.idServicio] || "",
              ),
            }
          : {}),
      }),
    );

    calcularPrecios(
      { idPeriodo, servicios: serviciosDto },
      {
        onSuccess: (response) => {
          if (
            (response.status !== 200 && response.status !== 201) ||
            !response.data
          ) {
            // El mensaje del backend es del tipo: Servicio "Descripcion" (codigo): debe ingresar el valor...
            const codigoFaltante = response.message?.match(/\(([^)]+)\)/)?.[1];
            const servicioFaltante = todosLosServicios.find(
              (s) => s.codigo === codigoFaltante,
            );

            if (servicioFaltante) {
              setServiciosRequierenManual((prev) => {
                const actualizado = new Set(prev);
                actualizado.add(servicioFaltante.idServicio);
                return actualizado;
              });
            }

            return;
          }

          setPreciosCalculados((prev) => {
            const actualizado = { ...prev };
            response.data!.forEach((item) => {
              actualizado[item.idServicio] = item;
            });
            return actualizado;
          });
        },
      },
    );
  };

  // Función para guardar en el periodo las tarifas de los servicios ya calculados (POST
  // /tarifas/guardar-tarifas). No se recalcula nada aca: se envían tal cual los valores que devolvió
  // /tarifas/calcular-precios (el backend los persiste directo, ver bulkCreate en tarifas.service.ts).
  const handleGuardarTarifas = () => {
    const calculados = Object.values(preciosCalculados);

    if (calculados.length === 0) {
      toast.error(
        "Debe calcular los precios de los servicios antes de guardar la tarifa",
      );
      return;
    }

    const tarifas: CreateTarifaDto[] = calculados.map((sc) => ({
      idPeriodo,
      idServicio: sc.idServicio,
      costosDirectos: sc.costosDirectos,
      seguroVida: sc.seguroVida,
      costosDirectosSeguroVida: sc.costosDirectosSeguroVida,
      aui: sc.aui,
      precioAntesIva: sc.precioAntesIva,
      iva: sc.iva,
      precioTotal: sc.precioTotal,
    }));

    guardarTarifas(
      { idPeriodo, tarifas },
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

  // Agrupa los servicios disponibles del periodo por tipo de servicio, igual que la vista de
  // Servicios (/dashboard/servicios), para mostrarlos como una tabla por grupo en vez de una lista plana.
  // El orden de cada grupo es fijo (código ascendente, orden natural: "0-1-9" antes que "0-1-10") y no es
  // interactivo, por eso se ordena aca en vez de dejarselo al sort de la tabla (ver enableSorting={false}).
  const serviciosPorTipo = useMemo(() => {
    const lista = servicios?.data?.data || [];

    const agrupados = lista.reduce(
      (acc, servicio) => {
        const tipo = servicio.idTipoServicio?.descripcion || "Sin tipo";

        if (!acc[tipo]) {
          acc[tipo] = [];
        }

        acc[tipo].push(servicio);

        return acc;
      },
      {} as Record<string, Servicio[]>,
    );

    Object.values(agrupados).forEach((grupo) =>
      grupo.sort((a, b) =>
        a.codigo.localeCompare(b.codigo, undefined, { numeric: true }),
      ),
    );

    return agrupados;
  }, [servicios?.data?.data]);

  // Solo se agrega la columna de Precio una vez que hay al menos un resultado de /tarifas/calcular-precios
  const huboCalculo = Object.keys(preciosCalculados).length > 0;

  // Memoizado y sin cerrar sobre costosDirectosManual/preciosCalculados (que cambian en cada tecla):
  // esos valores se leen en cada celda via context.table.options.meta (ver el prop `meta` mas abajo),
  // para que las funciones `cell` no cambien de referencia en cada render y no se pierda el foco del
  // input de costo directo (ver el comentario de ServiciosTableMeta arriba).
  const columnasServicios: ColumnDef<Servicio>[] = useMemo(() => {
    const columnas: ColumnDef<Servicio>[] = [
      {
        header: "Código",
        accessorKey: "codigo",
      },
      {
        header: "Descripción",
        accessorKey: "descripcion",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.descripcion}</span>
        ),
      },
      {
        header: "Costo Directo",
        cell: ({ row, table }) => {
          const servicio = row.original;
          const meta = table.options.meta as ServiciosTableMeta;

          // El campo manual aparece desde el inicio para Monitoreo de Alarmas / "por servicio" (siempre lo
          // requieren), o mas tarde para cualquier otro servicio que un intento previo de "Calcular precios"
          // ya haya determinado que tambien lo necesita (ver handleCalcularPrecios)
          if (
            !requiereCostosDirectosManualDesdeElInicio(servicio) &&
            !meta.serviciosRequierenManual.has(servicio.idServicio)
          ) {
            return <span className="text-gray-400">—</span>;
          }

          return (
            <InputPrice
              label=""
              size="md"
              value={meta.costosDirectosManual[servicio.idServicio] || ""}
              onChange={(e) =>
                meta.onChangeCostoDirecto(servicio.idServicio, e.target.value)
              }
            />
          );
        },
      },
    ];

    if (huboCalculo) {
      COLUMNAS_PRECIO_CALCULADO.forEach(({ campo, header }) => {
        columnas.push({
          header,
          cell: ({ row, table }) => {
            const meta = table.options.meta as ServiciosTableMeta;
            const calculado = meta.preciosCalculados[row.original.idServicio];

            if (!calculado) return <span className="text-gray-400">—</span>;

            // Costos directos, seguro de vida y aui son los 3 valores base editables una vez que el
            // servicio ya se calculo; el resto (costos directos + seguro vida, precio antes de iva, iva,
            // precio total) queda derivado de ellos, ver recalcularPrecioCalculado
            if (esCampoEditablePrecioCalculado(campo)) {
              return (
                <InputPrice
                  label=""
                  size="md"
                  value={formatMiles(String(calculado[campo]))}
                  onChange={(e) =>
                    meta.onChangePrecioCalculado(
                      row.original.idServicio,
                      campo,
                      e.target.value,
                    )
                  }
                />
              );
            }

            return (
              <span
                className={
                  campo === "precioTotal" ? "font-semibold text-green-700" : ""
                }
              >
                {priceFormat(calculado[campo])}
              </span>
            );
          },
        });
      });
    }

    return columnas;
  }, [huboCalculo]);

  // Separar la fila de "Seguro de Vida" (valor mensual) del resto de tarifas por hora
  // (valores diurnos/nocturnos) para poder mostrarlas como dos grupos distintos en la tabla
  const filaSeguroVida = tarifaHoraRows.find((row) =>
    row.nombre.toLowerCase().includes("seguro de vida"),
  );
  const filasHora = tarifaHoraRows.filter(
    (row) => !row.nombre.toLowerCase().includes("seguro de vida"),
  );

  // Renderiza una fila editable de la tabla de tarifa hora del periodo
  const renderTarifaHoraRow = (row: TarifaHoraFila) => (
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
    </tr>
  );

  // Actualiza el costo directo ingresado manualmente para un servicio. Se pasa a la tabla de servicios
  // via `meta` en vez de closure, ver columnasServicios.
  const actualizarCostoDirectoManual = (idServicio: number, valor: string) => {
    setCostosDirectosManual((prev) => ({
      ...prev,
      [idServicio]: formatMiles(valor),
    }));
  };

  // Edita a mano uno de los 3 valores base (costos directos, seguro de vida, aui) del resultado ya
  // calculado de un servicio, y recalcula el resto del desglose (costos directos + seguro vida, precio
  // antes de iva, iva, precio total). Solo aplica a servicios que ya tienen un resultado en preciosCalculados
  const actualizarPrecioCalculado = (
    idServicio: number,
    campo: CampoEditablePrecioCalculado,
    valor: string,
  ) => {
    setPreciosCalculados((prev) => {
      const actual = prev[idServicio];
      if (!actual) return prev;

      return {
        ...prev,
        [idServicio]: recalcularPrecioCalculado(actual, campo, soloNumero(valor)),
      };
    });
  };

  const serviciosTableMeta: ServiciosTableMeta = {
    costosDirectosManual,
    onChangeCostoDirecto: actualizarCostoDirectoManual,
    preciosCalculados,
    onChangePrecioCalculado: actualizarPrecioCalculado,
    serviciosRequierenManual,
  };

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
            label="Guardar tarifa"
            onClick={handleGuardarTarifas}
            disabled={
              isLoadingGuardarTarifas || Object.keys(preciosCalculados).length === 0
            }
          />
        </div>
      </div>

      {/* Tarifa Hora del periodo */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
              <Clock className="h-5 w-5 text-blue-600" />
              Valores para Servicio de Vigilancia y Escolta
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Valor de la hora diurna, diurna dominical/festiva, nocturna,
              nocturna dominical/festiva y seguro de vida. Se usa para
              calcular automáticamente el precio de los servicios
              diurnos/nocturnos.
            </p>
          </div>
          <ButtonAction
            Icon={PlusIcon}
            label="Guardar valores"
            onClick={handleGuardarTarifaHora}
            disabled={isLoadingGuardarTarifasHora || tarifaHoraRows.length === 0}
          />
        </div>

        {tarifaHoraRows.length === 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-2/5" />
                <col />
              </colgroup>
              <thead className="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Tarifa Hora</th>
                  <th className="px-6 py-3">Costos Directos *</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td colSpan={2} className="px-6 py-6 text-center text-gray-500">
                    No hay tarifas por hora configuradas para este periodo
                    todavía.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <>
            {filaSeguroVida && (
              <div className="overflow-x-auto border-b border-gray-200">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-2/5" />
                    <col />
                  </colgroup>
                  <thead className="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">Valor Seguro De Vida (Mensual)</th>
                      <th className="px-6 py-3">Valor Mensual *</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {renderTarifaHoraRow(filaSeguroVida)}
                  </tbody>
                </table>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-2/5" />
                  <col />
                </colgroup>
                <thead className="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">Tarifa Hora</th>
                    <th className="px-6 py-3">Costos Directos *</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filasHora.map((row) => renderTarifaHoraRow(row))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Servicios disponibles del periodo, agrupados por tipo de servicio (igual que /dashboard/servicios) */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Servicios Disponibles
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Los servicios de Monitoreo de Alarmas, el servicio "Recogida de
            dinero" y los servicios mensuales de 8 horas siempre requieren
            ingresar el costo directo manualmente antes de calcular. Para el
            resto, al hacer clic en "Calcular precios" se intenta calcular
            automáticamente a partir de la tarifa hora configurada arriba; si
            algún servicio no se puede calcular solo, aparecerá su campo de
            costo directo para ingresarlo manualmente y volver a calcular.
          </p>
        </div>
        <ButtonAction
          Icon={PlusIcon}
          label="Calcular precios"
          onClick={handleCalcularPrecios}
          disabled={isLoadingCalcularPrecios}
        />
      </div>

      <div className="flex flex-col gap-6">
        {Object.entries(serviciosPorTipo).map(([tipo, lista]) => (
          <div
            key={tipo}
            className="rounded-lg border border-blue-200 bg-blue-100/70 pt-2"
          >
            <h2 className="mb-2 w-fit rounded-lg p-2 px-4 text-xl font-medium text-blue-600">
              {tipo}
            </h2>
            <Table
              columns={columnasServicios}
              data={lista}
              enablePagination={false}
              enableSorting={false}
              meta={serviciosTableMeta}
            />
          </div>
        ))}

        {Object.keys(serviciosPorTipo).length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-8 text-center text-gray-500 shadow-sm">
            No hay servicios disponibles para este periodo.
          </div>
        )}
      </div>
    </Section>
  );
}
