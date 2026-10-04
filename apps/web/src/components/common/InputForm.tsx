import { fieldLabel } from "./fieldLabel";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import React from "react";
import { toast } from "sonner";

interface InputFormProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "prefix"
> {
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
      onChange,
      onKeyDown,
      name,
      value,
      defaultValue,
      onBlur,
      onFocus,
      autoFocus,
      className,
      ...rest
    },
    ref,
  ) => {
    const adornment = Icon ? (
      <Icon style={{ width: 16, height: 16 }} />
    ) : (
      prefix
    );

    const fl = fieldLabel(showLabel ? label : undefined, required);

    return (
      <TextField
        inputRef={ref}
        type={type}
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        label={fl.label}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        error={!!error}
        helperText={error}
        className={className}
        autoComplete="off"
        onBlur={onBlur}
        onFocus={onFocus}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          if (
            type === "number" &&
            maxLength &&
            target.value.length > maxLength
          ) {
            target.value = target.value.slice(0, maxLength);
            toast.error(
              `Solo se permiten hasta ${maxLength} caracteres en este campo.`,
            );
          }
          onChange?.(e as React.ChangeEvent<HTMLInputElement>);
        }}
        onKeyDown={(e) => {
          if (type === "number") {
            const invalidChars = ["e", "E", "+"];
            if (!allowNegative) {
              invalidChars.push("-");
            }
            if (rest.step !== "any" && !rest.step?.toString().includes(".")) {
              invalidChars.push(".", ",");
            }
            if (invalidChars.includes(e.key)) {
              e.preventDefault();
            }
          }
          onKeyDown?.(e as React.KeyboardEvent<HTMLInputElement>);
        }}
        slotProps={{
          inputLabel: fl.inputLabel,
          input: {
            startAdornment: adornment ? (
              <InputAdornment position="start">{adornment}</InputAdornment>
            ) : undefined,
          },
          htmlInput: {
            min: type === "number" && !allowNegative ? "0" : undefined,
            maxLength,
            spellCheck: false,
            ...rest,
          },
        }}
      />
    );
  },
);

InputForm.displayName = "InputForm";
