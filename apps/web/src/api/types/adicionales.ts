import type { Cliente, Usuario } from "../../types";

export interface Adicional {
  idAdicional: number;
  nombre: string;
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
