import React from "react";

interface InputSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  placeholder: string;
  error?: string;
}

export const InputSelectStateBoolean = React.forwardRef<
  HTMLSelectElement,
  InputSelectProps
>(({ label, placeholder, id, error, ...rest }, ref) => {
  const options = [
    { value: "true", label: "Activo" },
    { value: "false", label: "Inactivo" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        ref={ref}
        id={id}
        className={`w-full rounded-md border ${error ? "border-red-500" : "border-gray-300"} px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100`}
        {...rest}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

InputSelectStateBoolean.displayName = "InputSelectStateBoolean";
