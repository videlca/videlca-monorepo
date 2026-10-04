import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import MuiTable from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { PageHeader } from "../../../components/ui/common/PageHeader";
import { PeriodoFacturacionChip } from "../../../components/ui/dashboard/tarifas/PeriodoFacturacionChip";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { Section } from "../../../components/ui/dashboard/Section";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
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

// Interfaz para manejar, localmente, las 5 filas editables de la tarifa hora de un periodo
interface TarifaHoraFila {
  idTarifaHora: number | null;
  idTarifaHoraDescripcion: number;
  nombre: string;
  costosDirectos: string;
}

// Columnas de desglose que se agregan a la tabla de servicios una vez que se calculan sus precios
// (respuesta de /tarifas/calcular-precios), en el mismo orden en el que vienen en esa respuesta.
// "costosDirectos" no esta acá: ya se muestra en la columna "Costo Directo" de mas a la izquierda, que
// pasa a mostrar (editable) el valor calculado una vez que hay resultado — listarla acá tambien duplicaba
// la columna.
const COLUMNAS_PRECIO_CALCULADO: {
  campo: keyof Pick<
    ServicioPrecioCalculado,
    | "seguroVida"
    | "costosDirectosSeguroVida"
    | "aui"
    | "precioAntesIva"
    | "iva"
    | "precioTotal"
  >;
  header: string;
}[] = [
  { campo: "seguroVida", header: "Seguro de Vida" },
  { campo: "costosDirectosSeguroVida", header: "Costos Directos + Seguro Vida" },
  { campo: "aui", header: "AUI" },
  { campo: "precioAntesIva", header: "Precio Antes de IVA" },
  { campo: "iva", header: "IVA" },
  { campo: "precioTotal", header: "Precio Total" },
];

// Todas las columnas del desglose calculado son editables a mano. Las primeras 3 (costosDirectos,
// seguroVida, aui) son los valores base: al editarlas se recalcula en cascada el resto del desglose (ver
// recalcularPrecioCalculado). El resto (costosDirectosSeguroVida, precioAntesIva, iva, precioTotal) se
// sobreescribe directo, sin recalcular hacia atras.
const CAMPOS_EDITABLES_PRECIO_CALCULADO = [
  "costosDirectos",
  "seguroVida",
  "costosDirectosSeguroVida",
  "aui",
  "precioAntesIva",
  "iva",
  "precioTotal",
] as const;

type CampoEditablePrecioCalculado = (typeof CAMPOS_EDITABLES_PRECIO_CALCULADO)[number];

// De los campos editables, solo estos 3 son valores base: el resto del desglose se deriva de ellos
// (ver recalcularPrecioCalculado)
const CAMPOS_BASE_PRECIO_CALCULADO = ["costosDirectos", "seguroVida", "aui"] as const;

const esCampoBasePrecioCalculado = (
  campo: CampoEditablePrecioCalculado,
): campo is (typeof CAMPOS_BASE_PRECIO_CALCULADO)[number] =>
  (CAMPOS_BASE_PRECIO_CALCULADO as readonly string[]).includes(campo);

