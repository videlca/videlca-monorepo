import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  MapPin,
  Receipt,
  User,
} from "lucide-react";
import { SimpleModal } from "../../common/SimpleModal";
import type { OrdenServicio } from "../../../api/types/orden-servicio";
import type { OrdenLiquidada } from "../../../api/types/liquidaciones";
import { useGetLiquidacionesByOrdenId } from "../../../api/queryFunctions/orden-servicio";
import { useGetOrdenLiquidada } from "../../../api/queryFunctions/liquidaciones";
import { priceFormat } from "../../../utils/PriceFormat";
import { timeFormat } from "../../../utils/TimeFormat";
import { safeParseDate } from "../../../utils/DateUtils";

const priceOrNA = (value: number | null | undefined) =>
  value === null || value === undefined ? "N/A" : priceFormat(value);

// "202609" -> "Septiembre 2026". aniomes_liquidacion deberia venir siempre con este formato (ver
// findOrdenLiquidada), pero se defiende contra valores nulos/mal formados que puedan venir de registros
// historicos en el backend para no tumbar todo el modal (ver bug de "Ver" orden en produccion)
const formatAniomes = (aniomes: string | null | undefined) => {
  if (!aniomes || aniomes.length < 6) return "N/A";
  const anio = aniomes.slice(0, 4);
  const mes = Number(aniomes.slice(4));
  const nombre = new Date(Date.UTC(Number(anio), mes - 1, 1)).toLocaleDateString(
    "es-ES",
    { month: "long", timeZone: "UTC" },
  );
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
};

// selectedOrderDetail acepta tanto una orden real (findOne) como el snapshot de una liquidacion especifica
// (GET /liquidaciones/:idLiquidacion/orden), que trae la misma forma con los precios de ese mes. Se distinguen
// por la presencia de idLiquidacion (ver esSnapshotLiquidacion)
type DetalleOrdenOSnapshot = OrdenServicio | OrdenLiquidada;

const esSnapshotLiquidacion = (
  orden: DetalleOrdenOSnapshot,
): orden is OrdenLiquidada => "idLiquidacion" in orden;

