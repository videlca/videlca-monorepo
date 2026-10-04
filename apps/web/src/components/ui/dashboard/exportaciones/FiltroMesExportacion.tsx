import { CalendarDays } from "lucide-react";

export const getMesActualExportacion = (): string => {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}`;
};

// Vacío o inválido = todos los meses (anio y mes van los dos o ninguno)
export const parseMesExportacion = (
  valor: string,
): { anio?: number; mes?: number } => {
  const match = /^(\d{4})-(\d{2})$/.exec(valor);
  if (!match) return {};
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  if (mes < 1 || mes > 12) return {};
  return { anio, mes };
};

interface FiltroMesExportacionProps {
  /** "YYYY-MM", o "" para todos los meses */
  value: string;
  onChange: (value: string) => void;
}

export function FiltroMesExportacion({
  value,
  onChange,
}: FiltroMesExportacionProps) {
  const todosLosMeses = value === "";

  return (
    <div className="mb-4 flex flex-wrap items-end gap-4">
      <div className="flex min-w-48 flex-col gap-1">
        <label
          htmlFor="filtroMesExportacion"
          className="text-sm font-medium text-gray-700"
        >
          Mes del grupo
        </label>
        <input
          id="filtroMesExportacion"
          type="month"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <button
        type="button"
        aria-pressed={todosLosMeses}
        onClick={() => onChange(todosLosMeses ? getMesActualExportacion() : "")}
        className={`flex h-fit w-fit cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm whitespace-nowrap ${
          todosLosMeses
            ? "border-blue-300 bg-blue-100 text-blue-600 hover:bg-blue-200"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        <CalendarDays className="h-4 w-4" />
        Todos los meses
      </button>
    </div>
  );
}
