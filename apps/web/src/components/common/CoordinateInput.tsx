import { fieldLabel } from "./fieldLabel";
import TextField from "@mui/material/TextField";
import React from "react";
import { toast } from "sonner";

interface CoordinateInputProps {
  label?: string;
  placeholder: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  minLength?: number;
  maxLength?: number;
  error?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

/** Count only digit characters (0-9), ignoring special chars like "-" and "." */
const countDigits = (value: string): number =>
  value.replace(/[^0-9]/g, "").length;

export const CoordinateInput = React.forwardRef<
  HTMLInputElement,
  CoordinateInputProps
>(
  (
    {
      label,
      placeholder,
      id,
      required = false,
      disabled = false,
      showLabel = true,
      minLength = 2,
      maxLength = 10,
      error,
      onChange,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow control keys: Backspace, Delete, Tab, Escape, Enter, arrows
      const controlKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ];
      if (controlKeys.includes(e.key)) return;

      // Allow Ctrl/Cmd combinations (copy, paste, select all, etc.)
      if (e.ctrlKey || e.metaKey) return;

      // Allow: digits, minus sign, plus sign, dot
      const allowedChars = /^[0-9\-.+]$/;
      if (!allowedChars.test(e.key)) {
        e.preventDefault();
        return;
      }

      const input = e.currentTarget;
      const currentValue = input.value;

      // Prevent minus/plus sign if not at the start
      if (e.key === "-" || e.key === "+") {
        if (input.selectionStart !== 0) {
          e.preventDefault();
          return;
        }
        // Prevent duplicate signs (unless it's selected and being replaced)
        if (
          (currentValue.includes("-") || currentValue.includes("+")) &&
          input.selectionStart === input.selectionEnd
        ) {
          e.preventDefault();
          return;
        }
      }

      // Prevent duplicate dots
      if (e.key === ".") {
        if (
          currentValue.includes(".") &&
          input.selectionStart === input.selectionEnd
        ) {
          e.preventDefault();
          return;
        }
      }

      // Enforce maxLength on digits only (special chars don't count)
      if (/^[0-9]$/.test(e.key)) {
        const selStart = input.selectionStart ?? 0;
        const selEnd = input.selectionEnd ?? 0;
        const selectedText = currentValue.substring(selStart, selEnd);
        const selectedDigits = countDigits(selectedText);
        const currentDigits = countDigits(currentValue);
        const newDigitCount = currentDigits - selectedDigits + 1;

        if (newDigitCount > maxLength) {
          e.preventDefault();
          toast.error(
            `Solo se permiten hasta ${maxLength} dígitos en este campo.`,
          );
        }
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Sanitize pasted content: keep only digits, minus, plus, and dot
      const raw = e.target.value;
      let sanitized = raw.replace(/[^0-9\-.+]/g, "");

      // Ensure minus/plus is only at the start
      const hasMinus = sanitized.startsWith("-");
      const hasPlus = sanitized.startsWith("+");
      sanitized = sanitized.replace(/[-+]/g, "");
      if (hasMinus) sanitized = "-" + sanitized;
      else if (hasPlus) sanitized = "+" + sanitized;

      // Ensure only one dot
      const parts = sanitized.split(".");
      if (parts.length > 2) {
        sanitized = parts[0] + "." + parts.slice(1).join("");
      }

      // Enforce maxLength on digits only
      const digits = sanitized.replace(/[^0-9]/g, "");
      if (digits.length > maxLength) {
        // Truncate digits to maxLength while preserving special chars positions
        let digitCount = 0;
        let truncated = "";
        for (const char of sanitized) {
          if (/[0-9]/.test(char)) {
            if (digitCount < maxLength) {
              truncated += char;
              digitCount++;
            }
          } else {
            truncated += char;
          }
        }
        sanitized = truncated;
        toast.error(
          `Solo se permiten hasta ${maxLength} dígitos en este campo.`,
        );
      }

      if (sanitized !== raw) {
        e.target.value = sanitized;
      }

      if (onChange) {
        onChange(e);
      }
    };

    const fl = fieldLabel(showLabel ? label : undefined, required);

    return (
      <TextField
        inputRef={ref}
        id={id}
        label={fl.label}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={!!error}
        helperText={error}
        autoComplete="off"
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={onBlur}
        {...rest}
        slotProps={{
          inputLabel: fl.inputLabel,
          htmlInput: { inputMode: "decimal", spellCheck: false },
        }}
      />
    );
  },
);

CoordinateInput.displayName = "CoordinateInput";
