import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  COBRO_PARCIAL_INICIAL,
  type CobroParcial,
} from "../../../utils/cobroParcial";

const DIAS_MES = Array.from({ length: 31 }, (_, i) => i + 1);

const selectClassName =
  "w-20 rounded-md border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none";

export const ConfigurarFechaOrdenServicio = ({
  register,
  setValue,
  isIndefinite,
  setIsIndefinite,
  cobroParcial,
  setCobroParcial,
}: {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  isIndefinite: boolean;
  setIsIndefinite: (isIndefinite: boolean) => void;
  // Solo el flujo de crear lo envia: la actualizacion de ordenes no maneja cobro parcial
  cobroParcial?: CobroParcial;
  setCobroParcial?: (cobroParcial: CobroParcial) => void;
}) => {
  const renderSelectDia = (
    value: number | null,
    onChange: (dia: number | null) => void,
    ariaLabel: string,
  ) => (
    <select
      aria-label={ariaLabel}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={selectClassName}
    >
      <option value="">--</option>
      {DIAS_MES.map((dia) => (
        <option key={dia} value={dia}>
          {dia}
        </option>
      ))}
    </select>
  );

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
              {...register("fechaInicio")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="">
            <label className="text-sm font-medium text-gray-700">
              Fecha de Fin
            </label>
            <input
              type="date"
              {...register("fechaFin")}
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
                  setValue("fechaFin", null);
                } else {
                  setCobroParcial?.(COBRO_PARCIAL_INICIAL);
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Orden de servicio indefinida (sin fecha de finalización)
          </label>
        </div>

        {cobroParcial && setCobroParcial && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <label
              htmlFor="cobroParcial"
              className={`flex items-center gap-2 text-sm ${isIndefinite ? "text-gray-700" : "text-gray-400"}`}
            >
              <input
                type="checkbox"
                id="cobroParcial"
                checked={cobroParcial.activo}
                disabled={!isIndefinite}
                onChange={(e) =>
                  setCobroParcial(
                    e.target.checked
                      ? { ...cobroParcial, activo: true }
                      : COBRO_PARCIAL_INICIAL,
                  )
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              Cobro parcial mensual
            </label>
            <p className="text-xs text-gray-500">
              Solo para órdenes indefinidas de catálogo: cada mes se cobra
              únicamente el rango de días elegido.
            </p>

            {cobroParcial.activo && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                <span>Cobrar del día</span>
                {renderSelectDia(
                  cobroParcial.diaInicio,
                  (dia) => setCobroParcial({ ...cobroParcial, diaInicio: dia }),
                  "Día de inicio de cobro",
                )}
                <span>al día</span>
                {renderSelectDia(
                  cobroParcial.diaFin,
                  (dia) => setCobroParcial({ ...cobroParcial, diaFin: dia }),
                  "Día de fin de cobro",
                )}
                <span>de cada mes</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
