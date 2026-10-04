import { fieldLabel } from "./fieldLabel";
import TextField from "@mui/material/TextField";
import React from "react";

interface InputSelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  label: string;
  placeholder: string;
  error?: string;
}

const options = [
  { value: "true", label: "Activo" },
  { value: "false", label: "Inactivo" },
];

// Select nativo: funciona con register() de react-hook-form sin Controller
export const InputSelectStateBoolean = React.forwardRef<
  HTMLSelectElement,
  InputSelectProps
>(
  (
    {
      label,
      placeholder,
      id,
      error,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      disabled,
      className,
      ...rest
    },
    ref,
  ) => {
    const fl = fieldLabel(label, rest.required);
    return (
      <TextField
        select
        inputRef={ref}
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange as React.ChangeEventHandler}
        onBlur={onBlur as React.FocusEventHandler}
        disabled={disabled}
        label={fl.label}
        error={!!error}
        helperText={error}
        className={className}
        slotProps={{
          inputLabel: fl.inputLabel,
          select: { native: true },
          htmlInput: rest,
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </TextField>
    );
  },
);

InputSelectStateBoolean.displayName = "InputSelectStateBoolean";
