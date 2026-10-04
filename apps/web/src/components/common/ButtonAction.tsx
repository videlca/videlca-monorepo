import Button from "@mui/material/Button";
import type { ElementType } from "react";

const colorMap = {
  blue: { variant: "contained", color: "primary" },
  red: { variant: "contained", color: "error" },
  "blue-light": { variant: "outlined", color: "primary" },
  "green-light": { variant: "outlined", color: "success" },
  "yellow-light": { variant: "outlined", color: "warning" },
} as const;

export function ButtonAction({
  Icon,
  label,
  onClick,
  color = "blue",
  disabled = false,
  type = "submit",
}: {
  Icon: ElementType;
  label: string;
  onClick: () => void;
  color?: keyof typeof colorMap;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <Button
      {...colorMap[color]}
      startIcon={<Icon style={{ width: 18, height: 18 }} />}
      onClick={onClick}
      disabled={disabled}
      type={type}
      sx={{ flexShrink: 0 }}
    >
      {label}
    </Button>
  );
}
