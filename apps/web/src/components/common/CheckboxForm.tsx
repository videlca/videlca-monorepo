import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import type { ChangeEvent } from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

interface BaseProps {
  label: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  // Los props de register() no aplican: usar control + name
  ref?: never;
  onBlur?: never;
}

interface ValueProps extends BaseProps {
  control?: undefined;
  name?: string;
  checked?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

interface FormProps<T extends FieldValues> extends BaseProps {
  control: Control<T>;
  name: Path<T>;
}

/** Checkbox con label. Con react-hook-form usar `control` + `name` (no register) */
export function CheckboxForm<T extends FieldValues>(
  props: ValueProps | FormProps<T>,
) {
  if (props.control !== undefined) return <FormCheckbox {...props} />;
  const { label, className, ...rest } = props;
  return (
    <FormControlLabel
      label={label}
      className={className}
      disabled={rest.disabled}
      control={<Checkbox size="small" {...rest} checked={!!rest.checked} />}
    />
  );
}

function FormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  className,
  ...rest
}: FormProps<T>) {
  const { field } = useController({ control, name });
  return (
    <FormControlLabel
      label={label}
      className={className}
      disabled={rest.disabled}
      control={
        <Checkbox
          size="small"
          {...rest}
          name={field.name}
          checked={!!field.value}
          onChange={(e) => field.onChange(e.target.checked)}
          onBlur={field.onBlur}
          slotProps={{ input: { ref: field.ref } }}
        />
      }
    />
  );
}
