import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

/** Estado vacío: icono en círculo, título y descripción opcional */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Box
        sx={{
          width: 96,
          height: 96,
          mb: 1,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
          color: "text.disabled",
          "& svg": { fontSize: 48 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="h4" component="h3">
        {title}
      </Typography>
      {description && <Typography color="text.secondary">{description}</Typography>}
    </div>
  );
}
