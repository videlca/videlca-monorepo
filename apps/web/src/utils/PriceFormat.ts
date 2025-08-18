export const priceFormat = (price: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(price);
};

export const priceCalculate = (
  costosDirectos: number,
  seguroVida: number,
  aui: number,
) => {
  const costosDirectosSeguroVida = costosDirectos + seguroVida;
  const precioAntesIva = costosDirectosSeguroVida + aui;
  const iva = Math.round(precioAntesIva * 0.019); // IVA del 19%
  const precioTotal = Math.round(precioAntesIva + iva);
  return { iva, precioTotal, precioAntesIva, costosDirectosSeguroVida };
};