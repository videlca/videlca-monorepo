import { fieldLabel } from "./fieldLabel";
import TextField from "@mui/material/TextField";
import React from "react";

interface InputTime24HProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  label?: string;
  placeholder?: string;
  error?: string;
}

const hours = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

export const InputTime24H = React.forwardRef<
  HTMLSelectElement,
  InputTime24HProps
>(
  (
    {
      disabled = false,
      className,
      id,
      name,
      required = false,
      placeholder = "Selecciona una hora",
      label = "",
      error,
      value,
      onChange,
      onBlur,
    },
    ref,
  ) => {
    const fl = fieldLabel(label, required);
    return (
      <TextField
        select
        inputRef={ref}
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange as React.ChangeEventHandler}
        onBlur={onBlur as React.FocusEventHandler}
        label={fl.label}
        error={!!error}
        helperText={error}
        className={className}
        slotProps={{ inputLabel: fl.inputLabel, select: { native: true } }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {hours.map((hour) => (
          <option key={hour} value={`${hour}:00:00`}>
            {hour}:00
          </option>
        ))}
      </TextField>
    );
  },
);

InputTime24H.displayName = "InputTime24H";
