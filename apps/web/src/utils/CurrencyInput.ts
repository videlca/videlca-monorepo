// Utilidades para inputs de precio editables en formato colombiano: separador de miles "." y
// separador decimal ",". Distintas de PriceFormat.priceFormat, que es solo para mostrar (Intl,
// no editable) — estas se usan para el texto de un input controlado mientras el usuario escribe.

// Convierte un NUMBER (prefill, recalculo automático) al texto que se muestra en el input.
// Los enteros no muestran decimales ("13223" -> "13.223"); si hay centavos, siempre se muestran
// los 2 digitos ("13222.5" -> "13.222,50")
export const formatCOPFromNumber = (value: number): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "";

  const [integerPart, decimalPart] = value.toFixed(2).split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return decimalPart === "00" ? groupedInteger : `${groupedInteger},${decimalPart}`;
};

// Reformatea el TEXTO que el usuario ya está escribiendo (siempre en formato colombiano: "." miles,
// "," decimal) en cada tecla: limpia caracteres invalidos y limita a 2 decimales, preservando una
// coma final sin digitos aun (para no interrumpir mientras se compone el decimal)
export const reformatCOPInput = (rawText: string): string => {
  const hasComma = rawText.includes(",");
  const [integerRaw, decimalRaw = ""] = rawText.split(",");

  const integerDigits = integerRaw.replace(/\D/g, "");
  const decimalDigits = decimalRaw.replace(/\D/g, "").slice(0, 2);
  const groupedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return hasComma ? `${groupedInteger},${decimalDigits}` : groupedInteger;
};

// Convierte el texto mostrado ("13.222,50") de vuelta a un number (13222.5) para guardarlo en el formulario
export const parseCOPInput = (text: string): number => {
  if (!text) return 0;
  const normalized = text.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};
