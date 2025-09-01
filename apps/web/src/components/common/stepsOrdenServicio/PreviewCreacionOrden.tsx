import {
  Building2,
  Calculator,
  Calendar,
  DollarSign,
  FilePenIcon,
  FileText,
  Users,
} from "lucide-react";
import { priceFormat } from "../../../utils/PriceFormat";
import type { Locacion } from "../../../types";
import type { Tarifa } from "../../../api/types/periodo";
import type { CreateOrdenServicioDto } from "../../../api/dtos";
import type { CreateOrdenServicioTarifaDto } from "../../../api/dtos";

export const PreviewCreacionOrden = ({
  selectedLocation,
  selectedTarifa,
  formOrdenServicio,
  configuracionServicioTarifa,
  mensajeRespuesta,
  isIndefinite,
}: {
  selectedLocation: Locacion | null;
  selectedTarifa: Tarifa | null;
  formOrdenServicio: CreateOrdenServicioDto;
  configuracionServicioTarifa: CreateOrdenServicioTarifaDto[];
  mensajeRespuesta: string;
  isIndefinite: boolean;
}) => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Detalles de la orden de servicio
        </h3>
        <p className="text-sm text-gray-600">
          Revisa los detalles de la orden de servicio y confirma la creación
        </p>
      </div>

      <div className="space-y-6">
        {/* Información del Cliente y Ubicación */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Building2 className="h-6 w-6 text-blue-600" />
            Cliente y Ubicación
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Cliente:</span>{" "}
                <span className="text-gray-600">
                  {selectedLocation?.idCliente.nombre}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Ubicación:</span>{" "}
                <span className="text-gray-600">
                  {selectedLocation?.nombre}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Dirección:</span>{" "}
                <span className="text-gray-600">
                  {selectedLocation?.direccion}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Ciudad:</span>{" "}
                <span className="text-gray-600">
                  {selectedLocation?.idCiudad.descripcion}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Responsable:</span>{" "}
                <span className="text-gray-600">
                  {selectedLocation?.primerNombreResponsable}{" "}
                  {selectedLocation?.primerApellidoResponsable}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Teléfono:</span>{" "}
                <span className="text-gray-600">
                  {selectedLocation?.telefono}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Información del Servicio */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FileText className="h-6 w-6 text-green-600" />
            Servicio
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Código:</span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idServicio.codigo}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Descripción:</span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idServicio.descripcion}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Tipo de Servicio:
                </span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idServicio.idTipoServicio.descripcion}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Requiere Personal:
                </span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idServicio.idTipoServicio.requierePersonal
                    ? "Sí"
                    : "No"}
                </span>
              </p>
            </div>
            <div>
              {/* <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Duración:
                </span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idServicio?.idTipoDuracion
                    ?.descripcion || "No especificada"}{" "}
                </span>
              </p> */}
              <p className="text-sm">
                <span className="font-medium text-gray-700">Horas Fijas:</span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idServicio.horasFijas} horas
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Horas Máximas:
                </span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idServicio.horasMaximas} horas
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Horas Mínimas:
                </span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idServicio.horasMinimas} horas
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Información de Fechas y Horarios */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Calendar className="h-6 w-6 text-purple-600" />
            Fechas y Horarios
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Fecha de Inicio:
                </span>{" "}
                <span className="text-gray-600">
                  {new Date(formOrdenServicio.fechaInicio).toLocaleDateString()}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Fecha de Fin:</span>{" "}
                <span className="text-gray-600">
                  {isIndefinite
                    ? "Indefinida"
                    : formOrdenServicio.fechaFin
                      ? new Date(
                          formOrdenServicio.fechaFin,
                        ).toLocaleDateString()
                      : "No especificada"}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Hora de Inicio:
                </span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idServicio.horasFijas === 24
                    ? "00:00:00 (24 horas)"
                    : "00:00:00"}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Hora de Fin:</span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idServicio.horasFijas === 24
                    ? "00:00:00 (24 horas)"
                    : "00:00:00"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Información del Personal */}
        {/* TODO: Revisar información de personal */}
        {selectedTarifa?.idServicio.idTipoServicio.requierePersonal && (
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Users className="h-6 w-6 text-orange-600" />
              Personal
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">
                    Cantidad de Personal:
                  </span>{" "}
                  <span className="text-gray-600">{0} requeridos</span>
                </p>
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">
                    Personal Asignado:
                  </span>{" "}
                  <span className="text-gray-600">
                    {configuracionServicioTarifa.length > 0
                      ? `${configuracionServicioTarifa.length} asignado(s)`
                      : "Pendiente de asignación"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Información de Tarifa y Precios */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <DollarSign className="h-6 w-6 text-green-600" />
            Tarifa y Precios
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Período:</span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idPeriodo.nombre}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Tipo de Tarifa:
                </span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idTipoTarifa.nombre}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Unidad de Tiempo:
                </span>{" "}
                <span className="text-gray-600">
                  {selectedTarifa?.idTipoTarifa?.idTipoUnidadTiempo
                    ?.descripcion || "No especificada"}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Precio sin IVA:
                </span>{" "}
                <span className="text-gray-600">
                  {priceFormat(selectedTarifa?.precioAntesIva || 0)}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">IVA:</span>{" "}
                <span className="text-gray-600">
                  {priceFormat(selectedTarifa?.iva || 0)}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Precio Total Base:
                </span>{" "}
                <span className="font-semibold text-green-600">
                  {priceFormat(selectedTarifa?.precioTotal || 0)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Información de Precio Calculado */}
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
              <p className="text-sm">
                <span className="font-medium text-green-800 capitalize">
                  Precio:
                </span>{" "}
                <span className="text-green-700">
                  {priceFormat(Number(formOrdenServicio.precioTotal))}
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
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">
                  Fecha de Creación:
                </span>{" "}
                <span className="text-gray-600">
                  {formOrdenServicio.fechaCreacion
                    ? new Date(formOrdenServicio.fechaCreacion).toLocaleString()
                    : new Date().toLocaleString()}
                </span>
              </p>
            </div>
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
