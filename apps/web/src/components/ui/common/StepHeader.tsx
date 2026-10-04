import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

/** Título y descripción centrados al inicio de un paso de un asistente */
export function StepHeader({
  title,
  description,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <Typography variant="h4" component="h3" className="flex items-center gap-2">
        {icon}
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </div>
  );
}
