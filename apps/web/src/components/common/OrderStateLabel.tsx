import Chip from "@mui/material/Chip";
import { tones, type Tone } from "../../theme/tones";

// Mismos colores que el gráfico de estados del dashboard. Programado, por iniciar e iniciado NO usan los colores de
// los tags de tipo de servicio (monitoreo azul, vigilancia morado, adicional naranja) para no confundirse con ellos
const stateTone: Record<string, Tone> = {
  programado: "blueGray",
  "por iniciar": "brown",
  iniciado: "teal",
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
