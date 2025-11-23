export default function ButtonOrdenes({
  children,
  onClick,
  className,
  title,
  color = "gray",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  title?: string;
  color?: "gray" | "blue" | "green" | "red" | "yellow" | "purple" | "amber";
}) {
  const colorClasses = {
    gray: "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
    blue: "text-blue-600 hover:bg-blue-100 hover:text-blue-800",
    green: "text-green-600 hover:bg-green-100 hover:text-green-800",
    red: "text-red-600 hover:bg-red-100 hover:text-red-800",
    yellow: "text-yellow-600 hover:bg-yellow-100 hover:text-yellow-800",
    purple: "text-purple-600 hover:bg-purple-100 hover:text-purple-800",
    amber: "text-amber-600 hover:bg-amber-100 hover:text-amber-800",
  };

  return (
    <button
      onClick={() => onClick()}
      className={`flex cursor-pointer items-center rounded-md px-3 py-1 text-sm transition-colors ${colorClasses[color]} ${className}`}
      title={title || ""}
    >
      {children}
    </button>
  );
}
