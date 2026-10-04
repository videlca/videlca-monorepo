// Users, // Se vuelve a necesitar cuando se reactive el bloque de Personal por servicio (ver mas abajo)
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useState } from "react";
import { DetailField, DetailSection } from "../../ui/common/DetailSection";
import { StepHeader } from "../../ui/common/StepHeader";
import { priceFormat } from "../../../utils/PriceFormat";
import { safeParseDate } from "../../../utils/DateUtils";
import { textoCobroParcial, type CobroParcial } from "../../../utils/cobroParcial";
import type { Cliente, Puesto } from "../../../types";
import type {
  CreateOrdenServicioDto,
  UpdateOrdenServicioDto,
} from "../../../api/dtos";
import type {
  CreateOrdenServicioTarifaDto,
  UpdateOrdenServicioTarifaDto,
} from "../../../api/dtos";
import type { Servicio } from "../../../api/types/servicio";
import type {
  CostoHoraOrdenServicio,
  PrecioOrdenResponse,
  PrecioServicioOrdenResponse,
} from "../../../api/types/orden-servicio";
import { TIPO_SERVICIO_MONITOREO_ALARMAS } from "./tipoServicioConstantes";

type FilaConfiguracion = CreateOrdenServicioTarifaDto | UpdateOrdenServicioTarifaDto;

// Particiona las filas de configuracionServicioTarifa en los grupos de tarjetas a renderizar: una tarjeta por
// unidad para el caso general. Puede haber varios servicios distintos de tipo Monitoreo de Alarmas a la vez,
// cada uno con su propia tarifa/precio y su propia cantidad de unidades (ver SeleccionarServicio), por eso se
// agrupan por idServicio (mismo criterio que ConfigurarHorariosServicios) y no todos juntos: cada servicio de
// este tipo obtiene una unica tarjeta que resume todas sus unidades, ubicada en la posicion de la primera de
// ellas para no alterar el orden del resto de servicios
const agruparIndicesServicios = (
  configuracionServicioTarifa: FilaConfiguracion[],
  selectedServices?: Servicio[],
): number[][] => {
  const idServicioMonitoreoPorIndice = configuracionServicioTarifa.map(
    (config) => {
      const servicio = selectedServices?.find(
        (s) => s.idServicio === config.idServicio,
      );
      return servicio?.idTipoServicio?.nombre ===
        TIPO_SERVICIO_MONITOREO_ALARMAS
        ? servicio.idServicio
        : null;
    },
  );

  const indicesPorServicioMonitoreo = new Map<number, number[]>();
  idServicioMonitoreoPorIndice.forEach((idServicio, index) => {
    if (idServicio == null) return;
    const grupo = indicesPorServicioMonitoreo.get(idServicio) ?? [];
    grupo.push(index);
    indicesPorServicioMonitoreo.set(idServicio, grupo);
  });

  const grupos: number[][] = [];
  const serviciosYaAgregados = new Set<number>();
  configuracionServicioTarifa.forEach((_, index) => {
    const idServicio = idServicioMonitoreoPorIndice[index];
    if (idServicio == null) {
      grupos.push([index]);
    } else if (!serviciosYaAgregados.has(idServicio)) {
      grupos.push(indicesPorServicioMonitoreo.get(idServicio)!);
      serviciosYaAgregados.add(idServicio);
    }
  });
  return grupos;
};

// Suma un campo numerico opcional del desglose de precio a traves de todas las filas del grupo. Devuelve null
// si ninguna fila tiene valor para ese campo, para distinguir "no vino de la API" de "vino en cero". Se
// convierte con Number(...) antes de sumar por si el campo llega como string (columnas "numeric" del backend
// se serializan asi): sumar strings con += concatena en vez de sumar y termina en NaN al formatear el precio
const sumarCampoPrecio = (
  indices: number[],
  precioOrdenDetalle: PrecioOrdenResponse | null | undefined,
  getter: (detalle: PrecioServicioOrdenResponse) => number | null,
): number | null => {
  let total = 0;
  let algunValor = false;
  indices.forEach((index) => {
    const detalle = precioOrdenDetalle?.servicios[index];
    const valor = detalle ? getter(detalle) : null;
    if (valor == null) return;
    const numero = Number(valor);
    if (Number.isNaN(numero)) return;
    total += numero;
    algunValor = true;
  });
  return algunValor ? total : null;
};

