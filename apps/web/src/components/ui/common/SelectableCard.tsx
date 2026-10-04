import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Paper from "@mui/material/Paper";
import type { ReactNode } from "react";

/** Tarjeta clicable de una lista de opciones; resaltada con check cuando está seleccionada */
export function SelectableCard({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Paper
      variant="outlined"
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative cursor-pointer p-4 ${className}`}
      sx={{
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "action.selected" : "background.paper",
        transition: "border-color .2s, box-shadow .2s",
        "&:hover": { borderColor: selected ? "primary.main" : "text.disabled", boxShadow: 1 },
      }}
    >
      {selected && (
        <CheckCircleIcon
          color="primary"
          sx={{ position: "absolute", top: 12, right: 12 }}
          fontSize="small"
        />
      )}
      {children}
    </Paper>
  );
}
