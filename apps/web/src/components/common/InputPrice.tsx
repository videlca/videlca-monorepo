export const InputPrice = ({
  label,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  size = "sm",
  id,
}: {
  label: string;
  value: number | string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg" | "full";
  id?: string;
}) => {
  const sizeClass = {
    sm: "w-32",
    md: "w-40",
    lg: "w-48",
    full: "w-full",
  };

  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <div className="relative">
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500">
          $
        </span>
        <input
          type="number"
          id={id}
          min={1}
          value={value}
          onChange={onChange}
          placeholder="0.00"
          disabled={disabled}
          readOnly={readOnly}
          className={`rounded-md border border-gray-300 py-2 pr-3 pl-6 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${sizeClass[size]} ${
            disabled || readOnly ? "cursor-not-allowed bg-gray-50" : ""
          }`}
        />
      </div>
    </label>
  );
};
