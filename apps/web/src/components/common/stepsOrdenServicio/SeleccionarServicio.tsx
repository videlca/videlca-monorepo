import { Check } from "lucide-react";
import { priceFormat } from "../../../utils/PriceFormat";
import type { Servicio, TipoServicio } from "../../../api/types/servicio";
import type { Tarifa } from "../../../api/types/periodo";
import type { CreateOrdenServicioTarifaDto } from "../../../api/dtos/orden-servicio";

export const SeleccionarServicio = ({
  selectedServices,
  tarifasPeriodoActivoByIdTipoServicioData,
  tipoServiciosQuery,
  handleSelectedServices,
  setConfiguracionServicioTarifa,
  setSelectedTarifa,
}: {
  selectedServices: Servicio[];
  tarifasPeriodoActivoByIdTipoServicioData: Tarifa[];
  tipoServiciosQuery: TipoServicio[];
  handleSelectedServices: (services: Servicio) => void;
  setConfiguracionServicioTarifa: (
    configuracionServicioTarifa:
      | CreateOrdenServicioTarifaDto[]
      | ((
          prev: CreateOrdenServicioTarifaDto[],
        ) => CreateOrdenServicioTarifaDto[]),
  ) => void;
  setSelectedTarifa: (tarifa: Tarifa) => void;
}) => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Servicio a Prestar
        </h3>
        <p className="text-sm text-gray-600">
          Seleccione el tipo de servicio que se prestará
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-3 flex flex-row items-center justify-between text-sm font-medium text-gray-700">
            <span className="font-bold">Servicios Disponibles.</span>
            <span className="text-xs">
              Servicios seleccionados: {selectedServices.length}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {(tarifasPeriodoActivoByIdTipoServicioData || []).map((tarifa) => (
              <div
                key={tarifa.idServicio.idServicio}
                className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                  selectedServices.includes(tarifa.idServicio)
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => {
                  handleSelectedServices(tarifa.idServicio);
                  setConfiguracionServicioTarifa(
                    (prev: CreateOrdenServicioTarifaDto[]) => {
                      const newArray = [...prev];
                      const index = newArray.findIndex(
                        (s) => s.idServicio === tarifa.idServicio.idServicio,
                      );
                      newArray[index] = {
                        idTarifa: tarifa.idTarifa,
                        idServicio: tarifa.idServicio.idServicio,
                        cantidadPersonal: 0,
                        horaInicio: "",
                        horaFin: "",
                        precio: 0,
                        personal: [],
                      };
                      return newArray;
                    },
                  );
                  setSelectedTarifa(tarifa);
                }}
              >
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {tarifa.idServicio.codigo}
                  </h4>
                  {selectedServices.includes(tarifa.idServicio) && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="mb-3 text-xs text-gray-600">
                  {tarifa.idServicio.descripcion}
                </p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {
                      tipoServiciosQuery?.find(
                        (cat) =>
                          cat.idTipoServicio ===
                          tarifa.idServicio.idTipoServicio.idTipoServicio,
                      )?.descripcion
                    }
                  </span>
                  <span className="font-semibold text-blue-600">
                    {priceFormat(tarifa.precioTotal)}
                  </span>
                </div>
              </div>
            ))}
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
