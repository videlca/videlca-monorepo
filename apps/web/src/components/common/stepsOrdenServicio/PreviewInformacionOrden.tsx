import {
  Building2,
  Calculator,
  Calendar,
  ChevronDown,
  DollarSign,
  FilePenIcon,
  FileText,
  // Users, // Se vuelve a necesitar cuando se reactive el bloque de Personal por servicio (ver mas abajo)
} from "lucide-react";
import { useState } from "react";
import { priceFormat } from "../../../utils/PriceFormat";
import { safeParseDate } from "../../../utils/DateUtils";
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
          <h5 className="text-sm font-semibold text-gray-900">
            {servicio?.codigo ? `${servicio.codigo} — ` : ""}
            {servicio?.descripcion ||
              // Ordenes "a la medida": no hay servicio de catalogo, cada fila es un dia.
              // Se recorta a "YYYY-MM-DD" antes de parsear (config.fecha puede venir como
              // timestamp ISO completo) para que safeParseDate no corra el dia por timezone
              (config.fecha
                ? safeParseDate(config.fecha.slice(0, 10)).toLocaleDateString()
                : "Servicio no especificado")}
            {indices.length > 1 && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({indices.length} unidades)
              </span>
            )}
          </h5>
          <p className="text-xs text-gray-500">
            {servicio?.idTipoServicio?.descripcion || "Tipo no especificado"}
            {servicio?.idTipoDuracion &&
              (servicio.idTipoDuracion.descripcion?.toLowerCase() === "fija"
                ? ` · Horas fijas: ${servicio.horasFijas ?? 0}h`
                : ` · Horas: ${servicio.horasMinimas ?? 0}h - ${servicio.horasMaximas ?? 0}h`)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-gray-700">
          <Calendar className="h-3 w-3" />
          {config.horaInicio || "--:--"} - {config.horaFin || "--:--"}
        </span>
      </div>

      {/* Personal: comentado a pedido del usuario, no se gestiona por servicio por ahora
          (se habilitara mas adelante). Se deja el bloque listo para reactivar. */}
      {/* {(!servicio || servicio.idTipoServicio?.requierePersonal) && (
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            Personal: {config.cantidadPersonal ?? 0} requeridos,{" "}
            {("personal" in config && Array.isArray(config.personal)) ? config.personal.length : 0} asignado(s)
          </span>
        </div>
      )} */}

      {/* Precio calculado de este servicio (sumado entre todas las unidades del grupo cuando aplica) */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        {detallePrincipal?.message && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-gray-500 italic">
            <DollarSign className="h-3.5 w-3.5 shrink-0 text-green-600" />
            {detallePrincipal.message}
          </p>
        )}
        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
          <p>
            <span className="block text-gray-500">Costos Directos</span>
            <span className="font-medium text-gray-800">
              {costosDirectos != null ? priceFormat(costosDirectos) : "-"}
            </span>
          </p>
          <p>
            <span className="block text-gray-500">Seguro de Vida</span>
            <span className="font-medium text-gray-800">
              {seguroVida != null ? priceFormat(seguroVida) : "-"}
            </span>
          </p>
          <p>
            <span className="block text-gray-500">AUI</span>
            <span className="font-medium text-gray-800">
              {aui != null ? priceFormat(aui) : "-"}
            </span>
          </p>
          <p>
            <span className="block text-gray-500">Precio sin IVA</span>
            <span className="font-medium text-gray-800">
              {precioAntesIva != null ? priceFormat(precioAntesIva) : "-"}
            </span>
          </p>
          <p>
            <span className="block text-gray-500">IVA</span>
            <span className="font-medium text-gray-800">
              {iva != null ? priceFormat(iva) : "-"}
            </span>
          </p>
          <p>
            <span className="block text-gray-500">Precio Total</span>
            <span className="font-semibold text-green-600">
              {precioTotalGrupo != null
                ? priceFormat(precioTotalGrupo)
                : "No especificado"}
            </span>
          </p>
        </div>

        {/* Desglose hora por hora: solo viene lleno para servicios de horario Mixto + Por hora, y solo aplica
            por unidad individual (el grupo unificado de Monitoreo de Alarmas nunca lo usa, es horario fijo) */}
        {indices.length === 1 &&
          detallePrincipal?.costos_horas &&
          detallePrincipal.costos_horas.length > 0 && (
            <DesgloseCostosHoras costosHoras={detallePrincipal.costos_horas} />
          )}
      </div>
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
}) => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Información de la orden de servicio
        </h3>
        <p className="text-sm text-gray-600">
          Revisa los detalles de la orden de servicio y confirma la información
        </p>
      </div>

      <div className="space-y-6">
        {/* Información del Cliente (Monitoreo de alarmas) o Cliente y Ubicación (Vigilancia y escolta): una
            orden de Monitoreo va directa a un cliente, sin puesto/locacion asociado, por lo que no hay
            informacion de ubicacion que mostrar (ver SeleccionarPuestoCliente) */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Building2 className="h-6 w-6 text-blue-600" />
            {selectedCliente ? "Cliente" : "Cliente y Ubicación"}
          </h4>
          {selectedCliente ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Cliente:</span>{" "}
                  <span className="text-gray-600">{selectedCliente.nombre}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Identificación:</span>{" "}
                  <span className="text-gray-600">
                    {selectedCliente.numeroIdentificacion}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Tipo de Cliente:</span>{" "}
                  <span className="text-gray-600">
                    {selectedCliente.idTipoCliente?.descripcion}
                  </span>
                </p>
                {selectedCliente.idSubSegmentacion && (
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Subsegmentación:</span>{" "}
                    <span className="text-gray-600">
                      {selectedCliente.idSubSegmentacion.descripcion}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Cliente:</span>{" "}
                  <span className="text-gray-600">
                    {selectedPuesto?.idCliente.nombre}
                  </span>
                </p>
                {selectedPuesto?.idClienteFacturacion && (
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Cliente Facturación:</span>{" "}
                    <span className="text-gray-600">
                      {selectedPuesto.idClienteFacturacion.nombre}
                    </span>
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Ubicación:</span>{" "}
                  <span className="text-gray-600">{selectedPuesto?.nombre}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Dirección:</span>{" "}
                  <span className="text-gray-600">
                    {selectedPuesto?.direccion}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Ciudad:</span>{" "}
                  <span className="text-gray-600">
                    {selectedPuesto?.idCiudad.descripcion}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Responsable:</span>{" "}
                  <span className="text-gray-600">
                    {selectedPuesto?.primerNombreResponsable}{" "}
                    {selectedPuesto?.primerApellidoResponsable}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Teléfono:</span>{" "}
                  <span className="text-gray-600">
                    {selectedPuesto?.telefono}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Fechas de la orden: son las mismas para todos los servicios, se muestran una sola vez.
            La hora de cada servicio (que si varia por servicio) se muestra dentro de su propia fila */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-4 py-3">
          <span className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-gray-700">Fecha de Inicio:</span>{" "}
            <span className="text-gray-600">
              {safeParseDate(formOrdenServicio.fechaInicio).toLocaleDateString()}
            </span>
          </span>
          <span className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Fecha de Fin:</span>{" "}
            <span className="text-gray-600">
              {isIndefinite
                ? "Indefinida"
                : formOrdenServicio.fechaFin
                  ? safeParseDate(formOrdenServicio.fechaFin).toLocaleDateString()
                  : "No especificada"}
            </span>
          </span>
        </div>

        {/* Servicios de la orden: una fila apilada por servicio (en vez de varias cajas sueltas por
            servicio), asi la info de N servicios queda agrupada y en el mismo orden en que se seleccionaron.
            Excepcion: cada servicio de tipo Monitoreo de Alarmas comparte un mismo horario entre todas sus
            unidades (ver ConfigurarHorariosServicios) y se resume en una unica tarjeta con el precio sumado de
            esas unidades, en vez de repetir la misma fila una vez por unidad */}
        {configuracionServicioTarifa.length > 0 && (
          <div className="rounded-lg border border-gray-200">
            <h4 className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900">
              <FileText className="h-6 w-6 text-green-600" />
              Servicios ({configuracionServicioTarifa.length})
            </h4>
            <div className="divide-y divide-gray-100">
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
            </div>
          </div>
        )}

        {/* Información de Precio Calculado (total de la orden) */}
        {configuracionServicioTarifa.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-green-900">
              <Calculator className="h-6 w-6 text-green-600" />
              Precio Calculado
            </h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-green-800 capitalize">
                  Mensaje:
                </span>{" "}
                <span className="text-green-700">{mensajeRespuesta}</span>
              </p>
              {precioOrdenDetalle && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 md:grid-cols-3">
                  <p className="text-sm">
                    <span className="font-medium text-green-800">
                      Costos Directos:
                    </span>{" "}
                    <span className="text-green-700">
                      {precioOrdenDetalle.costosDirectos != null
                        ? priceFormat(precioOrdenDetalle.costosDirectos)
                        : "-"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-green-800">
                      Seguro de Vida:
                    </span>{" "}
                    <span className="text-green-700">
                      {precioOrdenDetalle.seguroVida != null
                        ? priceFormat(precioOrdenDetalle.seguroVida)
                        : "-"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-green-800">AUI:</span>{" "}
                    <span className="text-green-700">
                      {precioOrdenDetalle.aui != null
                        ? priceFormat(precioOrdenDetalle.aui)
                        : "-"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-green-800">
                      Precio sin IVA:
                    </span>{" "}
                    <span className="text-green-700">
                      {precioOrdenDetalle.precioAntesIva != null
                        ? priceFormat(precioOrdenDetalle.precioAntesIva)
                        : "-"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-green-800">IVA:</span>{" "}
                    <span className="text-green-700">
                      {precioOrdenDetalle.iva != null
                        ? priceFormat(precioOrdenDetalle.iva)
                        : "-"}
                    </span>
                  </p>
                </div>
              )}
              <p className="text-sm">
                <span className="font-medium text-green-800 capitalize">
                  Precio Total:
                </span>{" "}
                <span className="text-lg font-semibold text-green-700">
                  {/* Orden indefinida (sin fechaFin): el backend devuelve precio null, se calcula al liquidar/finalizar */}
                  {precioOrdenDetalle && precioOrdenDetalle.precio == null
                    ? "Pendiente (se calculará al finalizar la orden)"
                    : priceFormat(Number(formOrdenServicio.precioTotal))}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Información de Creación */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FilePenIcon className="h-6 w-6 text-green-600" />
            Información de Creación
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isEditing ? (
              <div>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">
                    Fecha de Actualización:
                  </span>{" "}
                  <span className="text-gray-600">
                    {(formOrdenServicio as UpdateOrdenServicioDto)
                      .fechaActualizacion
                      ? new Date(
                          (
                            formOrdenServicio as UpdateOrdenServicioDto
                          ).fechaActualizacion,
                        ).toLocaleString()
                      : new Date().toLocaleString()}
                  </span>
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">
                    Fecha de Creación:
                  </span>{" "}
                  <span className="text-gray-600">
                    {(formOrdenServicio as CreateOrdenServicioDto).fechaCreacion
                      ? new Date(
                          (
                            formOrdenServicio as CreateOrdenServicioDto
                          ).fechaCreacion,
                        ).toLocaleString()
                      : new Date().toLocaleString()}
                  </span>
                </p>
              </div>
            )}

            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Estado Inicial:
                </span>{" "}
                <span className="font-medium text-blue-600">Programada</span>
              </p>
            </div>
          </div>
        </div>
      </div>
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
    <div className="mt-4 border-t border-gray-200 pt-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
        Ver desglose por horas ({costosHoras.length} tramo
        {costosHoras.length === 1 ? "" : "s"})
      </button>

      {isOpen && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-1 pr-2 font-medium">Fecha</th>
                <th className="py-1 pr-2 font-medium">Horario</th>
                <th className="py-1 pr-2 font-medium">Tipo</th>
                <th className="py-1 pr-2 font-medium">Dominical</th>
                <th className="py-1 pr-2 font-medium">Horas</th>
                <th className="py-1 pr-2 font-medium">Costos Directos</th>
                <th className="py-1 pr-2 font-medium">Seguro Vida</th>
                <th className="py-1 font-medium">AUI</th>
              </tr>
            </thead>
            <tbody>
              {costosHoras.map((tramo, index) => (
                <tr key={index} className="border-b border-gray-100 text-gray-600">
                  <td className="py-1 pr-2 whitespace-nowrap">{tramo.fecha}</td>
                  <td className="py-1 pr-2 whitespace-nowrap">
                    {tramo.horaInicio} - {tramo.horaFin}
                  </td>
                  <td className="py-1 pr-2 capitalize">{tramo.tipoHorario}</td>
                  <td className="py-1 pr-2">{tramo.dominical ? "Sí" : "No"}</td>
                  <td className="py-1 pr-2">{tramo.horas}</td>
                  <td className="py-1 pr-2 whitespace-nowrap">
                    {priceFormat(tramo.costosDirectos)}
                  </td>
                  <td className="py-1 pr-2 whitespace-nowrap">
                    {priceFormat(tramo.seguroVida)}
                  </td>
                  <td className="py-1 whitespace-nowrap">
                    {priceFormat(tramo.aui)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