// Tarjeta de un servicio de la orden: representa una sola unidad para el caso general, o todas las unidades de
// un mismo servicio de tipo Monitoreo de Alarmas a la vez. El horario mostrado se toma de la primera fila del
// grupo (todas comparten el mismo, ver ConfigurarHorariosServicios) y el precio se suma entre todas las filas
const renderServicioCard = (
  indices: number[],
  configuracionServicioTarifa: FilaConfiguracion[],
  selectedServices: Servicio[] | undefined,
  precioOrdenDetalle: PrecioOrdenResponse | null | undefined,
) => {
  const indicePrincipal = indices[0];
  const config = configuracionServicioTarifa[indicePrincipal];
  // Datos del servicio (codigo, descripcion, horas...) ya estan disponibles en selectedServices, no hace falta
  // buscarlos por idTarifa contra la tarifa del periodo activo. En ordenes "a la medida" no hay seleccion de
  // servicio (cada fila es un dia), por lo que no habra match aqui
  const servicio = selectedServices?.find(
    (s) => s.idServicio === config.idServicio,
  );
  // El desglose de precio de esta fila viene directo en la respuesta de POST /orden-servicio/obtener-precio,
  // ya no hay que recalcularlo en el front. Se hace match por posicion (configuracionServicioTarifa se guarda
  // tal cual llego esa respuesta, en el mismo orden) en vez de por id: en modo "a la medida" varias filas
  // pueden compartir el mismo idTarifa
  const detallePrincipal = precioOrdenDetalle?.servicios[indicePrincipal];

  const precioTotalGrupo = indices.reduce<number | null>((acc, index) => {
    const fila = configuracionServicioTarifa[index];
    const valor = fila.precio || precioOrdenDetalle?.servicios[index]?.precio;
    const numero = valor == null ? null : Number(valor);
    if (numero == null || Number.isNaN(numero)) return acc;
    return (acc ?? 0) + numero;
  }, null);
  const costosDirectos = sumarCampoPrecio(
    indices,
    precioOrdenDetalle,
    (d) => d.costosDirectos,
  );
  const seguroVida = sumarCampoPrecio(
    indices,
    precioOrdenDetalle,
    (d) => d.seguroVida,
  );
  const aui = sumarCampoPrecio(indices, precioOrdenDetalle, (d) => d.aui);
  const precioAntesIva = sumarCampoPrecio(
    indices,
    precioOrdenDetalle,
    (d) => d.precioAntesIva,
  );
  const iva = sumarCampoPrecio(indices, precioOrdenDetalle, (d) => d.iva);

  return (
    <div key={indices.join("-")} className="p-4">
      {/* Encabezado: codigo/descripcion + tipo de servicio, horario propio de este servicio (o del grupo) */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Typography variant="body2" component="h5" sx={{ fontWeight: 600 }}>
            {servicio?.codigo ? `${servicio.codigo} — ` : ""}
            {servicio?.descripcion ||
              // Ordenes "a la medida": no hay servicio de catalogo, cada fila es un dia.
              // Se recorta a "YYYY-MM-DD" antes de parsear (config.fecha puede venir como
              // timestamp ISO completo) para que safeParseDate no corra el dia por timezone
              (config.fecha
                ? safeParseDate(config.fecha.slice(0, 10)).toLocaleDateString()
                : "Servicio no especificado")}
            {indices.length > 1 && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({indices.length} unidades)
              </Typography>
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {servicio?.idTipoServicio?.descripcion || "Tipo no especificado"}
            {servicio?.idTipoDuracion &&
              (servicio.idTipoDuracion.descripcion?.toLowerCase() === "fija"
                ? ` · Horas fijas: ${servicio.horasFijas ?? 0}h`
                : ` · Horas: ${servicio.horasMinimas ?? 0}h - ${servicio.horasMaximas ?? 0}h`)}
          </Typography>
        </div>
        <Chip
          size="small"
          icon={<CalendarMonthOutlinedIcon />}
          label={`${config.horaInicio || "--:--"} - ${config.horaFin || "--:--"}`}
        />
      </div>

      {/* Personal: comentado a pedido del usuario, no se gestiona por servicio por ahora
          (se habilitara mas adelante). Se deja el bloque listo para reactivar. */}
      {/* {(!servicio || servicio.idTipoServicio?.requierePersonal) && (
        <Typography variant="caption" color="text.secondary" className="mt-2 flex items-center gap-1">
          <Users fontSize="small" />
          Personal: {config.cantidadPersonal ?? 0} requeridos,{" "}
          {("personal" in config && Array.isArray(config.personal)) ? config.personal.length : 0} asignado(s)
        </Typography>
      )} */}

      {/* Precio calculado de este servicio (sumado entre todas las unidades del grupo cuando aplica) */}
      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
        {detallePrincipal?.message && (
          <Typography
            variant="caption"
            color="text.secondary"
            className="flex items-center gap-1.5"
            sx={{ mb: 1, fontStyle: "italic" }}
          >
            <AttachMoneyIcon color="success" sx={{ fontSize: 16 }} />
            {detallePrincipal.message}
          </Typography>
        )}
        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
          <DetailField
            label="Costos Directos"
            value={costosDirectos != null ? priceFormat(costosDirectos) : "-"}
          />
          <DetailField
            label="Seguro de Vida"
            value={seguroVida != null ? priceFormat(seguroVida) : "-"}
          />
          <DetailField label="AUI" value={aui != null ? priceFormat(aui) : "-"} />
          <DetailField
            label="Precio sin IVA"
            value={precioAntesIva != null ? priceFormat(precioAntesIva) : "-"}
          />
          <DetailField label="IVA" value={iva != null ? priceFormat(iva) : "-"} />
          <DetailField
            label="Precio Total"
            value={precioTotalGrupo != null ? priceFormat(precioTotalGrupo) : "No especificado"}
            price
          />
        </div>

        {/* Desglose hora por hora: solo viene lleno para servicios de horario Mixto + Por hora, y solo aplica
            por unidad individual (el grupo unificado de Monitoreo de Alarmas nunca lo usa, es horario fijo) */}
        {indices.length === 1 &&
          detallePrincipal?.costos_horas &&
          detallePrincipal.costos_horas.length > 0 && (
            <DesgloseCostosHoras costosHoras={detallePrincipal.costos_horas} />
          )}
      </Box>
    </div>
  );
};

export const PreviewInformacionOrden = ({
  isEditing = false,
  selectedPuesto,
  selectedCliente = null,
  formOrdenServicio,
  configuracionServicioTarifa,
  selectedServices,
  mensajeRespuesta,
  isIndefinite,
  precioOrdenDetalle = null,
  cobroParcial,
}: {
  isEditing?: boolean;
  selectedPuesto: Puesto | null;
  // Solo tiene valor para ordenes de tipo "Monitoreo de alarmas" (van directo a un cliente, sin puesto/locacion)
  selectedCliente?: Cliente | null;
  formOrdenServicio: CreateOrdenServicioDto | UpdateOrdenServicioDto;
  configuracionServicioTarifa:
    | CreateOrdenServicioTarifaDto[]
    | UpdateOrdenServicioTarifaDto[];
  selectedServices?: Servicio[];
  mensajeRespuesta: string;
  isIndefinite: boolean;
  precioOrdenDetalle?: PrecioOrdenResponse | null;
  cobroParcial?: CobroParcial;
}) => {
  const fechaRegistro = isEditing
    ? (formOrdenServicio as UpdateOrdenServicioDto).fechaActualizacion
    : (formOrdenServicio as CreateOrdenServicioDto).fechaCreacion;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <StepHeader
        title="Información de la orden de servicio"
        description="Revisa los detalles de la orden de servicio y confirma la información"
      />

      {/* Información del Cliente (Monitoreo de alarmas) o Cliente y Ubicación (Vigilancia y escolta): una
          orden de Monitoreo va directa a un cliente, sin puesto/locacion asociado, por lo que no hay
          informacion de ubicacion que mostrar (ver SeleccionarPuestoCliente) */}
      <DetailSection
        icon={<BusinessOutlinedIcon />}
        title={selectedCliente ? "Cliente" : "Cliente y Ubicación"}
      >
        {selectedCliente ? (
          <>
            <DetailField label="Cliente" value={selectedCliente.nombre} />
            <DetailField label="Identificación" value={selectedCliente.numeroIdentificacion} />
            <DetailField
              label="Tipo de Cliente"
              value={selectedCliente.idTipoCliente?.descripcion}
            />
            {selectedCliente.idSubSegmentacion && (
              <DetailField
                label="Subsegmentación"
                value={selectedCliente.idSubSegmentacion.descripcion}
              />
            )}
          </>
        ) : (
          <>
            <DetailField label="Cliente" value={selectedPuesto?.idCliente.nombre} />
            {selectedPuesto?.idClienteFacturacion && (
              <DetailField
                label="Cliente Facturación"
                value={selectedPuesto.idClienteFacturacion.nombre}
              />
            )}
            <DetailField label="Ubicación" value={selectedPuesto?.nombre} />
            <DetailField label="Dirección" value={selectedPuesto?.direccion} />
            <DetailField label="Ciudad" value={selectedPuesto?.idCiudad.descripcion} />
            <DetailField
              label="Responsable"
              value={`${selectedPuesto?.primerNombreResponsable ?? ""} ${selectedPuesto?.primerApellidoResponsable ?? ""}`}
            />
            <DetailField label="Teléfono" value={selectedPuesto?.telefono} />
          </>
        )}
      </DetailSection>

      {/* Fechas de la orden: son las mismas para todos los servicios, se muestran una sola vez.
          La hora de cada servicio (que si varia por servicio) se muestra dentro de su propia fila */}
      <DetailSection icon={<CalendarMonthOutlinedIcon />} title="Fechas">
        <DetailField
          label="Fecha de Inicio"
          value={safeParseDate(formOrdenServicio.fechaInicio).toLocaleDateString()}
        />
        <DetailField
          label="Fecha de Fin"
          value={
            isIndefinite
              ? "Indefinida"
              : formOrdenServicio.fechaFin
                ? safeParseDate(formOrdenServicio.fechaFin).toLocaleDateString()
                : "No especificada"
          }
        />
        {isIndefinite &&
          cobroParcial?.activo &&
          cobroParcial.diaInicio != null &&
          cobroParcial.diaFin != null && (
            <DetailField
              label="Cobro parcial"
              value={textoCobroParcial(cobroParcial.diaInicio, cobroParcial.diaFin)}
              fullWidth
            />
          )}
      </DetailSection>

      {/* Servicios de la orden: una fila apilada por servicio (en vez de varias cajas sueltas por
          servicio), asi la info de N servicios queda agrupada y en el mismo orden en que se seleccionaron.
          Excepcion: cada servicio de tipo Monitoreo de Alarmas comparte un mismo horario entre todas sus
          unidades (ver ConfigurarHorariosServicios) y se resume en una unica tarjeta con el precio sumado de
          esas unidades, en vez de repetir la misma fila una vez por unidad */}
      {configuracionServicioTarifa.length > 0 && (
        <Paper variant="outlined">
          <Typography
            variant="h5"
            component="h4"
            className="flex items-center gap-2 px-4 py-3"
            sx={{ borderBottom: 1, borderColor: "divider", "& svg": { color: "primary.main", fontSize: 20 } }}
          >
            <DescriptionOutlinedIcon />
            Servicios ({configuracionServicioTarifa.length})
          </Typography>
          <Box sx={{ "& > * + *": { borderTop: 1, borderColor: "divider" } }}>
            {agruparIndicesServicios(
              configuracionServicioTarifa,
              selectedServices,
            ).map((indices) =>
              renderServicioCard(
                indices,
                configuracionServicioTarifa,
                selectedServices,
                precioOrdenDetalle,
              ),
            )}
          </Box>
        </Paper>
      )}

      {/* Información de Precio Calculado (total de la orden) */}
      {configuracionServicioTarifa.length > 0 && (
        <Box
          className="flex flex-col gap-2 rounded-lg p-4"
          sx={{
            border: 1,
            borderColor: "success.light",
            bgcolor: (t) => alpha(t.palette.success.main, 0.06),
          }}
        >
          <Typography
            variant="h5"
            component="h4"
            className="flex items-center gap-2"
            sx={{ "& svg": { color: "success.main", fontSize: 20 } }}
          >
            <CalculateOutlinedIcon />
            Precio Calculado
          </Typography>
          <Typography variant="body2">
            <Box component="span" sx={{ fontWeight: 500 }}>
              Mensaje:
            </Box>{" "}
            {mensajeRespuesta}
          </Typography>
          {precioOrdenDetalle && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-3">
              <DetailField
                label="Costos Directos"
                value={
                  precioOrdenDetalle.costosDirectos != null
                    ? priceFormat(precioOrdenDetalle.costosDirectos)
                    : "-"
                }
              />
              <DetailField
                label="Seguro de Vida"
                value={
                  precioOrdenDetalle.seguroVida != null
                    ? priceFormat(precioOrdenDetalle.seguroVida)
                    : "-"
                }
              />
              <DetailField
                label="AUI"
                value={precioOrdenDetalle.aui != null ? priceFormat(precioOrdenDetalle.aui) : "-"}
              />
              <DetailField
                label="Precio sin IVA"
                value={
                  precioOrdenDetalle.precioAntesIva != null
                    ? priceFormat(precioOrdenDetalle.precioAntesIva)
                    : "-"
                }
              />
              <DetailField
                label="IVA"
                value={precioOrdenDetalle.iva != null ? priceFormat(precioOrdenDetalle.iva) : "-"}
              />
            </div>
          )}
          <Typography variant="body2" sx={{ pt: 1, borderTop: 1, borderColor: "success.light" }}>
            <Box component="span" sx={{ fontWeight: 500 }}>
              Precio Total:
            </Box>{" "}
            <Box component="span" sx={{ fontSize: "1.125rem", fontWeight: 600, color: "success.dark" }}>
              {/* Orden indefinida (sin fechaFin): el backend devuelve precio null, se calcula al liquidar/finalizar */}
              {precioOrdenDetalle && precioOrdenDetalle.precio == null
                ? "Pendiente (se calculará al finalizar la orden)"
                : priceFormat(Number(formOrdenServicio.precioTotal))}
            </Box>
          </Typography>
        </Box>
      )}

      {/* Información de Creación */}
      <DetailSection icon={<EditNoteOutlinedIcon />} title="Información de Creación">
        <DetailField
          label={isEditing ? "Fecha de Actualización" : "Fecha de Creación"}
          value={
            fechaRegistro ? new Date(fechaRegistro).toLocaleString() : new Date().toLocaleString()
          }
        />
        <DetailField
          label="Estado Inicial"
          value={<Chip size="small" color="primary" variant="outlined" label="Programada" />}
        />
      </DetailSection>
    </div>
  );
};

