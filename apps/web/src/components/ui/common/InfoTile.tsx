import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

/** Dato de solo lectura: icono, valor y una etiqueta pequeña debajo */
export function InfoTile({
  icon,
  value,
  label,
  action,
}: {
  icon?: ReactNode;
  value: ReactNode;
  label?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box
      className="flex items-center gap-3 rounded-lg p-3"
      sx={{ bgcolor: "background.default" }}
    >
      {icon && (
        <Box sx={{ display: "flex", color: "text.secondary", flexShrink: 0 }}>
          {icon}
        </Box>
      )}
      <div className="min-w-0 flex-1">
        <Typography variant="body2" component="div" sx={{ fontWeight: 500 }}>
          {value}
        </Typography>
        {label && (
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        )}
      </div>
      {action}
    </Box>
  );
}
