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

      // Allow: digits, minus sign, dot
      const allowedChars = /^[0-9\-.]$/;
      if (!allowedChars.test(e.key)) {
        e.preventDefault();
        return;
      }

      const input = e.currentTarget;
      const currentValue = input.value;

      // Prevent minus sign if not at the start
      if (e.key === "-") {
        if (input.selectionStart !== 0) {
          e.preventDefault();
          return;
        }
        // Prevent duplicate minus sign (unless it's selected and being replaced)
        if (
          currentValue.includes("-") &&
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
      // Sanitize pasted content: keep only digits, minus, and dot
      const raw = e.target.value;
      let sanitized = raw.replace(/[^0-9\-.]/g, "");

      // Ensure minus is only at the start
      const hasMinus = sanitized.startsWith("-");
      sanitized = sanitized.replace(/-/g, "");
      if (hasMinus) sanitized = "-" + sanitized;

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

    return (
      <div className="mb-1 flex w-full flex-col gap-2">
        {showLabel && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative flex w-full items-center">
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            id={id}
            required={required}
            className={`w-full rounded-md border ${error ? "border-red-500" : "border-gray-300"} px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100`}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            spellCheck="false"
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            onBlur={onBlur}
            {...rest}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

CoordinateInput.displayName = "CoordinateInput";
