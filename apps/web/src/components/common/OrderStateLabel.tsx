import Chip from "@mui/material/Chip";
import { tones, type Tone } from "../../theme/tones";

// Mismos colores que el gráfico de estados del dashboard
const stateTone: Record<string, Tone> = {
  programado: "amber",
  "por iniciar": "purple",
  iniciado: "blue",
  "por terminar": "yellow",
  terminado: "green",
  cancelado: "red",
  cancelada: "red",
  anulada: "gray",
};

export const OrderStateLabel = ({ state }: { state: string }) => {
  const tone = tones[stateTone[state?.toLowerCase()] ?? "gray"];
  return (
    <Chip
      size="small"
      label={state}
      sx={{
        color: tone.main,
        bgcolor: tone.bg,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    />
  );
};