export const OrdenDetalles = ({
  isOpenDetails,
  setIsOpenDetails,
  selectedOrderDetail,
  setSelectedOrderDetail,
}: {
  isOpenDetails: boolean;
  setIsOpenDetails: (isOpen: boolean) => void;
  selectedOrderDetail: DetalleOrdenOSnapshot;
  setSelectedOrderDetail?: (selectedOrderDetail: OrdenServicio | null) => void;
}) => {
  // Historial de liquidaciones de esta orden (una por mes ya liquidado). Solo aplica cuando se esta viendo la
  // orden real, no tiene sentido mostrar "liquidaciones de esta liquidacion" dentro del snapshot de una liquidacion
  const esSnapshot = esSnapshotLiquidacion(selectedOrderDetail);

  const [paginaLiquidaciones, setPaginaLiquidaciones] = useState(1);
  const LIMITE_LIQUIDACIONES = 5;

  const { data: liquidacionesOrden, isLoading: isLoadingLiquidacionesOrden } =
    useGetLiquidacionesByOrdenId(
      selectedOrderDetail.idOrdenServicio,
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
      <div className="space-y-6 p-6">
        {esSnapshotLiquidacion(selectedOrderDetail) && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Mostrando lo realmente liquidado en{" "}
            <b>{formatAniomes(selectedOrderDetail.aniomes_liquidacion)}</b>{" "}
            (liquidación #{selectedOrderDetail.idLiquidacion}), no el total de
            toda la orden.
          </div>
        )}
        {/* Puesto */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Puesto</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-600">Nombre</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idLocacion?.nombre || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Dirección</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idLocacion?.direccion || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Responsable</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idLocacion?.primerNombreResponsable}{" "}
                {selectedOrderDetail.idLocacion?.primerApellidoResponsable}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Teléfono</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idLocacion?.telefono || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Coordenadas</p>
              <p className="text-base text-gray-900">
                Lat: {selectedOrderDetail.idLocacion?.latitud}, Long:{" "}
                {selectedOrderDetail.idLocacion?.longitud}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Ciudad</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idLocacion?.idCiudad?.descripcion},{" "}
                {
                  selectedOrderDetail.idLocacion?.idCiudad?.departamento
                    ?.descripcion
                }
                ,{" "}
                {
                  selectedOrderDetail.idLocacion?.idCiudad?.departamento?.pais
                    ?.descripcion
                }
              </p>
            </div>
          </div>

          {/* Cliente */}
          <div className="mt-4 border-t border-gray-300 pt-4">
            <h4 className="mb-3 text-base font-semibold text-gray-900">
              Información del Cliente
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre</p>
                <p className="text-base text-gray-900">
                  {selectedOrderDetail.idLocacion?.idCliente?.nombre || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Identificación
                </p>
                <p className="text-base text-gray-900">
                  {
                    selectedOrderDetail.idLocacion?.idCliente
                      ?.idTipoIdentificacion?.descripcion
                  }
                  :{" "}
                  {
                    selectedOrderDetail.idLocacion?.idCliente
                      ?.numeroIdentificacion
                  }
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tipo de Cliente
                </p>
                <p className="text-base text-gray-900">
                  {selectedOrderDetail.idLocacion?.idCliente?.idTipoCliente
                    ?.descripcion || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Segmentación
                </p>
                <p className="text-base text-gray-900">
                  {selectedOrderDetail.idLocacion?.idCliente?.idSubSegmentacion
                    ?.segmentacion?.descripcion || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información Básica de la Orden */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Información de la Orden
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-600">ID Orden</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idOrdenServicio}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Descripción ID
              </p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.ordenServicioId?.descripcionId || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Precio Total</p>
              <p className="text-base font-semibold text-green-700">
                {priceFormat(selectedOrderDetail.precioTotal)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Fecha de Creación
              </p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.fechaCreacion}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Fecha de Actualización
              </p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.fechaActualizacion}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Anulado</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.ordenServicioId?.anulado ? "Sí" : "No"}
              </p>
            </div>
          </div>
        </div>

        {/* Usuario Creador */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center space-x-2">
            <User className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Usuario Creador
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Nombre Completo
              </p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idUsuarioCreacion?.primerNombre}{" "}
                {selectedOrderDetail.idUsuarioCreacion?.segundoNombre || ""}{" "}
                {selectedOrderDetail.idUsuarioCreacion?.primerApellido}{" "}
                {selectedOrderDetail.idUsuarioCreacion?.segundoApellido || ""}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idUsuarioCreacion?.email || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Identificación
              </p>
              <p className="text-base text-gray-900">
                {
                  selectedOrderDetail.idUsuarioCreacion?.idTipoIdentificacion
                    ?.descripcion
                }
                : {selectedOrderDetail.idUsuarioCreacion?.numeroIdentificacion}
              </p>
            </div>
          </div>
        </div>

        {/* Estado de la Orden */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Estado de la Orden de Servicio
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-600">Estado</p>
              <span className="inline-block rounded-full border border-gray-300 px-3 py-1 text-sm font-medium text-green-800">
                {selectedOrderDetail.idEstadoOrdenServicio?.nombre || "N/A"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Programable</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idEstadoOrdenServicio?.programable
                  ? "Sí"
                  : "No"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-600">Descripción</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idEstadoOrdenServicio?.descripcion ||
                  "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Fechas de la Orden */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Fecha Orden de Servicio
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Fecha de Inicio
              </p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.fechaInicio}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Fecha de Fin</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.fechaFin}
              </p>
            </div>
            {/* Fecha Ordenes son las que se actualizan */}
            <div>
              <p className="text-sm font-medium text-gray-600">
                Fecha Inicio Orden (Actualizada)
              </p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.fechaInicioOrden}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Fecha Fin Orden (Actualizada)
              </p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.fechaFinOrden}
              </p>
            </div>
          </div>
        </div>

        {/* Tarifas */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center space-x-2">
            <CircleDollarSign className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Tarifas y Servicios
            </h3>
          </div>
          <div className="space-y-4">
            {selectedOrderDetail.detalles?.map((detalle, index) => {
              // idTarifa siempre viene con su idServicio cargado (ver findOneOrdenRelations en el backend)
              const servicio = detalle.idTarifa?.idServicio;

              return (
                <div
                  key={detalle.idOrdenServicioDetalle ?? index}
                  className="rounded-lg border border-gray-300 bg-white p-4"
                >
                  <h4 className="mb-3 text-base font-semibold text-gray-900">
                    {servicio?.codigo
                      ? `${servicio.codigo} — ${servicio.descripcion}`
                      : `Detalle ${index + 1}`}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Horario
                      </p>
                      <p className="text-base text-gray-900">
                        {timeFormat(detalle.horaInicio)} -{" "}
                        {timeFormat(detalle.horaFin)}
                      </p>
                    </div>
                    {/* fecha/cantidadHoras solo traen valor en ordenes "a la medida": cada fila es un dia
                        especifico del rango (en "catalogo" son null, no se muestran) */}
                    {detalle.fecha && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Fecha
                        </p>
                        <p className="text-base text-gray-900">
                          {safeParseDate(
                            detalle.fecha.slice(0, 10),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {detalle.cantidadHoras != null && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Cantidad de Horas
                        </p>
                        <p className="text-base text-gray-900">
                          {detalle.cantidadHoras}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Precio
                      </p>
                      <p className="text-base font-semibold text-green-700">
                        {priceOrNA(detalle.precio)}
                      </p>
                    </div>

                    {/* Información del Servicio */}
                    {servicio && (
                      <div className="mt-2 border-t border-gray-200 pt-3 md:col-span-2 lg:col-span-3">
                        <h5 className="mb-2 text-sm font-semibold text-gray-900">
                          Servicio
                        </h5>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <p className="text-xs font-medium text-gray-600">
                              Código
                            </p>
                            <p className="text-sm text-gray-900">
                              {servicio.codigo}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">
                              Descripción
                            </p>
                            <p className="text-sm text-gray-900">
                              {servicio.descripcion}
                            </p>
                          </div>
                          {/* Cada campo solo se muestra si realmente trae valor: no tiene sentido pintar
                              una etiqueta vacia cuando la relacion no vino cargada (ver findOrdenLiquidada
                              en el backend) o simplemente no aplica para este servicio */}
                          {servicio.idTipoServicio?.nombre && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">
                                Tipo de Servicio
                              </p>
                              <p className="text-sm text-gray-900">
                                {servicio.idTipoServicio.nombre}
                              </p>
                            </div>
                          )}
                          {servicio.idTipoDuracion?.descripcion && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">
                                Duración
                              </p>
                              <p className="text-sm text-gray-900">
                                {servicio.idTipoDuracion.descripcion}
                              </p>
                            </div>
                          )}
                          {servicio.idTipoHorarioDescripcion?.nombre && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">
                                Horario
                              </p>
                              <p className="text-sm text-gray-900">
                                {servicio.idTipoHorarioDescripcion.nombre}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-gray-600">
                              Horas Fijas
                            </p>
                            <p className="text-sm text-gray-900">
                              {servicio.horasFijas}
                            </p>
                          </div>
                          {servicio.idTipoTarifa?.nombre && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">
                                Tipo Tarifa
                              </p>
                              <p className="text-sm text-gray-900">
                                {servicio.idTipoTarifa.nombre}
                              </p>
                            </div>
                          )}
                          {servicio.idTipoTarifa?.cantidadTiempo != null && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">
                                Cantidad Tiempo
                              </p>
                              <p className="text-sm text-gray-900">
                                {servicio.idTipoTarifa.cantidadTiempo}{" "}
                                {
                                  servicio.idTipoTarifa.idTipoUnidadTiempo
                                    ?.descripcion
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-2 border-t border-gray-200 pt-3 md:col-span-2 lg:col-span-3">
                      <h5 className="mb-2 text-sm font-semibold text-gray-900">
                        Desglose de Costos
                      </h5>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div>
                          <p className="text-xs font-medium text-gray-600">
                            Costos Directos
                          </p>
                          <p className="text-sm text-gray-900">
                            {priceOrNA(detalle.costosDirectos)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">
                            Seguro de Vida
                          </p>
                          <p className="text-sm text-gray-900">
                            {priceOrNA(detalle.seguroVida)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">
                            AUI
                          </p>
                          <p className="text-sm text-gray-900">
                            {priceOrNA(detalle.aui)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">
                            IVA
                          </p>
                          <p className="text-sm text-gray-900">
                            {priceOrNA(detalle.iva)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">
                            Precio Antes IVA
                          </p>
                          <p className="text-sm text-gray-900">
                            {priceOrNA(detalle.precioAntesIva)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">
                            Precio Total
                          </p>
                          <p className="text-sm font-semibold text-green-700">
                            {priceOrNA(detalle.precio)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {(!selectedOrderDetail.detalles ||
              selectedOrderDetail.detalles.length === 0) && (
              <p className="text-center text-sm text-gray-500">
                Esta orden no tiene servicios registrados
              </p>
            )}
          </div>
        </div>

        {/* Historial de Liquidaciones: solo tiene sentido sobre la orden real, no dentro del snapshot de
            una liquidacion puntual (evita anidar "liquidaciones de esta liquidacion") */}
        {!esSnapshot && (
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Historial de Liquidaciones
              </h3>
            </div>

            {isLoadingLiquidacionesOrden ? (
              <p className="text-sm text-gray-500">Cargando liquidaciones...</p>
            ) : liquidacionesOrden?.data?.items &&
              liquidacionesOrden.data.items.length > 0 ? (
              <>
                <div className="divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-200">
                  {liquidacionesOrden.data.items.map((liquidacion) => (
                    <button
                      key={liquidacion.idLiquidacion}
                      type="button"
                      disabled={isLoadingOrdenLiquidada}
                      className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-50"
                      onClick={() =>
                        getOrdenLiquidadaMutation(liquidacion.idLiquidacion, {
                          onSuccess: (response) => {
                            if (response.status === 200 || response.status === 201) {
                              setIsOpenLiquidacionDetalle(true);
                            }
                          },
                        })
                      }
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {formatAniomes(liquidacion.aniomes_liquidacion)}
                      </span>
                      <span className="text-sm font-semibold text-green-700">
                        {priceFormat(liquidacion.valor_liquidacion)}
                      </span>
                    </button>
                  ))}
                </div>

                {liquidacionesOrden.data.total > LIMITE_LIQUIDACIONES && (
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <button
                      type="button"
                      disabled={paginaLiquidaciones <= 1}
                      className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => setPaginaLiquidaciones((p) => p - 1)}
                    >
                      Anterior
                    </button>
                    <span>Página {paginaLiquidaciones}</span>
                    <button
                      type="button"
                      disabled={
                        paginaLiquidaciones * LIMITE_LIQUIDACIONES >=
                        liquidacionesOrden.data.total
                      }
                      className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => setPaginaLiquidaciones((p) => p + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Esta orden todavía no tiene liquidaciones registradas
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end border-t border-gray-200 px-6 pt-6 pb-4">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          onClick={() => setIsOpenDetails(false)}
        >
          Cerrar
        </button>
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
