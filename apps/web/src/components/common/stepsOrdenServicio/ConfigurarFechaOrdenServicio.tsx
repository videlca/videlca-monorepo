import type {
  CreateOrdenServicioDto,
  UpdateOrdenServicioDto,
} from "../../../api/dtos/orden-servicio";

export const ConfigurarFechaOrdenServicio = ({
  formOrdenServicio,
  setFormOrdenServicio,
  isIndefinite,
  setIsIndefinite,
}: {
  formOrdenServicio: CreateOrdenServicioDto | UpdateOrdenServicioDto;
  setFormOrdenServicio: (
    formOrdenServicio: CreateOrdenServicioDto | UpdateOrdenServicioDto,
  ) => void;
  isIndefinite: boolean;
  setIsIndefinite: (isIndefinite: boolean) => void;
}) => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Configuración de Fechas
        </h3>
        <p className="text-sm text-gray-600">
          Configure las fechas de inicio y fin de la orden de servicio
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="">
            <label className="text-sm font-medium text-gray-700">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              value={formOrdenServicio.fechaInicio || ""}
              onChange={(e) =>
                setFormOrdenServicio({
                  ...formOrdenServicio,
                  fechaInicio: e.target.value,
                })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="">
            <label className="text-sm font-medium text-gray-700">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={formOrdenServicio.fechaFin || ""}
              onChange={(e) =>
                setFormOrdenServicio({
                  ...formOrdenServicio,
                  fechaFin: e.target.value,
                })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
              disabled={isIndefinite}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="indefinite"
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              type="checkbox"
              id="indefinite"
              checked={isIndefinite}
              onChange={(e) => {
                setIsIndefinite(e.target.checked);
                if (e.target.checked) {
                  setFormOrdenServicio({
                    ...formOrdenServicio,
                    fechaFin: null,
                  });
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Orden de servicio indefinida (sin fecha de finalización)
          </label>
        </div>
      </div>
    </div>
  );
};
