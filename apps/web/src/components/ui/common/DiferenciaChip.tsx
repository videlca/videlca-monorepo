import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import RemoveIcon from "@mui/icons-material/Remove";
import Chip from "@mui/material/Chip";

/** Diferencia entre dos valores: verde si sube, rojo si baja, gris si no cambia */
export function DiferenciaChip({
  value,
  format = String,
}: {
  value: number;
  format?: (value: number) => string;
}) {
  if (value > 0) {
    return (
      <Chip
        size="small"
        color="success"
        variant="outlined"
        icon={<ArrowUpwardIcon />}
        label={`+${format(value)}`}
      />
    );
  }
  if (value < 0) {
    return (
      <Chip
        size="small"
        color="error"
        variant="outlined"
        icon={<ArrowDownwardIcon />}
        label={format(value)}
      />
    );
  }
  return <Chip size="small" variant="outlined" icon={<RemoveIcon />} label={format(0)} />;
}
