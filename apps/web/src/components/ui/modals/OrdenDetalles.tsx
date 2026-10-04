import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { OrderStateLabel } from "../../common/OrderStateLabel";
import { DetailField, DetailSection } from "../common/DetailSection";
import { useState } from "react";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { SimpleModal } from "../../common/SimpleModal";
import type {
  OrdenServicio,
  OrdenServicioDetalle,
} from "../../../api/types/orden-servicio";
import type {
  OrdenLiquidada,
  LiquidacionOrdenDetalle,
  AdicionalLiquidado,
} from "../../../api/types/liquidaciones";
import { useGetLiquidacionesByOrdenId } from "../../../api/queryFunctions/orden-servicio";
import { useGetOrdenLiquidada } from "../../../api/queryFunctions/liquidaciones";
import { AdicionalLiquidadoDetalle } from "./AdicionalLiquidadoDetalle";
import { priceFormat } from "../../../utils/PriceFormat";
import { timeFormat } from "../../../utils/TimeFormat";
import { safeParseDate } from "../../../utils/DateUtils";
import { textoCobroParcial } from "../../../utils/cobroParcial";
import { TIPO_SERVICIO_MONITOREO_ALARMAS } from "../../common/stepsOrdenServicio/tipoServicioConstantes";

const priceOrNA = (value: number | null | undefined) =>
  value === null || value === undefined ? "N/A" : priceFormat(value);

// "202609" -> "Septiembre 2026". aniomes_liquidacion deberia venir siempre con este formato, pero algunos
// registros historicos se guardaron sin cero a la izquierda en el mes (ej "20269" para septiembre/2026, ver
// aniomes_liquidacion en liquidaciones.service.ts): se valida por contenido (año de 4 digitos + mes 1-12), no
// por longitud fija, para no romper esos casos ni los realmente invalidos/nulos (ver bug de "Ver" orden en produccion)
const formatAniomes = (aniomes: string | null | undefined) => {
  if (!aniomes || aniomes.length < 5) return "N/A";
  const anio = Number(aniomes.slice(0, 4));
  const mes = Number(aniomes.slice(4));
  if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    return "N/A";
  }
  const nombre = new Date(Date.UTC(anio, mes - 1, 1)).toLocaleDateString(
    "es-ES",
    { month: "long", timeZone: "UTC" },
  );
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
};

// selectedOrderDetail acepta tanto una orden real (findOne) como el snapshot de una liquidacion especifica
// (GET /liquidaciones/:idLiquidacion/orden), que trae la misma forma con los precios de ese mes. Se distinguen
// por la presencia de idLiquidacion (ver esSnapshotLiquidacion)
type DetalleOrdenOSnapshot = OrdenServicio | OrdenLiquidada;

// Dias de la semana en que se presta un servicio de catalogo (ver OrdenServicioDetalle). El snapshot de una
// liquidacion (LiquidacionOrdenDetalle) no trae estos campos, por eso quedan opcionales aca
type DiaSemanaKey =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

const DIAS_SEMANA_LABELS: Record<DiaSemanaKey, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

const DIAS_SEMANA_KEYS = Object.keys(DIAS_SEMANA_LABELS) as DiaSemanaKey[];

const diasActivos = (detalle: Partial<Record<DiaSemanaKey, boolean>>) =>
  DIAS_SEMANA_KEYS.filter((dia) => detalle[dia])
    .map((dia) => DIAS_SEMANA_LABELS[dia])
    .join(", ");

// Distingue el snapshot de un adicional liquidado (tipo:'adicional') del snapshot de una orden liquidada,
// ya que ambos comparten el campo idLiquidacion — ver esSnapshotLiquidacion mas abajo
const esAdicionalLiquidado = (
  orden: DetalleOrdenOSnapshot | AdicionalLiquidado,
): orden is AdicionalLiquidado => "tipo" in orden && orden.tipo === "adicional";

const esSnapshotLiquidacion = (
  orden: DetalleOrdenOSnapshot | AdicionalLiquidado,
): orden is OrdenLiquidada => "idLiquidacion" in orden && !esAdicionalLiquidado(orden);

// Una fila de "detalles" de la orden real o del snapshot de una liquidacion: ambas formas traen
// idTarifa.idServicio completo (ver findOneOrdenRelations en el backend), de ahi se lee el tipo de servicio
type DetalleServicioOrden = OrdenServicioDetalle | LiquidacionOrdenDetalle;

