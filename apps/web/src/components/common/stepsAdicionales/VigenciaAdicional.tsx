import { useEffect } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { getYear } from "date-fns";
import { InputSelect } from "../InputSelect";
import { CheckboxForm } from "../CheckboxForm";

const monthsOptions = [
  { id: 1, descripcion: "Enero" },
  { id: 2, descripcion: "Febrero" },
  { id: 3, descripcion: "Marzo" },
  { id: 4, descripcion: "Abril" },
  { id: 5, descripcion: "Mayo" },
  { id: 6, descripcion: "Junio" },
  { id: 7, descripcion: "Julio" },
  { id: 8, descripcion: "Agosto" },
  { id: 9, descripcion: "Septiembre" },
  { id: 10, descripcion: "Octubre" },
  { id: 11, descripcion: "Noviembre" },
  { id: 12, descripcion: "Diciembre" },
];

const currentYear = getYear(new Date());
// Rango amplio a proposito: cubre adicionales creados hace varios años (para poder editarlos) y varios
// años hacia adelante (adicionales son cargos recurrentes que pueden programarse con anticipacion)
const yearsOptions = Array.from({ length: 11 }, (_, i) => {
  const year = currentYear - 5 + i;
  return { id: year, descripcion: year.toString() };
});

export interface VigenciaState {
  anoInicio: number;
  mesInicio: number;
  anoFin: number;
  mesFin: number;
}

export const VigenciaAdicional = ({
  setValue,
  vigencia,
  setVigencia,
  isIndefinido,
  setIsIndefinido,
  showHeader = true,
}: {
  setValue: UseFormSetValue<any>;
  vigencia: VigenciaState;
  setVigencia: (vigencia: VigenciaState) => void;
  isIndefinido: boolean;
  setIsIndefinido: (isIndefinido: boolean) => void;
  showHeader?: boolean;
}) => {
  // Mantiene sincronizados mesInicio/mesFin (strings "YYYY-MM-01") en el formulario padre cada vez que
  // cambia la seleccion de año/mes o el flag de indefinido. El dia siempre es 01: el backend normaliza
  // al dia 1 del mes de todas formas, y de aqui solo importa año+mes
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    setValue("mesInicio", `${vigencia.anoInicio}-${pad(vigencia.mesInicio)}-01`);
    setValue(
      "mesFin",
      isIndefinido ? null : `${vigencia.anoFin}-${pad(vigencia.mesFin)}-01`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vigencia, isIndefinido]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {showHeader && (
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Vigencia del Adicional
          </h3>
          <p className="text-sm text-gray-600">
            Seleccione el mes desde el que empieza a cobrar el adicional. Si no
            define un mes de fin, se cobrará indefinidamente cada mes
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Mes de Inicio</p>
          <div className="grid grid-cols-2 gap-4">
            <InputSelect
              id="vigenciaAnoInicio"
              label="Año"
              placeholder="Selecciona un año"
              options={yearsOptions}
              value={vigencia.anoInicio}
              onChange={(e) =>
                setVigencia({ ...vigencia, anoInicio: Number(e.target.value) })
              }
            />
            <InputSelect
              id="vigenciaMesInicio"
              label="Mes"
              placeholder="Selecciona un mes"
              options={monthsOptions}
              value={vigencia.mesInicio}
              onChange={(e) =>
                setVigencia({ ...vigencia, mesInicio: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <CheckboxForm
          id="adicionalIndefinido"
          label="Indefinido (sin mes de fin, cobra cada mes indefinidamente)"
          checked={isIndefinido}
          onChange={(e) => setIsIndefinido(e.target.checked)}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Mes de Fin</p>
          <div className="grid grid-cols-2 gap-4">
            <InputSelect
              id="vigenciaAnoFin"
              label="Año"
              placeholder="Selecciona un año"
              options={yearsOptions}
              value={vigencia.anoFin}
              onChange={(e) =>
                setVigencia({ ...vigencia, anoFin: Number(e.target.value) })
              }
              disabled={isIndefinido}
            />
            <InputSelect
              id="vigenciaMesFin"
              label="Mes"
              placeholder="Selecciona un mes"
              options={monthsOptions}
              value={vigencia.mesFin}
              onChange={(e) =>
                setVigencia({ ...vigencia, mesFin: Number(e.target.value) })
              }
              disabled={isIndefinido}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
