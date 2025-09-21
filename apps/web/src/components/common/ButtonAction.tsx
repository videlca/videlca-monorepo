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
          ? "border border-blue-300 bg-blue-100 text-blue-600 hover:bg-blue-200"
          : color === "red"
            ? "border border-red-300 bg-red-100 text-red-600 hover:bg-red-200"
            : "border border-blue-300 bg-blue-100 text-blue-600 hover:bg-blue-200"
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
