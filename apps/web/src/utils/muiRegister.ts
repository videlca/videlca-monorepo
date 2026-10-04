import type { UseFormRegisterReturn } from "react-hook-form";

/** Adapta register() de react-hook-form a un TextField de MUI (el ref va al input, no al contenedor) */
export const muiRegister = ({ ref, ...rest }: UseFormRegisterReturn) => ({
  ...rest,
  inputRef: ref,
});