// Agrupa los indices de "detalles" en las tarjetas a renderizar: una tarjeta por unidad para el caso general.
// Puede haber varios servicios distintos de tipo Monitoreo de Alarmas en la misma orden (cada uno con su propia
// tarifa/precio y su propia cantidad de unidades, ver SeleccionarServicio), por eso se agrupan por idServicio
// (mismo criterio que ConfigurarHorariosServicios/PreviewInformacionOrden en el wizard de creacion) y no todos
// juntos: cada servicio de este tipo obtiene una unica tarjeta que resume todas sus unidades, ubicada en la
// posicion de la primera de ellas para no alterar el orden del resto de servicios
const agruparIndicesDetalles = (detalles: DetalleServicioOrden[]): number[][] => {
  const idServicioMonitoreoPorIndice = detalles.map((detalle) => {
    const servicio = detalle.idTarifa?.idServicio;
    return servicio?.idTipoServicio?.nombre === TIPO_SERVICIO_MONITOREO_ALARMAS
      ? servicio.idServicio
      : null;
  });

  const indicesPorServicio = new Map<number, number[]>();
  idServicioMonitoreoPorIndice.forEach((idServicio, index) => {
    if (idServicio == null) return;
    const grupo = indicesPorServicio.get(idServicio) ?? [];
    grupo.push(index);
    indicesPorServicio.set(idServicio, grupo);
  });

  const grupos: number[][] = [];
  const serviciosYaAgregados = new Set<number>();
  detalles.forEach((_, index) => {
    const idServicio = idServicioMonitoreoPorIndice[index];
    if (idServicio == null) {
      grupos.push([index]);
    } else if (!serviciosYaAgregados.has(idServicio)) {
      grupos.push(indicesPorServicio.get(idServicio)!);
      serviciosYaAgregados.add(idServicio);
    }
  });
  return grupos;
};

// Suma un campo numerico opcional del desglose de precio a traves de todas las filas del grupo. Devuelve null
// si ninguna fila tiene valor para ese campo, para distinguir "no vino" de "vino en cero". Los campos decimal
// de la orden (costosDirectos, precio, etc.) llegan del backend como string (columnas "numeric" de TypeORM se
// serializan asi), por eso se convierten con Number(...) antes de sumar: sumar strings con += concatena en vez
// de sumar y termina en NaN al formatear (ver bug de "Ver" orden con "$ NaN" en varias unidades agrupadas)
const sumarCampoDetalle = (
  indices: number[],
  detalles: DetalleServicioOrden[],
  getter: (detalle: DetalleServicioOrden) => number | null | undefined,
): number | null => {
  let total = 0;
  let algunValor = false;
  indices.forEach((index) => {
    const valor = getter(detalles[index]);
    if (valor == null) return;
    const numero = Number(valor);
    if (Number.isNaN(numero)) return;
    total += numero;
    algunValor = true;
  });
  return algunValor ? total : null;
};

