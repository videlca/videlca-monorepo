export interface TotalesAdicional {
  costosDirectosSeguroVida: number;
  aui: number;
  precioAntesIva: number;
  iva: number;
  precioTotal: number;
}

// Replica exacta de AdicionalesService.calcularTotales (backend) para previsualizar el precio en el
// formulario. El backend sigue siendo la unica fuente de verdad al guardar: este calculo es solo visual
export const calcularTotalesAdicional = (
  costosDirectos: number,
  seguroVida: number,
  aui: number,
): TotalesAdicional => {
  const costosDirectosSeguroVida = Math.ceil((costosDirectos || 0) + (seguroVida || 0));
  const auiRedondeado = Math.ceil(aui || 0);
  const precioAntesIva = costosDirectosSeguroVida + auiRedondeado;
  const iva = Math.ceil(precioAntesIva * 0.019);
  const precioTotal = Math.ceil(precioAntesIva + iva);
  return { costosDirectosSeguroVida, aui: auiRedondeado, precioAntesIva, iva, precioTotal };
};
