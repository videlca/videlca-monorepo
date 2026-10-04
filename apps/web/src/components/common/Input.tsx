import { fieldLabel } from "./fieldLabel";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import React, { useState } from "react";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label: string;
  placeholder: string;
  icon: React.ElementType;
  type: "text" | "password" | "email" | "number";
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      icon: Icon,
      type,
      id,
      required = false,
      disabled = false,
      className,
      error,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      autoFocus,
      ...rest
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const fl = fieldLabel(label, required);

    return (
      <TextField
        inputRef={ref}
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        autoFocus={autoFocus}
        type={isPassword && showPassword ? "text" : type}
        label={fl.label}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={!!error}
        helperText={error}
        className={className}
        size="medium"
        slotProps={{
          inputLabel: fl.inputLabel,
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Icon style={{ width: 18, height: 18 }} />
              </InputAdornment>
            ),
            endAdornment: isPassword ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={disabled}
                  edge="end"
                >
                  {showPassword ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
          htmlInput: rest,
        }}
      />
    );
  },
);

Input.displayName = "Input";

export default Input;
