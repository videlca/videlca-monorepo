import React from "react";

interface InputTime24HProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  placeholder?: string;
  error?: string;
}

export const InputTime24H = React.forwardRef<
  HTMLSelectElement,
  InputTime24HProps
>(
  (
    {
      disabled = false,
      className = "",
      id,
      name,
      required = false,
      placeholder = "Selecciona una hora",
      label = "",
      error,
      ...rest
    },
    ref,
  ) => {
    // Generate hours array from 00 to 23
    const hours = Array.from({ length: 24 }, (_, i) =>
      i.toString().padStart(2, "0"),
    );

    return (
      <div className="mb-1 flex flex-col gap-2">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <select
          ref={ref}
          onChange={rest.onChange}
          disabled={disabled}
          className={`w-full rounded-md border ${error ? "border-red-500" : "border-gray-300"} px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100`}
          id={id}
          name={name}
          required={required}
          value={rest.value}
          onBlur={rest.onBlur}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {hour}:00
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

InputTime24H.displayName = "InputTime24H";