// Desglose hora por hora del precio de un servicio de horario Mixto + Por hora: cada tramo diurno/nocturno
// x ordinario/dominical-festivo que abarca el rango de fechas/horas de la orden, con su costo individual
const DesgloseCostosHoras = ({
  costosHoras,
}: {
  costosHoras: CostoHoraOrdenServicio[];
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
      <Button
        size="small"
        onClick={() => setIsOpen((prev) => !prev)}
        startIcon={
          <ExpandMoreIcon
            sx={{ transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "none" }}
          />
        }
      >
        Ver desglose por horas ({costosHoras.length} tramo
        {costosHoras.length === 1 ? "" : "s"})
      </Button>

      <Collapse in={isOpen}>
        <TableContainer sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Fecha", "Horario", "Tipo", "Dominical", "Horas", "Costos Directos", "Seguro Vida", "AUI"].map(
                  (h) => (
                    <TableCell key={h} sx={{ whiteSpace: "nowrap" }}>
                      {h}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {costosHoras.map((tramo, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{tramo.fecha}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {tramo.horaInicio} - {tramo.horaFin}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{tramo.tipoHorario}</TableCell>
                  <TableCell>{tramo.dominical ? "Sí" : "No"}</TableCell>
                  <TableCell>{tramo.horas}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{priceFormat(tramo.costosDirectos)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{priceFormat(tramo.seguroVida)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{priceFormat(tramo.aui)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Box>
  );
};
