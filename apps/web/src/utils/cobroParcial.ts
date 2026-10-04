export interface CobroParcial {
  activo: boolean;
  diaInicio: number | null;
  diaFin: number | null;
}

export const COBRO_PARCIAL_INICIAL: CobroParcial = {
  activo: false,
  diaInicio: null,
  diaFin: null,
};

export const textoCobroParcial = (diaInicio: number, diaFin: number) =>
  `Del día ${diaInicio} al ${diaFin} de cada mes`;
