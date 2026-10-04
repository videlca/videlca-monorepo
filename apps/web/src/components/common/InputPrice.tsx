import { fieldLabel } from "./fieldLabel";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import React from "react";

interface InputPriceProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label: string;
  size?: "sm" | "md" | "lg" | "full";
  error?: string;
}

const widths = { sm: 128, md: 160, lg: 192, full: "100%" };

export const InputPrice = React.forwardRef<HTMLInputElement, InputPriceProps>(
  (
    {
      label,
      disabled = false,
      readOnly = false,
      size = "sm",
      id,
      error,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      className,
      ...rest
    },
    ref,
  ) => {
    const fl = fieldLabel(label);
    return (
      <TextField
        inputRef={ref}
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        label={fl.label}
        placeholder="0.00"
        disabled={disabled}
        error={!!error}
        helperText={error}
        className={className}
        fullWidth={false}
        sx={{ width: widths[size] }}
        slotProps={{
          inputLabel: fl.inputLabel,
          input: {
            readOnly,
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          },
          htmlInput: rest,
        }}
      />
    );
  },
);

InputPrice.displayName = "InputPrice";
