import Chip from "@mui/material/Chip";

export const PeriodoFacturacionChip = ({ activo }: { activo: boolean }) => (
  <Chip
    color={activo ? "success" : "error"}
    variant="outlined"
    label={activo ? "Activo para facturación" : "Inactivo para facturación"}
  />
);
