import { Check } from "lucide-react";
import { useEffect } from "react";
import { useGetOrigenServicio } from "../../../api/queryFunctions/orden-servicio/origen-servicio";
import { OrigenServicioEnum } from "../../../api/dtos";

// "Monitoreo de alarmas" siempre se crea desde catalogo (no se pregunta). Cualquier otro tipo de servicio
// ("Vigilancia y escolta") si deja elegir entre catalogo y a la medida
const TIPO_SERVICIO_MONITOREO_ALARMAS = "Monitoreo de alarmas";

export const SeleccionarOrigenServicio = ({
  tipoServicioNombre,
  origenServicio,
  setOrigenServicio,
}: {
  tipoServicioNombre?: string;
  origenServicio: OrigenServicioEnum | null;
  setOrigenServicio: (origenServicio: OrigenServicioEnum) => void;
}) => {
  const { data: origenServicioQuery } = useGetOrigenServicio();
  const esMonitoreoAlarmas = tipoServicioNombre === TIPO_SERVICIO_MONITOREO_ALARMAS;

  // Monitoreo de alarmas siempre es "catalogo", se fija automaticamente sin pedirle nada al usuario
  useEffect(() => {
    if (esMonitoreoAlarmas) {
      setOrigenServicio(OrigenServicioEnum.CATALOGO);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esMonitoreoAlarmas]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Origen de la Orden de Servicio
        </h3>
        <p className="text-sm text-gray-600">
          Seleccione cómo desea crear esta orden de servicio
        </p>
      </div>

      {esMonitoreoAlarmas ? (
        <div className="space-y-1 rounded-lg border border-yellow-500 bg-yellow-50 px-4 py-3 text-left">
          <h4 className="text-base font-medium text-yellow-600">Nota:</h4>
          <p className="text-xs text-yellow-600">
            Las órdenes de <b>Monitoreo de alarmas</b> siempre se crean desde
            el catálogo, no es necesario seleccionar el origen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(origenServicioQuery?.data || []).map((origen) => (
            <div
              key={origen.idOrigenServicio}
              className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                origenServicio === origen.code
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
              onClick={() =>
                setOrigenServicio(origen.code as OrigenServicioEnum)
              }
            >
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  {origen.nombre}
                </h4>
                {origenServicio === origen.code && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600">{origen.descripcion}</p>
            </div>
          ))}

          {(origenServicioQuery?.data || []).length === 0 && (
            <div className="col-span-2 py-8 text-center text-gray-500">
              No hay orígenes de servicio disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
};
