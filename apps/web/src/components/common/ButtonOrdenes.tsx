import Button from "@mui/material/Button";
import { tones, type Tone } from "../../theme/tones";

export default function ButtonOrdenes({
  children,
  onClick,
  className,
  title,
  color = "gray",
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
  title?: string;
  color?: Extract<
    Tone,
    "gray" | "blue" | "green" | "red" | "yellow" | "purple" | "amber"
  >;
}) {
  return (
    <Button
      size="small"
      onClick={() => onClick()}
      className={className}
      title={title || ""}
      startIcon={icon}
      sx={{
        color: tones[color].main,
        minWidth: 0,
        "&:hover": { bgcolor: tones[color].bg },
      }}
    >
      {children}
    </Button>
  );
}
