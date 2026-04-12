import React from "react";

interface InputPriceProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  size?: "sm" | "md" | "lg" | "full";
  error?: string;
}

export const InputPrice = React.forwardRef<HTMLInputElement, InputPriceProps>(
  (
    {
      label,
      disabled = false,
      readOnly = false,
      size = "sm",
      id,
      error,
      ...rest
    },
    ref,
  ) => {
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
            ref={ref}
            type="text"
            id={id}
            placeholder="0.00"
            disabled={disabled}
            readOnly={readOnly}
            className={`rounded-md border ${error ? "border-red-500" : "border-gray-300"} py-2 pr-3 pl-6 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${sizeClass[size]} ${
              disabled || readOnly ? "cursor-not-allowed bg-gray-50" : ""
            }`}
            {...rest}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </label>
    );
  },
);

InputPrice.displayName = "InputPrice";
