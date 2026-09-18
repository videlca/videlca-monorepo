import { useEffect, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { Calculator, RotateCcw } from "lucide-react";
import { InputPrice } from "../InputPrice";
import { calcularTotalesAdicional } from "../../../utils/calcularTotalesAdicional";
import { formatCOPFromNumber, reformatCOPInput, parseCOPInput } from "../../../utils/CurrencyInput";

export type CampoCalculadoAdicional =
  | "costosDirectosSeguroVida"
  | "precioAntesIva"
  | "iva"
  | "precioTotal";

const CAMPOS_CALCULADOS_LABELS: Record<CampoCalculadoAdicional, string> = {
  costosDirectosSeguroVida: "Costos Directos + Seguro Vida",
  precioAntesIva: "Precio antes de IVA",
  iva: "IVA (1.9%)",
  precioTotal: "Precio Total (cobro mensual)",
};

// Input de precio controlado con formato colombiano en vivo ("." miles, "," decimales). No usa
// register: el valor se empuja al formulario via setValue en cada cambio, y el texto mostrado se
// resincroniza solo cuando el valor externo cambia por algo distinto a lo que el usuario ya escribió
// (recalculo automático, "recalcular" manual, prefill de edición) — asi no se pierde una coma/decimal
// a medio escribir
const CampoPrecioEditable = ({
  label,
  setValue,
  name,
  value,
  onManualChange,
}: {
  label: string;
  setValue: UseFormSetValue<any>;
  name: string;
  value: number;
  onManualChange?: () => void;
}) => {
  const [displayValue, setDisplayValue] = useState(() => formatCOPFromNumber(value));

  useEffect(() => {
    if (parseCOPInput(displayValue) !== value) {
      setDisplayValue(formatCOPFromNumber(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <InputPrice
      label={label}
      size="full"
      value={displayValue}
      onChange={(e) => {
        const formatted = reformatCOPInput(e.target.value);
        setDisplayValue(formatted);
        setValue(name, parseCOPInput(formatted));
        onManualChange?.();
      }}
    />
  );
};

export const PreciosAdicional = ({
  setValue,
  costosDirectos,
  seguroVida,
  aui,
  costosDirectosSeguroVida,
  precioAntesIva,
  iva,
  precioTotal,
  camposManuales,
  onToggleManual,
  showHeader = true,
}: {
  setValue: UseFormSetValue<any>;
  costosDirectos: number;
  seguroVida: number;
  aui: number;
  costosDirectosSeguroVida: number;
  precioAntesIva: number;
  iva: number;
  precioTotal: number;
  camposManuales: Set<CampoCalculadoAdicional>;
  onToggleManual: (campo: CampoCalculadoAdicional, manual: boolean) => void;
  showHeader?: boolean;
}) => {
  // Recalcula en vivo los 4 campos derivados a partir de costos/seguro/aui, pero solo los que el
  // usuario no haya editado manualmente (camposManuales) — esos se dejan tal cual el usuario los dejó
  useEffect(() => {
    const totales = calcularTotalesAdicional(
      Number.isNaN(costosDirectos) ? 0 : costosDirectos,
      Number.isNaN(seguroVida) ? 0 : seguroVida,
      Number.isNaN(aui) ? 0 : aui,
    );
    (Object.keys(totales) as (keyof typeof totales)[]).forEach((campo) => {
      if (campo !== "aui" && !camposManuales.has(campo as CampoCalculadoAdicional)) {
        setValue(campo, totales[campo]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costosDirectos, seguroVida, aui, camposManuales]);

  const valoresCalculados: Record<CampoCalculadoAdicional, number> = {
    costosDirectosSeguroVida,
    precioAntesIva,
    iva,
    precioTotal,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {showHeader && (
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Valores del Adicional
          </h3>
          <p className="text-sm text-gray-600">
            Ingrese los valores del adicional. El desglose se calcula
            automáticamente y puede ajustarse manualmente si se requiere
            mayor precisión decimal
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CampoPrecioEditable
          label="Costos Directos"
          setValue={setValue}
          name="costosDirectos"
          value={costosDirectos}
        />
        <CampoPrecioEditable
          label="Seguro de Vida"
          setValue={setValue}
          name="seguroVida"
          value={seguroVida}
        />
        <CampoPrecioEditable label="AUI" setValue={setValue} name="aui" value={aui} />
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Calculator className="h-6 w-6 text-green-600" />
          <h4 className="text-lg font-semibold text-green-900">Precio Calculado</h4>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(Object.keys(CAMPOS_CALCULADOS_LABELS) as CampoCalculadoAdicional[]).map((campo) => (
            <div key={campo} className="flex flex-col gap-1">
              <CampoPrecioEditable
                label={CAMPOS_CALCULADOS_LABELS[campo]}
                setValue={setValue}
                name={campo}
                value={valoresCalculados[campo]}
                onManualChange={() => onToggleManual(campo, true)}
              />
              {camposManuales.has(campo) && (
                <button
                  type="button"
                  onClick={() => onToggleManual(campo, false)}
                  className="flex w-fit cursor-pointer items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900"
                >
                  <RotateCcw className="h-3 w-3" />
                  Recalcular automáticamente
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-green-200 pt-3 text-sm text-green-800">
          Precio Total es el valor que se cobrará cada mes mientras el adicional esté vigente.
        </p>
      </div>
    </div>
  );
};