// Recalcula el desglose de un servicio ya calculado cuando el usuario edita a mano uno de sus campos,
// igual que calcularTotalesTarifa en el backend (mismo 1.9% de IVA, mismo redondeo hacia arriba). Si el
// campo editado es uno de los 3 valores base (costosDirectos, seguroVida, aui) se recalcula en cascada
// el resto del desglose; si es uno de los campos derivados (costosDirectosSeguroVida, precioAntesIva,
// iva, precioTotal) se sobreescribe directo, ya que es el usuario quien esta forzando ese valor final.
const recalcularPrecioCalculado = (
  actual: ServicioPrecioCalculado,
  campo: CampoEditablePrecioCalculado,
  nuevoValor: number,
): ServicioPrecioCalculado => {
  if (!esCampoBasePrecioCalculado(campo)) {
    return { ...actual, [campo]: nuevoValor };
  }

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
  // Edita a mano (post-calculo) uno de los campos del desglose de un servicio ya calculado. Si es uno de
  // los 3 valores base (costosDirectos, seguroVida, aui) recalcula en cascada el resto del desglose; si es
  // uno de los derivados, lo sobreescribe directo (ver recalcularPrecioCalculado)
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
          const calculado = meta.preciosCalculados[servicio.idServicio];

          // Una vez que el servicio ya se calculo, esta columna pasa a mostrar (editable) el costo directo
          // del desglose calculado, para todos los servicios — antes solo se editaba acá el valor manual
          // previo al calculo, y el calculado se repetia en una columna aparte (ver COLUMNAS_PRECIO_CALCULADO)
          if (calculado) {
            return (
              <InputPrice
                label=""
                size="md"
                value={formatMiles(String(calculado.costosDirectos))}
                onChange={(e) =>
                  meta.onChangePrecioCalculado(
                    servicio.idServicio,
                    "costosDirectos",
                    e.target.value,
                  )
                }
              />
            );
          }

          // Antes de calcular, el campo manual aparece desde el inicio para Monitoreo de Alarmas / "por
          // servicio" (siempre lo requieren), o mas tarde para cualquier otro servicio que un intento previo
          // de "Calcular precios" ya haya determinado que tambien lo necesita (ver handleCalcularPrecios)
          if (
            !requiereCostosDirectosManualDesdeElInicio(servicio) &&
            !meta.serviciosRequierenManual.has(servicio.idServicio)
          ) {
            return <Typography color="text.disabled">—</Typography>;
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

            if (!calculado) return <Typography color="text.disabled">—</Typography>;

            // Todo el desglose calculado es editable a mano: costos directos, seguro de vida y aui
            // recalculan en cascada el resto (ver recalcularPrecioCalculado); costos directos + seguro
            // vida, precio antes de iva, iva y precio total se sobreescriben directo si el usuario los toca.
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
    <TableRow key={row.idTarifaHoraDescripcion}>
      <TableCell sx={{ px: 3, fontWeight: 500, textTransform: "capitalize" }}>
        {row.nombre}
      </TableCell>
      <TableCell sx={{ px: 3 }}>
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
      </TableCell>
    </TableRow>
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
      <PageHeader
        title={
          <>
            Periodo {periodo?.data?.anioInicio}
            <PeriodoFacturacionChip activo={!!periodo?.data?.periodoActivoFacturacion} />
          </>
        }
        description={periodo?.data?.nombre}
        actions={
          <>
            <ButtonAction
              Icon={ArrowBackIcon}
              label="Volver"
              color="blue-light"
              type="button"
              onClick={() => {
                navigate({
                  to: "/dashboard/tarifas/periodo",
                });
              }}
            />
            <ButtonAction
              Icon={AddIcon}
              label="Guardar tarifa"
              onClick={handleGuardarTarifas}
              disabled={
                isLoadingGuardarTarifas || Object.keys(preciosCalculados).length === 0
              }
            />
          </>
        }
      />

      {/* Tarifa Hora del periodo */}
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box
          className="flex items-center justify-between gap-4 px-6 py-4"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <div>
            <Typography variant="h5" component="h3" className="flex items-center gap-2">
              <ScheduleOutlinedIcon color="primary" fontSize="small" />
              Valores para Servicio de Vigilancia y Escolta
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Valor de la hora diurna, diurna dominical/festiva, nocturna,
              nocturna dominical/festiva y seguro de vida. Se usa para
              calcular automáticamente el precio de los servicios
              diurnos/nocturnos.
            </Typography>
          </div>
          <ButtonAction
            Icon={AddIcon}
            label="Guardar valores"
            onClick={handleGuardarTarifaHora}
            disabled={isLoadingGuardarTarifasHora || tarifaHoraRows.length === 0}
          />
        </Box>

        {tarifaHoraRows.length === 0 ? (
          <TarifaHoraTabla encabezados={["Tarifa Hora", "Costos Directos *"]}>
            <TableRow>
              <TableCell colSpan={2} align="center" sx={{ py: 3, color: "text.secondary" }}>
                No hay tarifas por hora configuradas para este periodo todavía.
              </TableCell>
            </TableRow>
          </TarifaHoraTabla>
        ) : (
          <>
            {filaSeguroVida && (
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <TarifaHoraTabla
                  encabezados={["Valor Seguro De Vida (Mensual)", "Valor Mensual *"]}
                >
                  {renderTarifaHoraRow(filaSeguroVida)}
                </TarifaHoraTabla>
              </Box>
            )}

            <TarifaHoraTabla encabezados={["Tarifa Hora", "Costos Directos *"]}>
              {filasHora.map((row) => renderTarifaHoraRow(row))}
            </TarifaHoraTabla>
          </>
        )}
      </Paper>

      {/* Servicios disponibles del periodo, agrupados por tipo de servicio (igual que /dashboard/servicios) */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Typography variant="h5" component="h3">
            Servicios Disponibles
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Los servicios de Monitoreo de Alarmas, el servicio "Recogida de
            dinero" y los servicios mensuales de 8 horas siempre requieren
            ingresar el costo directo manualmente antes de calcular. Para el
            resto, al hacer clic en "Calcular precios" se intenta calcular
            automáticamente a partir de la tarifa hora configurada arriba; si
            algún servicio no se puede calcular solo, aparecerá su campo de
            costo directo para ingresarlo manualmente y volver a calcular.
          </Typography>
        </div>
        <ButtonAction
          Icon={AddIcon}
          label="Calcular precios"
          onClick={handleCalcularPrecios}
          disabled={isLoadingCalcularPrecios}
        />
      </div>

      <div className="flex flex-col gap-6">
        {Object.entries(serviciosPorTipo).map(([tipo, lista]) => (
          <div key={tipo} className="flex flex-col gap-2">
            <Typography variant="h4" component="h2" color="primary">
              {tipo}
            </Typography>
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
          <Paper variant="outlined" sx={{ px: 3, py: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              No hay servicios disponibles para este periodo.
            </Typography>
          </Paper>
        )}
      </div>
    </Section>
  );
}

const TarifaHoraTabla = ({
  encabezados,
  children,
}: {
  encabezados: [string, string];
  children: ReactNode;
}) => (
  <TableContainer>
    <MuiTable size="small" sx={{ tableLayout: "fixed" }}>
      <colgroup>
        <col style={{ width: "40%" }} />
        <col />
      </colgroup>
      <TableHead>
        <TableRow>
          {encabezados.map((h) => (
            <TableCell key={h} sx={{ px: 3 }}>
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>{children}</TableBody>
    </MuiTable>
  </TableContainer>
);
