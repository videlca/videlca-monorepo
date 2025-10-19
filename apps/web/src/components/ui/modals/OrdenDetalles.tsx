import {
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  MapPin,
  User,
} from "lucide-react";
import { SimpleModal } from "../../common/SimpleModal";
import type { OrdenServicio } from "../../../api/types/orden-servicio";
import { priceFormat } from "../../../utils/PriceFormat";
import { timeFormat } from "../../../utils/TimeFormat";

export const OrdenDetalles = ({
  isOpenDetails,
  setIsOpenDetails,
  selectedOrderDetail,
  setSelectedOrderDetail,
}: {
  isOpenDetails: boolean;
  setIsOpenDetails: (isOpen: boolean) => void;
  selectedOrderDetail: OrdenServicio;
  setSelectedOrderDetail?: (selectedOrderDetail: OrdenServicio | null) => void;
}) => {
  return (
    <SimpleModal
      isOpen={isOpenDetails}
      onClose={() => {
        setIsOpenDetails(false);
        if (setSelectedOrderDetail) {
          setSelectedOrderDetail(null);
        }
      }}
      title="Detalles de la orden de servicio"
      size="3xl"
    >
      <div className="space-y-6 p-6">
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
            <div>
              <p className="text-sm font-medium text-gray-600">Rol</p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.idUsuarioCreacion?.idRol?.nombreRol ||
                  "N/A"}
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

        {/* Localización */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Localización
            </h3>
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
            <div>
              <p className="text-sm font-medium text-gray-600">
                Fecha Inicio Orden
              </p>
              <p className="text-base text-gray-900">
                {selectedOrderDetail.fechaInicioOrden}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Fecha Fin Orden
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
            {selectedOrderDetail.tarifas?.map((tarifa: any, index: number) => (
              <div
                key={tarifa.idOrdenServicioTarifa}
                className="rounded-lg border border-gray-300 bg-white p-4"
              >
                <h4 className="mb-3 text-base font-semibold text-gray-900">
                  Tarifa {index + 1}
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Cantidad Personal
                    </p>
                    <p className="text-base text-gray-900">
                      {tarifa.cantidadPersonal}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Horario</p>
                    <p className="text-base text-gray-900">
                      {timeFormat(tarifa.horaInicio)} -{" "}
                      {timeFormat(tarifa.horaFin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Precio</p>
                    <p className="text-base font-semibold text-green-700">
                      {priceFormat(tarifa.precio)}
                    </p>
                  </div>

                  {/* Información del Servicio */}
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
                          {tarifa.idTarifa?.idServicio?.codigo}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Descripción
                        </p>
                        <p className="text-sm text-gray-900">
                          {tarifa.idTarifa?.idServicio?.descripcion}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Tipo de Servicio
                        </p>
                        <p className="text-sm text-gray-900">
                          {tarifa.idTarifa?.idServicio?.idTipoServicio?.nombre}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Duración
                        </p>
                        <p className="text-sm text-gray-900">
                          {
                            tarifa.idTarifa?.idServicio?.idTipoDuracion
                              ?.descripcion
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Horario
                        </p>
                        <p className="text-sm text-gray-900">
                          {
                            tarifa.idTarifa?.idServicio
                              ?.idTipoHorarioDescripcion?.nombre
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Horas
                        </p>
                        <p className="text-sm text-gray-900">
                          {tarifa.idTarifa?.idServicio?.horasFijas > 0
                            ? `Fijas: ${tarifa.idTarifa?.idServicio?.horasFijas}`
                            : `Min: ${tarifa.idTarifa?.idServicio?.horasMinimas}, Max: ${tarifa.idTarifa?.idServicio?.horasMaximas}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Desglose de Costos */}
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
                          {priceFormat(tarifa.idTarifa?.costosDirectos)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Seguro de Vida
                        </p>
                        <p className="text-sm text-gray-900">
                          {priceFormat(tarifa.idTarifa?.seguroVida)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">AUI</p>
                        <p className="text-sm text-gray-900">
                          {priceFormat(tarifa.idTarifa?.aui)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">IVA</p>
                        <p className="text-sm text-gray-900">
                          {priceFormat(tarifa.idTarifa?.iva)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Precio Antes IVA
                        </p>
                        <p className="text-sm text-gray-900">
                          {priceFormat(tarifa.idTarifa?.precioAntesIva)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Precio Total
                        </p>
                        <p className="text-sm font-semibold text-green-700">
                          {priceFormat(tarifa.idTarifa?.precioTotal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Tipo Tarifa
                        </p>
                        <p className="text-sm text-gray-900">
                          {tarifa.idTarifa?.idTipoTarifa?.nombre}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Cantidad Tiempo
                        </p>
                        <p className="text-sm text-gray-900">
                          {tarifa.idTarifa?.idTipoTarifa?.cantidadTiempo ||
                            "N/A"}{" "}
                          {
                            tarifa.idTarifa?.idTipoTarifa?.idTipoUnidadTiempo
                              ?.descripcion
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
  );
};
