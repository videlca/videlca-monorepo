export interface TotalesAdicional {
  costosDirectosSeguroVida: number;
  aui: number;
  precioAntesIva: number;
  iva: number;
  precioTotal: number;
}

// AUI sugerido automaticamente = 10% de (costos directos + seguro de vida) (el usuario puede ajustarlo a mano)
export const calcularAuiAdicional = (
  costosDirectos: number,
  seguroVida: number,
) => Math.ceil(((costosDirectos || 0) + (seguroVida || 0)) * 0.1);

// Replica exacta de AdicionalesService.calcularTotales (backend) para previsualizar el precio en el
// formulario. El backend sigue siendo la unica fuente de verdad al guardar: este calculo es solo visual.
// Los adicionales no llevan IVA: se mantiene en 0 para no alterar calculos posteriores
export const calcularTotalesAdicional = (
  costosDirectos: number,
  seguroVida: number,
  aui: number,
): TotalesAdicional => {
  const costosDirectosSeguroVida = Math.ceil(
    (costosDirectos || 0) + (seguroVida || 0),
  );
  const auiRedondeado = Math.ceil(aui || 0);
  const precioAntesIva = costosDirectosSeguroVida + auiRedondeado;
  const iva = 0;
  const precioTotal = Math.ceil(precioAntesIva + iva);
  return {
    costosDirectosSeguroVida,
    aui: auiRedondeado,
    precioAntesIva,
    iva,
    precioTotal,
  };
};