// Tarjeta de un servicio de la orden: representa una sola unidad para el caso general, o todas las unidades de
// un mismo servicio de tipo Monitoreo de Alarmas a la vez (ver agruparIndicesDetalles). El horario/dias
// mostrados se toman de la primera fila del grupo (todas comparten el mismo horario, ver
// ConfigurarHorariosServicios en el wizard de creacion) y el precio/costos se suman entre todas las filas
const renderTarjetaDetalle = (
  indices: number[],
  detalles: DetalleServicioOrden[],
) => {
  const indicePrincipal = indices[0];
  const detalle = detalles[indicePrincipal];
  // idTarifa siempre viene con su idServicio cargado (ver findOneOrdenRelations en el backend)
  const servicio = detalle.idTarifa?.idServicio;

  const precioTotalGrupo = sumarCampoDetalle(indices, detalles, (d) => d.precio);
  const costosDirectos = sumarCampoDetalle(
    indices,
    detalles,
    (d) => d.costosDirectos,
  );
  const seguroVida = sumarCampoDetalle(indices, detalles, (d) => d.seguroVida);
  const aui = sumarCampoDetalle(indices, detalles, (d) => d.aui);
  const precioAntesIva = sumarCampoDetalle(
    indices,
    detalles,
    (d) => d.precioAntesIva,
  );
  const iva = sumarCampoDetalle(indices, detalles, (d) => d.iva);

  return (
    <Paper key={indices.join("-")} variant="outlined" className="p-4">
      <Typography variant="body1" component="h4" sx={{ fontWeight: 600, mb: 1.5 }}>
        {servicio?.codigo
          ? `${servicio.codigo} — ${servicio.descripcion}`
          : `Detalle ${indicePrincipal + 1}`}
        {indices.length > 1 && (
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({indices.length} unidades)
          </Typography>
        )}
        {diasActivos(detalle) && (
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {diasActivos(detalle)}
          </Typography>
        )}
      </Typography>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DetailField
          label="Horario"
          value={`${timeFormat(detalle.horaInicio)} - ${timeFormat(detalle.horaFin)}`}
        />
        {/* fecha/cantidadHoras solo traen valor en ordenes "a la medida": cada fila es un dia
            especifico del rango (en "catalogo" son null, no se muestran) */}
        {detalle.fecha && (
          <DetailField
            label="Fecha"
            value={safeParseDate(detalle.fecha.slice(0, 10)).toLocaleDateString()}
          />
        )}
        {detalle.cantidadHoras != null && (
          <DetailField label="Cantidad de Horas" value={detalle.cantidadHoras} />
        )}
        <DetailField label="Precio" value={priceOrNA(precioTotalGrupo)} price />
      </div>

      {/* Información del Servicio */}
      {servicio && (
        <DetailSection title="Servicio" columns={3} outlined={false}>
          <DetailField label="Código" value={servicio.codigo} />
          <DetailField label="Descripción" value={servicio.descripcion} />
          {/* Cada campo solo se muestra si realmente trae valor: no tiene sentido pintar
              una etiqueta vacia cuando la relacion no vino cargada (ver findOrdenLiquidada
              en el backend) o simplemente no aplica para este servicio */}
          {servicio.idTipoServicio?.nombre && (
            <DetailField label="Tipo de Servicio" value={servicio.idTipoServicio.nombre} />
          )}
          {servicio.idTipoDuracion?.descripcion && (
            <DetailField label="Duración" value={servicio.idTipoDuracion.descripcion} />
          )}
          {servicio.idTipoHorarioDescripcion?.nombre && (
            <DetailField label="Horario" value={servicio.idTipoHorarioDescripcion.nombre} />
          )}
          <DetailField label="Horas Fijas" value={servicio.horasFijas} />
          {servicio.idTipoTarifa?.nombre && (
            <DetailField label="Tipo Tarifa" value={servicio.idTipoTarifa.nombre} />
          )}
          {servicio.idTipoTarifa?.cantidadTiempo != null && (
            <DetailField
              label="Cantidad Tiempo"
              value={`${servicio.idTipoTarifa.cantidadTiempo} ${servicio.idTipoTarifa.idTipoUnidadTiempo?.descripcion ?? ""}`}
            />
          )}
        </DetailSection>
      )}
      <DetailSection title="Desglose de Costos" columns={4} outlined={false}>
        <DetailField label="Costos Directos" value={priceOrNA(costosDirectos)} />
        <DetailField label="Seguro de Vida" value={priceOrNA(seguroVida)} />
        <DetailField label="AUI" value={priceOrNA(aui)} />
        <DetailField label="IVA" value={priceOrNA(iva)} />
        <DetailField label="Precio Antes IVA" value={priceOrNA(precioAntesIva)} />
        <DetailField label="Precio Total" value={priceOrNA(precioTotalGrupo)} price />
      </DetailSection>
    </Paper>
  );
};

