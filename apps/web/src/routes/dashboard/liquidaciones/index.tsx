import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { alpha, type Theme } from "@mui/material/styles";
import { EmptyState } from "../../../components/ui/common/EmptyState";
import { SectionCard } from "../../../components/ui/common/SectionCard";
import { OrderStateLabel } from "../../../components/common/OrderStateLabel";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import AddIcon from "@mui/icons-material/Add";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { format, getYear, subYears } from "date-fns";
import { es } from "date-fns/locale";
import { InputSelect } from "../../../components/common/InputSelect";
import {
  useCrearLiquidacionMensual,
  useGetAdicionalesPorMes,
  useGetLiquidacionesPorMes,
} from "../../../api/queryFunctions/liquidaciones";
import { priceFormat } from "../../../utils/PriceFormat";
import { safeParseDate } from "../../../utils/DateUtils";
import { toast } from "sonner";
import type { OrdenServicio } from "../../../api/types/orden-servicio";
import type {
  AdicionalPorMes,
  LiquidarMesInfo,
  OrdenPorMes,
} from "../../../api/types/liquidaciones";
import { ServiciosOrden } from "../../../components/ui/modals/ServiciosOrden";

export const Route = createFileRoute("/dashboard/liquidaciones/")({
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

const mesesAtrasOptions = Array.from({ length: 13 }, (_, i) => ({
  id: i,
  descripcion: i === 0 ? "0 (solo el mes)" : i.toString(),
}));

const currentYear = getYear(new Date()).toString();
const currentMonth = (new Date().getMonth() + 1).toString();

const formatMesAdicional = (fecha: string) =>
  format(safeParseDate(fecha), "MMMM yyyy", { locale: es });

const formatMesLiquidar = (fila: LiquidarMesInfo) =>
  `${String(fila.mesLiquidar).padStart(2, "0")}/${fila.anioLiquidar}`;

// Una orden/adicional sale una vez por mes pendiente: la clave unica es id + aniomesLiquidar
const claveOrden = (orden: OrdenPorMes) =>
  `${orden.idOrdenServicio}-${orden.aniomesLiquidar}`;
const claveAdicional = (adicional: AdicionalPorMes) =>
  `${adicional.idAdicional}-${adicional.aniomesLiquidar}`;

const ordenesAPayload = (ordenes: OrdenPorMes[]) =>
  ordenes.map((orden) => ({
    idOrdenServicio: orden.idOrdenServicio || 0,
    anio: orden.anioLiquidar,
    mes: orden.mesLiquidar,
  }));

const adicionalesAPayload = (adicionales: AdicionalPorMes[]) =>
  adicionales.map((adicional) => ({
    idAdicional: adicional.idAdicional,
    anio: adicional.anioLiquidar,
    mes: adicional.mesLiquidar,
  }));

interface ClienteGrupo {
  clienteKey: string;
  // Null cuando ninguna orden/adicional del grupo trae un cliente identificable ("Sin cliente"): el backend
  // ahora exige idCliente para crear el grupo mensual (CrearGrupoMensualDto), por eso este grupo no se puede liquidar
  idCliente: number | null;
  clienteNombre: string;
  ordenes: OrdenPorMes[];
  adicionales: AdicionalPorMes[];
  total: number;
  totalAntesIva: number;
}

// Seleccion manual de ordenes/adicionales para liquidar parcialmente. Solo puede existir una seleccion a la vez y
// siempre pertenece a un unico cliente (un grupo de liquidacion es siempre de un solo cliente)
interface SeleccionCliente {
  clienteKey: string;
  ordenKeys: Set<string>;
  adicionalKeys: Set<string>;
}

const ordenAntesIva = (orden: OrdenServicio) =>
  orden.detalles?.reduce(
    (acc, detalle) => acc + (Number(detalle.precioAntesIva) || 0),
    0,
  ) || 0;

const agruparPorCliente = (
  ordenes: OrdenPorMes[],
  adicionales: AdicionalPorMes[],
): ClienteGrupo[] => {
  const grupos = new Map<string, ClienteGrupo>();

  const obtenerGrupo = (
    clienteId: number | undefined,
    clienteNombre: string | undefined,
  ) => {
    const key =
      clienteId != null ? String(clienteId) : (clienteNombre ?? "sin-cliente");
    if (!grupos.has(key)) {
      grupos.set(key, {
        clienteKey: key,
        idCliente: clienteId ?? null,
        clienteNombre: clienteNombre || "Sin cliente",
        ordenes: [],
        adicionales: [],
        total: 0,
        totalAntesIva: 0,
      });
    }
    return grupos.get(key)!;
  };

  ordenes.forEach((orden) => {
    const cliente = orden.idLocacion?.idCliente || orden.idCliente;
    const grupo = obtenerGrupo(cliente?.idCliente, cliente?.nombre);
    grupo.ordenes.push(orden);
    grupo.total += Number(orden.precioTotal) || 0;
    grupo.totalAntesIva += ordenAntesIva(orden);
  });

  adicionales.forEach((adicional) => {
    const cliente = adicional.idCliente;
    const grupo = obtenerGrupo(cliente?.idCliente, cliente?.nombre);
    grupo.adicionales.push(adicional);
    grupo.total += Number(adicional.precioTotal) || 0;
    grupo.totalAntesIva += Number(adicional.precioAntesIva) || 0;
  });

  return Array.from(grupos.values()).sort((a, b) =>
    a.clienteNombre.localeCompare(b.clienteNombre),
  );
};

function RouteComponent() {
  const [searchMonth, setSearchMonth] = useState<string>(currentMonth);
  const [searchYear, setSearchYear] = useState<string>(currentYear);
  const [searchMesesAtras, setSearchMesesAtras] = useState<string>("1");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(
    new Set(),
  );
  const [liquidandoClienteKey, setLiquidandoClienteKey] = useState<
    string | null
  >(null);
  const [seleccion, setSeleccion] = useState<SeleccionCliente | null>(null);
  // Orden cuyos servicios se muestran en el modal "Mostrar servicios"
  const [ordenServicios, setOrdenServicios] = useState<OrdenServicio | null>(
    null,
  );

  // Queries y mutaciones
  const {
    data: liquidaciones,
    isLoading: isLoadingLiquidaciones,
    refetch: refetchLiquidaciones,
    isError: isErrorLiquidaciones,
    error: errorLiquidaciones,
  } = useGetLiquidacionesPorMes(
    Number(searchYear),
    Number(searchMonth),
    isSearching,
    Number(searchMesesAtras),
  );

  const liquidacionesData = Array.isArray(liquidaciones?.data)
    ? liquidaciones.data
    : Array.isArray(liquidaciones?.data?.data)
      ? liquidaciones.data.data
      : [];

  const {
    data: adicionales,
    isLoading: isLoadingAdicionales,
    refetch: refetchAdicionales,
    isError: isErrorAdicionales,
    error: errorAdicionales,
  } = useGetAdicionalesPorMes(
    Number(searchYear),
    Number(searchMonth),
    isSearching,
    Number(searchMesesAtras),
  );

  const adicionalesData = Array.isArray(adicionales?.data)
    ? adicionales.data
    : [];

  const {
    mutateAsync: crearLiquidacionMensual,
    isPending: isCreatingLiquidacionMensualPending,
  } = useCrearLiquidacionMensual();

  const clientesGrupos = agruparPorCliente(liquidacionesData, adicionalesData);

  const toggleExpandCliente = (clienteKey: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clienteKey)) {
        next.delete(clienteKey);
      } else {
        next.add(clienteKey);
      }
      return next;
    });
  };

  const handleLiquidarCliente = async (grupo: ClienteGrupo) => {
    if (grupo.ordenes.length === 0 && grupo.adicionales.length === 0) {
      toast.error("Este cliente no tiene órdenes ni adicionales por liquidar");
      return;
    }

    if (!grupo.idCliente) {
      toast.error(
        "No se pudo determinar el cliente de este grupo, no se puede liquidar",
      );
      return;
    }

    setLiquidandoClienteKey(grupo.clienteKey);
    await crearLiquidacionMensual(
      {
        anio: Number(searchYear),
        mes: Number(searchMonth),
        idCliente: grupo.idCliente,
        // anio/mes de la raiz es el mes buscado; cada item lleva su propio mes
        ordenes: ordenesAPayload(grupo.ordenes),
        adicionales: adicionalesAPayload(grupo.adicionales),
      },
      {
        onSettled: () => {
          setLiquidandoClienteKey(null);
        },
      },
    );
  };

  const iniciarSeleccion = (grupo: ClienteGrupo) => {
    setSeleccion({
      clienteKey: grupo.clienteKey,
      ordenKeys: new Set(),
      adicionalKeys: new Set(),
    });
    setExpandedClients((prev) => new Set(prev).add(grupo.clienteKey));
  };

  const toggleSeleccionItem = (
    tipo: "ordenKeys" | "adicionalKeys",
    clave: string,
  ) => {
    setSeleccion((prev) => {
      if (!prev) return prev;
      const claves = new Set(prev[tipo]);
      if (claves.has(clave)) {
        claves.delete(clave);
      } else {
        claves.add(clave);
      }
      return { ...prev, [tipo]: claves };
    });
  };

  const handleLiquidarSeleccion = async (grupo: ClienteGrupo) => {
    if (!seleccion || seleccion.clienteKey !== grupo.clienteKey) return;

    const ordenesSeleccionadas = grupo.ordenes.filter((orden) =>
      seleccion.ordenKeys.has(claveOrden(orden)),
    );
    const adicionalesSeleccionados = grupo.adicionales.filter((adicional) =>
      seleccion.adicionalKeys.has(claveAdicional(adicional)),
    );

    if (
      ordenesSeleccionadas.length === 0 &&
      adicionalesSeleccionados.length === 0
    ) {
      toast.error("Selecciona al menos una orden o adicional para liquidar");
      return;
    }

    if (!grupo.idCliente) {
      toast.error(
        "No se pudo determinar el cliente de este grupo, no se puede liquidar",
      );
      return;
    }

    setLiquidandoClienteKey(grupo.clienteKey);
    try {
      const response = await crearLiquidacionMensual({
        anio: Number(searchYear),
        mes: Number(searchMonth),
        idCliente: grupo.idCliente,
        ordenes: ordenesAPayload(ordenesSeleccionadas),
        adicionales: adicionalesAPayload(adicionalesSeleccionados),
      });
      if (response.status === 200 || response.status === 201) {
        setSeleccion(null);
      }
    } catch {
      // El error ya se notifica en el onError de useCrearLiquidacionMensual
    } finally {
      setLiquidandoClienteKey(null);
    }
  };

  const hayResultados =
    liquidacionesData.length > 0 || adicionalesData.length > 0;

  return (
    <Section>
      <SectionCard
        title="Filtros de Búsqueda"
        description="Selecciona el mes y año para filtrar las órdenes de servicio y adicionales."
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-48 flex-1">
            <InputSelect
              label="Año"
              placeholder="Selecciona un año"
              id="searchYear"
              value={searchYear}
              onChange={(e) => {
                setSearchYear(e.target.value);
                setIsSearching(false);
                setExpandedClients(new Set());
                setSeleccion(null);
              }}
              options={yearsOptions as { id: number; descripcion: string }[]}
            />
          </div>
          <div className="min-w-48 flex-1">
            <InputSelect
              label="Mes"
              placeholder="Selecciona un mes"
              id="searchMonth"
              value={searchMonth}
              onChange={(e) => {
                setSearchMonth(e.target.value);
                setIsSearching(false);
                setExpandedClients(new Set());
                setSeleccion(null);
              }}
              options={monthsOptions}
            />
          </div>
          <div className="min-w-48 flex-1">
            <InputSelect
              label="Meses atrás"
              placeholder="Selecciona meses atrás"
              id="searchMesesAtras"
              value={searchMesesAtras}
              onChange={(e) => {
                setSearchMesesAtras(e.target.value);
                setIsSearching(false);
                setExpandedClients(new Set());
                setSeleccion(null);
              }}
              options={mesesAtrasOptions}
            />
          </div>
          <ButtonAction
            onClick={() => {
              setIsSearching(true);
              refetchLiquidaciones();
              refetchAdicionales();
              setExpandedClients(new Set());
              setSeleccion(null);
            }}
            disabled={isLoadingLiquidaciones || isLoadingAdicionales}
            Icon={SearchIcon}
            label={
              isLoadingLiquidaciones || isLoadingAdicionales
                ? "Buscando..."
                : "Buscar"
            }
          />
        </div>
      </SectionCard>

      {isSearching &&
        !isLoadingLiquidaciones &&
        !isLoadingAdicionales &&
        (!hayResultados || (isErrorLiquidaciones && isErrorAdicionales)) && (
          <EmptyState
            icon={
              isErrorLiquidaciones && isErrorAdicionales ? (
                <ErrorOutlinedIcon />
              ) : (
                <DescriptionOutlinedIcon />
              )
            }
            title={
              isErrorLiquidaciones && isErrorAdicionales
                ? errorLiquidaciones?.message || errorAdicionales?.message || ""
                : "No se encontraron órdenes de servicio ni adicionales"
            }
          />
        )}

      {isSearching &&
      !isLoadingLiquidaciones &&
      !isLoadingAdicionales &&
      hayResultados ? (
        <SectionCard
          title={`Clientes (${clientesGrupos.length} ${clientesGrupos.length === 1 ? "encontrado" : "encontrados"})`}
          description={`${liquidacionesData.length} ${
            liquidacionesData.length === 1 ? "orden de servicio" : "órdenes de servicio"
          } y ${adicionalesData.length} ${
            adicionalesData.length === 1 ? "adicional" : "adicionales"
          } por liquidar`}
        >
          <div className="flex flex-col gap-4">
            {clientesGrupos.map((grupo) => {
              const isExpanded = expandedClients.has(grupo.clienteKey);
              const isLiquidandoEsteCliente =
                isCreatingLiquidacionMensualPending &&
                liquidandoClienteKey === grupo.clienteKey;
              const isSeleccionando =
                seleccion?.clienteKey === grupo.clienteKey;
              const cantidadSeleccionada = isSeleccionando
                ? seleccion.ordenKeys.size + seleccion.adicionalKeys.size
                : 0;
              const totalItems =
                grupo.ordenes.length + grupo.adicionales.length;

              const cardSx = (seleccionado: boolean, esMesAnterior: boolean) => ({
                px: 1.5,
                py: 1,
                textAlign: "left",
                bgcolor: seleccionado
                  ? "action.selected"
                  : esMesAnterior
                    ? (t: Theme) => alpha(t.palette.warning.main, 0.08)
                    : "background.default",
                borderColor: seleccionado
                  ? "primary.main"
                  : esMesAnterior
                    ? "warning.light"
                    : "divider",
                ...(isSeleccionando && {
                  cursor: "pointer",
                  "&:hover": { borderColor: "primary.light" },
                }),
              });

              const renderBadgeMesAnterior = (fila: LiquidarMesInfo) =>
                fila.esMesAnterior && (
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                    label={`Mes anterior · ${formatMesLiquidar(fila)}`}
                  />
                );

              const renderCheckbox = (seleccionado: boolean) =>
                isSeleccionando && (
                  <Checkbox
                    size="small"
                    checked={seleccionado}
                    tabIndex={-1}
                    sx={{ p: 0 }}
                    slotProps={{ input: { "aria-hidden": true } }}
                  />
                );

              return (
                <Paper key={grupo.clienteKey} variant="outlined">
                  <div className="flex flex-wrap items-center justify-between gap-4 p-3">
                    <ButtonBase
                      onClick={() => toggleExpandCliente(grupo.clienteKey)}
                      className="flex min-w-0 flex-1 items-center gap-2"
                      sx={{ justifyContent: "flex-start", textAlign: "left", borderRadius: 1 }}
                    >
                      <ExpandMoreIcon
                        fontSize="small"
                        sx={{
                          color: "text.secondary",
                          transition: "transform .2s",
                          transform: isExpanded ? "rotate(180deg)" : "none",
                        }}
                      />
                      <div className="min-w-0">
                        <Typography variant="h4" component="h3" noWrap>
                          {grupo.clienteNombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {grupo.ordenes.length}{" "}
                          {grupo.ordenes.length === 1 ? "orden" : "órdenes"} ·{" "}
                          {grupo.adicionales.length}{" "}
                          {grupo.adicionales.length === 1
                            ? "adicional"
                            : "adicionales"}
                        </Typography>
                      </div>
                    </ButtonBase>
                    <div className="flex items-center gap-2">
                      {isSeleccionando ? (
                        <>
                          <ButtonAction
                            type="button"
                            color="red"
                            onClick={() => setSeleccion(null)}
                            disabled={isCreatingLiquidacionMensualPending}
                            Icon={CloseIcon}
                            label="Cancelar"
                          />
                          <ButtonAction
                            type="button"
                            color="green-light"
                            onClick={() => handleLiquidarSeleccion(grupo)}
                            disabled={
                              isCreatingLiquidacionMensualPending ||
                              cantidadSeleccionada === 0
                            }
                            Icon={AddIcon}
                            label={
                              isLiquidandoEsteCliente
                                ? "Liquidando..."
                                : `Liquidar Selección (${cantidadSeleccionada})`
                            }
                          />
                        </>
                      ) : (
                        <>
                          <ButtonAction
                            type="button"
                            color="yellow-light"
                            onClick={() => iniciarSeleccion(grupo)}
                            // Solo se permite una seleccion activa a la vez (siempre de un unico cliente)
                            disabled={
                              isCreatingLiquidacionMensualPending ||
                              !grupo.idCliente ||
                              seleccion !== null ||
                              totalItems < 2
                            }
                            Icon={ChecklistOutlinedIcon}
                            label="Seleccionar"
                          />
                          <ButtonAction
                            onClick={() => handleLiquidarCliente(grupo)}
                            disabled={
                              isCreatingLiquidacionMensualPending ||
                              !grupo.idCliente ||
                              seleccion !== null
                            }
                            Icon={AddIcon}
                            label={
                              isLiquidandoEsteCliente
                                ? "Liquidando..."
                                : "Liquidar Cliente"
                            }
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <Box
                      className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2 xl:grid-cols-3"
                      sx={{ borderTop: 1, borderColor: "divider" }}
                    >
                      {grupo.ordenes.map((orden) => {
                        const clave = claveOrden(orden);
                        const seleccionado =
                          isSeleccionando && seleccion.ordenKeys.has(clave);

                        return (
                          <Paper
                            key={clave}
                            variant="outlined"
                            sx={cardSx(seleccionado, orden.esMesAnterior)}
                            role={isSeleccionando ? "checkbox" : undefined}
                            aria-checked={
                              isSeleccionando ? seleccionado : undefined
                            }
                            onClick={
                              isSeleccionando
                                ? () => toggleSeleccionItem("ordenKeys", clave)
                                : undefined
                            }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Typography
                                variant="body2"
                                className="flex items-center gap-2"
                                sx={{ fontWeight: 500 }}
                              >
                                {renderCheckbox(seleccionado)}
                                {orden.ordenServicioId?.descripcionId}
                              </Typography>
                              <OrderStateLabel state={orden.idEstadoOrdenServicio?.nombre || ""} />
                            </div>
                            {renderBadgeMesAnterior(orden)}
                            {orden.idLocacion && (
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                                {orden.idLocacion.nombre} -{" "}
                                {orden.idLocacion.direccion}
                              </Typography>
                            )}
                            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                              <Typography variant="body2" color="text.secondary">
                                {orden.fechaInicio || ""} →{" "}
                                {orden.fechaFin || "Indefinida"}
                              </Typography>
                              <Button
                                size="small"
                                startIcon={<VisibilityOutlinedIcon />}
                                onClick={(e) => {
                                  // En modo seleccion la tarjeta completa alterna la orden, no debe hacerlo este boton
                                  e.stopPropagation();
                                  setOrdenServicios(orden);
                                }}
                              >
                                Mostrar servicios
                              </Button>
                            </div>
                          </Paper>
                        );
                      })}

                      {grupo.adicionales.map((adicional) => {
                        const clave = claveAdicional(adicional);
                        const seleccionado =
                          isSeleccionando && seleccion.adicionalKeys.has(clave);

                        return (
                          <Paper
                            key={clave}
                            variant="outlined"
                            sx={cardSx(seleccionado, adicional.esMesAnterior)}
                            role={isSeleccionando ? "checkbox" : undefined}
                            aria-checked={
                              isSeleccionando ? seleccionado : undefined
                            }
                            onClick={
                              isSeleccionando
                                ? () =>
                                    toggleSeleccionItem("adicionalKeys", clave)
                                : undefined
                            }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Typography
                                variant="body2"
                                className="flex items-center gap-2"
                                sx={{ fontWeight: 500 }}
                              >
                                {renderCheckbox(seleccionado)}
                                {adicional.idTipoAdicional?.descripcion}
                              </Typography>
                              <Chip size="small" label="Adicional" />
                            </div>
                            {renderBadgeMesAnterior(adicional)}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5, textTransform: "capitalize" }}
                            >
                              {formatMesAdicional(adicional.mesInicio)} -{" "}
                              {adicional.mesFin
                                ? formatMesAdicional(adicional.mesFin)
                                : "Indefinido"}
                            </Typography>
                          </Paper>
                        );
                      })}
                    </Box>
                  )}
                </Paper>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      <ServiciosOrden
        orden={ordenServicios}
        onClose={() => setOrdenServicios(null)}
      />
    </Section>
  );
}
