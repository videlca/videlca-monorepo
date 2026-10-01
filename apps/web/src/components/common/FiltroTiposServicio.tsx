import type { TipoServicioFiltro } from "../../api/types/liquidaciones";

const opciones: { valor: TipoServicioFiltro; label: string }[] = [
  { valor: "monitoreo", label: "Monitoreo" },
  { valor: "vigilancia", label: "Vigilancia + adicionales" },
];

export const FiltroTiposServicio = ({
  value,
  onChange,
  label = "Tipo de servicio",
}: {
  value: TipoServicioFiltro[];
  onChange: (value: TipoServicioFiltro[]) => void;
  label?: string;
}) => {
  const toggle = (tipo: TipoServicioFiltro) => {
    if (value.includes(tipo)) {
      if (value.length === 1) return;
      onChange(value.filter((t) => t !== tipo));
    } else {
      onChange([...value, tipo]);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex flex-wrap gap-2">
        {opciones.map(({ valor, label: texto }) => {
          const activo = value.includes(valor);
          const unicoActivo = activo && value.length === 1;
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={activo}
              onClick={() => toggle(valor)}
              title={
                unicoActivo
                  ? "Debe haber al menos un tipo de servicio seleccionado"
                  : undefined
              }
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                activo
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              } ${unicoActivo ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {texto}
            </button>
          );
        })}
      </div>
    </div>
  );
};
