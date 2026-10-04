/**
 * Etiqueta de campo: un "*" final en el texto se quita y se muestra como el asterisco de requerido de MUI,
 * para no duplicarlo cuando el campo además es `required`
 */
export function fieldLabel(label: string | undefined, required = false) {
  const starred = !!label && /\*\s*$/.test(label);
  return {
    label: label?.replace(/\s*\*\s*$/, "") || undefined,
    inputLabel: { shrink: true, required: required || starred },
  };
}
