import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

const columnas = {
  2: "grid grid-cols-1 gap-4 md:grid-cols-2",
  3: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
  4: "grid grid-cols-2 gap-3 md:grid-cols-4",
};

/** Bloque de datos de solo lectura: título con icono y una grilla de DetailField */
export function DetailSection({
  icon,
  title,
  children,
  columns = 2,
  outlined = true,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  columns?: keyof typeof columnas;
  /** false para subsecciones dentro de otra tarjeta */
  outlined?: boolean;
}) {
  const contenido = (
    <>
      <Typography
        variant={outlined ? "h5" : "h6"}
        component={outlined ? "h3" : "h5"}
        className="flex items-center gap-2"
        sx={{ mb: 1.5, "& svg": { color: "primary.main", fontSize: 20 } }}
      >
        {icon}
        {title}
      </Typography>
      <div className={columnas[columns]}>{children}</div>
    </>
  );
  return outlined ? (
    <Paper variant="outlined" className="p-4">
      {contenido}
    </Paper>
  ) : (
    <Box sx={{ mt: 1, pt: 1.5, borderTop: 1, borderColor: "divider" }}>{contenido}</Box>
  );
}

/** Etiqueta pequeña arriba y valor abajo */
export function DetailField({
  label,
  value,
  fullWidth = false,
  price = false,
}: {
  label: ReactNode;
  value: ReactNode;
  fullWidth?: boolean;
  /** Resalta el valor como precio */
  price?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-full" : undefined}>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        component="div"
        sx={price ? { fontWeight: 600, color: "success.dark" } : undefined}
      >
        {value}
      </Typography>
    </div>
  );
}