export const OrdenDetalles = ({
  isOpenDetails,
  setIsOpenDetails,
  selectedOrderDetail,
  setSelectedOrderDetail,
}: {
  isOpenDetails: boolean;
  setIsOpenDetails: (isOpen: boolean) => void;
  selectedOrderDetail: DetalleOrdenOSnapshot | AdicionalLiquidado;
  setSelectedOrderDetail?: (selectedOrderDetail: OrdenServicio | null) => void;
}) => {
  // Historial de liquidaciones de esta orden (una por mes ya liquidado). Solo aplica cuando se esta viendo la
  // orden real, no tiene sentido mostrar "liquidaciones de esta liquidacion" dentro de ningun snapshot
  // (ni de orden ni de adicional)
  const esSnapshot =
    esSnapshotLiquidacion(selectedOrderDetail) || esAdicionalLiquidado(selectedOrderDetail);

  const [paginaLiquidaciones, setPaginaLiquidaciones] = useState(1);
  const LIMITE_LIQUIDACIONES = 5;

  // El hook debe llamarse siempre (reglas de hooks), aunque para un snapshot de adicional no aplique — por eso
  // esta deshabilitado via esSnapshot (y ademas el propio hook se autodeshabilita con ordenId 0 via !!ordenId)
  const idOrdenServicioParaHistorial = esAdicionalLiquidado(selectedOrderDetail)
    ? 0
    : selectedOrderDetail.idOrdenServicio;

  const { data: liquidacionesOrden, isLoading: isLoadingLiquidacionesOrden } =
    useGetLiquidacionesByOrdenId(
      idOrdenServicioParaHistorial,
      paginaLiquidaciones,
      LIMITE_LIQUIDACIONES,
      isOpenDetails && !esSnapshot,
    );

  const {
    mutate: getOrdenLiquidadaMutation,
    data: ordenLiquidadaData,
    isPending: isLoadingOrdenLiquidada,
  } = useGetOrdenLiquidada();

  const [isOpenLiquidacionDetalle, setIsOpenLiquidacionDetalle] =
    useState(false);

  // A partir de aca selectedOrderDetail ya no puede ser un adicional liquidado (ver el return de abajo), por
  // lo que el resto del componente puede seguir asumiendo la forma OrdenServicio/OrdenLiquidada de siempre
  if (esAdicionalLiquidado(selectedOrderDetail)) {
    return (
      <SimpleModal
        isOpen={isOpenDetails}
        onClose={() => {
          setIsOpenDetails(false);
          if (setSelectedOrderDetail) {
            setSelectedOrderDetail(null);
          }
        }}
        title={`Adicional liquidado — ${formatAniomes(selectedOrderDetail.aniomes_liquidacion)}`}
        size="3xl"
      >
        <AdicionalLiquidadoDetalle detalle={selectedOrderDetail} />
      </SimpleModal>
    );
  }

  // Vigilancia y escolta: el cliente se lee de la locacion (idLocacion.idCliente). Monitoreo de alarmas: la
  // orden no tiene locacion, el cliente viene asignado directo en idCliente (ver esOrdenMonitoreo en el
  // wizard de creacion)
  const cliente = selectedOrderDetail.idLocacion?.idCliente ?? selectedOrderDetail.idCliente;

  return (
    <>
    <SimpleModal
      isOpen={isOpenDetails}
      onClose={() => {
        setIsOpenDetails(false);
        if (setSelectedOrderDetail) {
          setSelectedOrderDetail(null);
        }
      }}
      title={
        esSnapshotLiquidacion(selectedOrderDetail)
          ? `Detalle liquidado — ${formatAniomes(selectedOrderDetail.aniomes_liquidacion)}`
          : "Detalles de la orden de servicio"
      }
      size="3xl"
    >
      <div className="flex flex-col gap-4">
        {esSnapshotLiquidacion(selectedOrderDetail) && (
          <Alert severity="info">
            Mostrando lo realmente liquidado en{" "}
            <b>{formatAniomes(selectedOrderDetail.aniomes_liquidacion)}</b>{" "}
            (liquidación #{selectedOrderDetail.idLiquidacion}), no el total de
            toda la orden.
          </Alert>
        )}
        {/* Puesto: solo aplica a ordenes de "Vigilancia y escolta" (idLocacion). Las de "Monitoreo de
            alarmas" van directo a un cliente, sin puesto/locacion asociado */}
        {selectedOrderDetail.idLocacion && (
          <DetailSection icon={<PlaceOutlinedIcon />} title="Puesto">
            <DetailField label="Nombre" value={selectedOrderDetail.idLocacion?.nombre || "N/A"} />
            <DetailField
              label="Dirección"
              value={selectedOrderDetail.idLocacion?.direccion || "N/A"}
            />
            <DetailField
              label="Responsable"
              value={`${selectedOrderDetail.idLocacion?.primerNombreResponsable ?? ""} ${selectedOrderDetail.idLocacion?.primerApellidoResponsable ?? ""}`}
            />
            <DetailField
              label="Teléfono"
              value={selectedOrderDetail.idLocacion?.telefono || "N/A"}
            />
            <DetailField
              label="Coordenadas"
              value={`Lat: ${selectedOrderDetail.idLocacion?.latitud ?? ""}, Long: ${selectedOrderDetail.idLocacion?.longitud ?? ""}`}
            />
            <DetailField
              label="Ciudad"
              value={[
                selectedOrderDetail.idLocacion?.idCiudad?.descripcion,
                selectedOrderDetail.idLocacion?.idCiudad?.departamento?.descripcion,
                selectedOrderDetail.idLocacion?.idCiudad?.departamento?.pais?.descripcion,
              ]
                .filter(Boolean)
                .join(", ")}
            />
          </DetailSection>
        )}

        {/* Cliente: para "Vigilancia y escolta" es el cliente del puesto, para "Monitoreo de alarmas" es el
            cliente asignado directo a la orden (ver "cliente" mas arriba) */}
        <DetailSection icon={<BusinessOutlinedIcon />} title="Información del Cliente">
          <DetailField label="Nombre" value={cliente?.nombre || "N/A"} />
          <DetailField
            label="Identificación"
            value={`${cliente?.idTipoIdentificacion?.descripcion ?? ""}: ${cliente?.numeroIdentificacion ?? ""}`}
          />
          <DetailField
            label="Tipo de Cliente"
            value={cliente?.idTipoCliente?.descripcion || "N/A"}
          />
          <DetailField
            label="Segmentación"
            value={cliente?.idSubSegmentacion?.segmentacion?.descripcion || "N/A"}
          />
        </DetailSection>

        {/* Información Básica de la Orden */}
        <DetailSection icon={<DescriptionOutlinedIcon />} title="Información de la Orden">
          <DetailField label="ID Orden" value={selectedOrderDetail.idOrdenServicio} />
          <DetailField
            label="Descripción ID"
            value={selectedOrderDetail.ordenServicioId?.descripcionId || "N/A"}
          />
          <DetailField
            label="Precio Total"
            value={priceFormat(selectedOrderDetail.precioTotal)}
            price
          />
          <DetailField label="Fecha de Creación" value={selectedOrderDetail.fechaCreacion} />
          <DetailField
            label="Fecha de Actualización"
            value={selectedOrderDetail.fechaActualizacion}
          />
          <DetailField
            label="Anulado"
            value={selectedOrderDetail.ordenServicioId?.anulado ? "Sí" : "No"}
          />
        </DetailSection>

        {/* Usuario Creador */}
        <DetailSection icon={<PersonOutlinedIcon />} title="Usuario Creador">
          <DetailField
            label="Nombre Completo"
            value={[
              selectedOrderDetail.idUsuarioCreacion?.primerNombre,
              selectedOrderDetail.idUsuarioCreacion?.segundoNombre,
              selectedOrderDetail.idUsuarioCreacion?.primerApellido,
              selectedOrderDetail.idUsuarioCreacion?.segundoApellido,
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <DetailField
            label="Email"
            value={selectedOrderDetail.idUsuarioCreacion?.email || "N/A"}
          />
          <DetailField
            label="Identificación"
            value={`${selectedOrderDetail.idUsuarioCreacion?.idTipoIdentificacion?.descripcion ?? ""}: ${selectedOrderDetail.idUsuarioCreacion?.numeroIdentificacion ?? ""}`}
          />
        </DetailSection>

        {/* Estado de la Orden */}
        <DetailSection icon={<CheckCircleOutlinedIcon />} title="Estado de la Orden de Servicio">
          <DetailField
            label="Estado"
            value={
              <OrderStateLabel state={selectedOrderDetail.idEstadoOrdenServicio?.nombre || "N/A"} />
            }
          />
          <DetailField
            label="Programable"
            value={selectedOrderDetail.idEstadoOrdenServicio?.programable ? "Sí" : "No"}
          />
          <DetailField
            label="Descripción"
            value={selectedOrderDetail.idEstadoOrdenServicio?.descripcion || "N/A"}
            fullWidth
          />
        </DetailSection>

        {/* Fechas de la Orden */}
        <DetailSection icon={<CalendarMonthOutlinedIcon />} title="Fecha Orden de Servicio">
          <DetailField label="Fecha de Inicio" value={selectedOrderDetail.fechaInicio} />
          <DetailField label="Fecha de Fin" value={selectedOrderDetail.fechaFin} />
          {selectedOrderDetail.diaInicioCobro != null &&
            selectedOrderDetail.diaFinCobro != null && (
              <DetailField
                label="Cobro parcial"
                value={textoCobroParcial(
                  selectedOrderDetail.diaInicioCobro,
                  selectedOrderDetail.diaFinCobro,
                )}
                fullWidth
              />
            )}
          {/* Fecha Ordenes son las que se actualizan */}
          <DetailField
            label="Fecha Inicio Orden (Actualizada)"
            value={selectedOrderDetail.fechaInicioOrden}
          />
          <DetailField
            label="Fecha Fin Orden (Actualizada)"
            value={selectedOrderDetail.fechaFinOrden}
          />
        </DetailSection>

        {/* Tarifas: una tarjeta por unidad, salvo que la orden tenga varias unidades del mismo servicio de
            tipo Monitoreo de Alarmas, en cuyo caso se resumen en una unica tarjeta con el precio/costos
            sumados entre esas unidades (ver agruparIndicesDetalles) */}
        <Paper variant="outlined" className="flex flex-col gap-4 p-4">
          <Typography
            variant="h5"
            component="h3"
            className="flex items-center gap-2"
            sx={{ "& svg": { color: "primary.main", fontSize: 20 } }}
          >
            <MonetizationOnOutlinedIcon />
            Tarifas y Servicios
          </Typography>
          {agruparIndicesDetalles(selectedOrderDetail.detalles ?? []).map(
            (indices) =>
              renderTarjetaDetalle(indices, selectedOrderDetail.detalles ?? []),
          )}

          {(!selectedOrderDetail.detalles ||
            selectedOrderDetail.detalles.length === 0) && (
            <Typography variant="body2" color="text.secondary" align="center">
              Esta orden no tiene servicios registrados
            </Typography>
          )}
        </Paper>

        {/* Historial de Liquidaciones: solo tiene sentido sobre la orden real, no dentro del snapshot de
            una liquidacion puntual (evita anidar "liquidaciones de esta liquidacion") */}
        {!esSnapshot && (
          <Paper variant="outlined" className="p-4">
            <Typography
              variant="h5"
              component="h3"
              className="flex items-center gap-2"
              sx={{ mb: 1.5, "& svg": { color: "primary.main", fontSize: 20 } }}
            >
              <ReceiptLongOutlinedIcon />
              Historial de Liquidaciones
            </Typography>

            {isLoadingLiquidacionesOrden ? (
              <Typography variant="body2" color="text.secondary">
                Cargando liquidaciones...
              </Typography>
            ) : liquidacionesOrden?.data?.items &&
              liquidacionesOrden.data.items.length > 0 ? (
              <>
                <Paper variant="outlined">
                  <List disablePadding>
                    {liquidacionesOrden.data.items.map((liquidacion, i) => (
                      <ListItemButton
                        key={liquidacion.idLiquidacion}
                        divider={i < (liquidacionesOrden.data?.items.length ?? 0) - 1}
                        disabled={isLoadingOrdenLiquidada}
                        onClick={() =>
                          getOrdenLiquidadaMutation(liquidacion.idLiquidacion, {
                            onSuccess: (response) => {
                              if (response.status === 200 || response.status === 201) {
                                setIsOpenLiquidacionDetalle(true);
                              }
                            },
                          })
                        }
                        sx={{ justifyContent: "space-between" }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatAniomes(liquidacion.aniomes_liquidacion)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "success.dark" }}>
                          {priceFormat(liquidacion.valor_liquidacion)}
                        </Typography>
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>

                {liquidacionesOrden.data.total > LIMITE_LIQUIDACIONES && (
                  <div className="mt-2 flex items-center justify-between">
                    <Button
                      size="small"
                      color="secondary"
                      disabled={paginaLiquidaciones <= 1}
                      onClick={() => setPaginaLiquidaciones((p) => p - 1)}
                    >
                      Anterior
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Página {paginaLiquidaciones}
                    </Typography>
                    <Button
                      size="small"
                      color="secondary"
                      disabled={
                        paginaLiquidaciones * LIMITE_LIQUIDACIONES >=
                        liquidacionesOrden.data.total
                      }
                      onClick={() => setPaginaLiquidaciones((p) => p + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Esta orden todavía no tiene liquidaciones registradas
              </Typography>
            )}
          </Paper>
        )}
      </div>
      <div className="flex items-center justify-end pt-4">
        <Button variant="outlined" color="secondary" onClick={() => setIsOpenDetails(false)}>
          Cerrar
        </Button>
      </div>
    </SimpleModal>

    {ordenLiquidadaData?.data && (
      <OrdenDetalles
        isOpenDetails={isOpenLiquidacionDetalle}
        setIsOpenDetails={setIsOpenLiquidacionDetalle}
        selectedOrderDetail={ordenLiquidadaData.data}
      />
    )}
    </>
  );
};
