import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

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
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <TextField
        id="filtroMesExportacion"
        label="Mes del grupo"
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth={false}
        sx={{ minWidth: 192 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Button
        variant={todosLosMeses ? "contained" : "outlined"}
        color={todosLosMeses ? "primary" : "secondary"}
        aria-pressed={todosLosMeses}
        startIcon={<CalendarMonthOutlinedIcon />}
        onClick={() => onChange(todosLosMeses ? getMesActualExportacion() : "")}
      >
        Todos los meses
      </Button>
    </div>
  );
}
