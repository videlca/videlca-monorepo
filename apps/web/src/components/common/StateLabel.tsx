import Chip from "@mui/material/Chip";
import { tones } from "../../theme/tones";

export const StateLabel = ({ state }: { state: boolean }) => {
  const tone = tones[state ? "green" : "red"];
  return (
    <Chip
      size="small"
      label={state ? "Activo" : "Inactivo"}
      sx={{ color: tone.main, bgcolor: tone.bg }}
    />
  );
};
