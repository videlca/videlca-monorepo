import { type LucideIcon } from "lucide-react";

export function ButtonAction({
  Icon,
  label,
  onClick,
  color = "blue",
  disabled = false,
  type = "submit",
}: {
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: "blue" | "red" | "blue-light";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      className={`flex h-fit cursor-pointer items-center gap-2 rounded-md px-4 py-2 whitespace-nowrap ${
        color === "blue"
          ? "bg-blue-600 text-white hover:bg-blue-500"
          : color === "red"
            ? "bg-red-600 text-white hover:bg-red-500"
            : "bg-blue-100 text-blue-600 hover:bg-blue-200"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
