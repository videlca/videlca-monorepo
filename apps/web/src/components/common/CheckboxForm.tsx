import React from "react";

interface CheckboxFormProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const CheckboxForm = React.forwardRef<HTMLInputElement, CheckboxFormProps>(
  ({ label, id, required = false, disabled = false, ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          {label}
          <input
            ref={ref}
            type="checkbox"
            id={id}
            required={required}
            className="focus:ring-opacity-20 rounded border border-gray-300 text-blue-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
            disabled={disabled}
            {...rest}
          />
        </label>
      </div>
    );
  },
);

CheckboxForm.displayName = "CheckboxForm";
