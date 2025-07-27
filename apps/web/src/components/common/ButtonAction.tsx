import { type LucideIcon } from "lucide-react";

export function ButtonAction({
  Icon,
  label,
  onClick,
  color = "blue",
}: {
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: "blue" | "red";
}) {
  return (
    <button
      className={`flex h-fit cursor-pointer items-center gap-2 rounded-md px-4 py-2 whitespace-nowrap text-white ${
        color === "blue"
          ? "bg-blue-600 hover:bg-blue-500"
          : "bg-red-600 hover:bg-red-500"
      }`}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
