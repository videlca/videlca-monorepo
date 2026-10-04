import Chip from "@mui/material/Chip";
import FormLabel from "@mui/material/FormLabel";
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
      <FormLabel sx={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</FormLabel>
      <div className="flex flex-wrap gap-2">
        {opciones.map(({ valor, label: texto }) => {
          const activo = value.includes(valor);
          const unicoActivo = activo && value.length === 1;
          return (
            <Chip
              key={valor}
              label={texto}
              color={activo ? "primary" : "default"}
              variant={activo ? "filled" : "outlined"}
              aria-pressed={activo}
              onClick={() => toggle(valor)}
              title={
                unicoActivo
                  ? "Debe haber al menos un tipo de servicio seleccionado"
                  : undefined
              }
              sx={{ cursor: unicoActivo ? "not-allowed" : "pointer" }}
            />
          );
        })}
      </div>
    </div>
  );
};
