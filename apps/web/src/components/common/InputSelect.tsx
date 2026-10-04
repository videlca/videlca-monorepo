import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { fieldLabel } from "./fieldLabel";
import type { Ref } from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

export type Option = { id: number; descripcion: string };

interface BaseProps {
  label: string;
  placeholder: string;
  options: Option[];
  error?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Efecto adicional al elegir una opción (se llama después de actualizar el valor) */
  onOptionChange?: (option: Option) => void;
  // Los props de register() no aplican: usar control + name
  ref?: never;
  onBlur?: never;
}

interface ValueProps extends BaseProps {
  control?: undefined;
  name?: string;
  value?: string | number | null;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
}

interface FormProps<T extends FieldValues> extends BaseProps {
  control: Control<T>;
  name: Path<T>;
  /** Igual que register(name, { valueAsNumber: true }); por defecto el valor es string */
  valueAsNumber?: boolean;
}

export type InputSelectProps<T extends FieldValues> = ValueProps | FormProps<T>;

/** Select con búsqueda. Con react-hook-form usar `control` + `name` (no register) */
export function InputSelect<T extends FieldValues>(props: InputSelectProps<T>) {
  if (props.control !== undefined) return <FormInputSelect {...props} />;
  const { value, onChange, name, onOptionChange, ...rest } = props;
  return (
    <SelectField
      {...rest}
      value={value}
      onSelect={(option) => {
        onChange?.({ target: { name, value: String(option.id) } });
        onOptionChange?.(option);
      }}
    />
  );
}

function FormInputSelect<T extends FieldValues>({
  control,
  name,
  valueAsNumber = false,
  onOptionChange,
  ...rest
}: FormProps<T>) {
  const { field } = useController({ control, name });
  return (
    <SelectField
      {...rest}
      value={field.value}
      onSelect={(option) => {
        field.onChange(valueAsNumber ? option.id : String(option.id));
        onOptionChange?.(option);
      }}
      onBlur={field.onBlur}
      inputRef={field.ref}
    />
  );
}

function SelectField({
  label,
  placeholder,
  options,
  error,
  id,
  disabled,
  required,
  className,
  value,
  onSelect,
  onBlur,
  inputRef,
}: Omit<BaseProps, "onOptionChange" | "ref" | "onBlur"> & {
  value?: string | number | null;
  onSelect: (option: Option) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const fl = fieldLabel(label, required);
  const selected = options.find(
    (opt) => String(opt.id) === String(value ?? ""),
  );

  return (
    <Autocomplete
      // Como el select anterior: se cambia la opción pero no se puede dejar vacío
      disableClearable
      id={id}
      className={className}
      options={options}
      // disableClearable tipa el valor como no nulo, pero null es el estado "sin selección" de MUI
      value={selected ?? (null as unknown as Option)}
      onChange={(_, option) => option && onSelect(option)}
      onBlur={onBlur}
      disabled={disabled}
      getOptionLabel={(opt) => opt.descripcion}
      getOptionKey={(opt) => opt.id}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      noOptionsText="No se encontraron resultados."
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          label={fl.label}
          placeholder={placeholder}
          required={required}
          error={!!error}
          helperText={error}
          slotProps={{
            ...params.slotProps,
            inputLabel: { ...params.slotProps.inputLabel, ...fl.inputLabel },
          }}
        />
      )}
    />
  );
}
