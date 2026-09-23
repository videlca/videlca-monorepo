import { Check, Minus, Plus } from "lucide-react";
import { priceFormat } from "../../../utils/PriceFormat";
import type { Servicio, TipoServicio } from "../../../api/types/servicio";
import type { Tarifa } from "../../../api/types/periodo";

// Distingue visualmente los servicios por turno de los mensuales, sin llamar demasiado la atención
const getServiceStyle = (descripcion: string) => {
  if (descripcion.startsWith("Turno")) {
    return { text: "text-[#F4A100]", border: "border-[#F4A100]" };
  }
  if (descripcion.startsWith("Mes")) {
    return { text: "text-[#386641]", border: "border-[#A7C957]" };
  }
  return { text: "text-gray-900", border: "border-gray-200" };
};

export const SeleccionarServicio = ({
  selectedServices,
  tarifasPeriodoActivoByIdTipoServicioData,
  tipoServiciosQuery,
  handleIncrementarServicio,
  handleDecrementarServicio,
  handleSetCantidadServicio,
}: {
  selectedServices: Servicio[];
  tarifasPeriodoActivoByIdTipoServicioData: Tarifa[];
  tipoServiciosQuery: TipoServicio[];
  handleIncrementarServicio: (tarifa: Tarifa) => void;
  handleDecrementarServicio: (tarifa: Tarifa) => void;
  handleSetCantidadServicio: (tarifa: Tarifa, cantidad: number) => void;
}) => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Servicio a Prestar
        </h3>
        <p className="text-sm text-gray-600">
          Seleccione el tipo de servicio que se prestará, y la cantidad de
          unidades que necesita de cada uno
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-3 flex flex-row items-center justify-between text-sm font-medium text-gray-700">
            <span className="font-bold">Servicios Disponibles.</span>
            <span className="text-sm">
              Unidades seleccionadas: {selectedServices.length}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {(tarifasPeriodoActivoByIdTipoServicioData || []).map((tarifa) => {
              // Cantidad de unidades ya elegidas de este servicio (selectedServices trae una entrada por
              // cada unidad seleccionada, no una por servicio distinto: ver handleIncrementarServicio)
              const cantidad = selectedServices.filter(
                (s) => s.idServicio === tarifa.idServicio.idServicio,
              ).length;
              const serviceStyle = getServiceStyle(
                tarifa.idServicio.descripcion,
              );

              return (
                <div
                  key={tarifa.idServicio.idServicio}
                  className={`rounded-lg border p-4 transition-all duration-200 ${
                    cantidad > 0
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : `${serviceStyle.border} hover:shadow-sm`
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className={`text-lg font-medium ${serviceStyle.text}`}>
                      {tarifa.idServicio.descripcion}
                    </h4>
                    {cantidad > 0 && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  {/* <div className="mb-3">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                      {
                        tipoServiciosQuery?.find(
                          (cat) =>
                            cat.idTipoServicio ===
                            tarifa.idServicio.idTipoServicio.idTipoServicio,
                        )?.descripcion
                      }
                    </span>
                  </div> */}
                  <div className="flex items-end justify-between gap-2 border-t border-gray-100 pt-2">
                    <span className="text-sm text-gray-500">
                      Antes de IVA
                      <br />
                      <span className="text-sm font-medium text-gray-700">
                        {priceFormat(tarifa.precioAntesIva)}
                      </span>
                    </span>
                    <span className="text-right text-sm text-gray-500">
                      Total
                      <br />
                      <span className="text-base font-semibold text-blue-600">
                        {priceFormat(tarifa.precioTotal)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-3 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      disabled={cantidad === 0}
                      onClick={() => handleDecrementarServicio(tarifa)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:bg-transparent"
                      aria-label={`Quitar una unidad de ${tarifa.idServicio.descripcion}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={cantidad}
                      onChange={(e) =>
                        handleSetCantidadServicio(
                          tarifa,
                          Number(e.target.value),
                        )
                      }
                      className="w-14 rounded-md border border-gray-300 px-1 py-1 text-center text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      aria-label={`Cantidad de unidades de ${tarifa.idServicio.descripcion}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleIncrementarServicio(tarifa)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-500 text-blue-600 transition-colors duration-200 hover:bg-blue-100"
                      aria-label={`Agregar una unidad de ${tarifa.idServicio.descripcion}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(tarifasPeriodoActivoByIdTipoServicioData || []).length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No hay servicios disponibles para esta categoría
          </div>
        )}
      </div>
    </div>
  );
};
