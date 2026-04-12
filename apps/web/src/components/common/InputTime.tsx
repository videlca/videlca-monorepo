import React from "react";

interface InputTimeProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder: string;
  error?: string;
}

export const InputTime = React.forwardRef<HTMLInputElement, InputTimeProps>(
  (
    {
      label,
      placeholder,
      id,
      required = false,
      disabled = false,
      error,
      ...rest
    },
    ref,
  ) => {
    return (
      <div className="mb-1 flex flex-col gap-2">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            type="time"
            id={id}
            required={required}
            min="00:00"
            max="23:00"
            step={3600}
            className={`w-full rounded-md border ${error ? "border-red-500" : "border-gray-300"} px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100`}
            placeholder={placeholder}
            disabled={disabled}
            {...rest}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

InputTime.displayName = "InputTime";
