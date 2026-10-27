import type { Cliente, Usuario } from "../../types";

export interface TipoAdicional {
  idTipoAdicional: number;
  codigo: string;
  descripcion: string;
  estado: boolean;
}

export interface Adicional {
  idAdicional: number;
  // Su descripcion es lo que se muestra como nombre del adicional
  idTipoAdicional: TipoAdicional;
  idCliente: Cliente;
  idUsuarioCreacion: Usuario;
  mesInicio: string;
  mesFin: string | null;
  costosDirectos: number;
  seguroVida: number;
  aui: number;
  costosDirectosSeguroVida: number;
  precioAntesIva: number;
  iva: number;
  precioTotal: number;
  estado: boolean;
  fechaCreacion: string;
}
