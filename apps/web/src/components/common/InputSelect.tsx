import React from "react";

interface InputSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  placeholder: string;
  options: { id: number; descripcion: string }[];
  error?: string;
}

export const InputSelect = React.forwardRef<HTMLSelectElement, InputSelectProps>(
  (
    {
      label,
      placeholder,
      id,
      options,
      required = false,
      disabled = false,
      error,
      ...rest
    },
    ref,
  ) => {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <select
          ref={ref}
          id={id}
          className={`w-full rounded-md border ${error ? "border-red-500" : "border-gray-300"} px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100`}
          required={required}
          disabled={disabled}
          {...rest}
        >
          <option value={0} disabled hidden className="text-gray-400">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.descripcion}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

InputSelect.displayName = "InputSelect";
