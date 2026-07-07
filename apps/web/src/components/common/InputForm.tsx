import React from "react";

interface InputFormProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder: string;
  type: string;
  showLabel?: boolean;
  maxLength?: number;
  allowNegative?: boolean;
  error?: string;
  prefix?: string;
  Icon?: React.ElementType;
}

export const InputForm = React.forwardRef<HTMLInputElement, InputFormProps>(
  (
    {
      label,
      placeholder,
      type,
      id,
      required = false,
      disabled = false,
      showLabel = true,
      maxLength = 255,
      allowNegative = false,
      error,
      prefix,
      Icon,
      ...rest
    },
    ref,
  ) => {
    return (
      <div className="mb-1 flex w-full flex-col gap-2">
        {showLabel && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative flex w-full items-center">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon className="h-4 w-4 text-gray-500" />
            </div>
          )}
          {prefix && !Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">{prefix}</span>
            </div>
          )}
          <input
            ref={ref}
            type={type}
            id={id}
            max={type === "number" ? "9999" : undefined}
            min={type === "number" && !allowNegative ? "0" : undefined}
            required={required}
            maxLength={maxLength}
            className={`w-full rounded-md border ${error ? "border-red-500" : "border-gray-300"} ${Icon || prefix ? "pl-10" : "px-4"} py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100`}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            spellCheck="false"
            {...rest}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

InputForm.displayName = "InputForm";
