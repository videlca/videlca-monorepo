import { Cliente } from '../../clientes/entities';

// VALORES DE PRECIO DE UNA LINEA LIQUIDADA (servicio de una orden o adicional)
export interface PrecioLiquidadoPdf {
  costosDirectos: number;
  seguroVida: number;
  aui: number;
  precioAntesIva: number;
  iva: number;
  precio: number;
}

// SERVICIO LIQUIDADO DE UNA ORDEN (una linea de liquidacion_servicio_orden_servicio, o el resumen de todos los dias
// liquidados de una orden a la medida)
export interface ServicioLiquidadoPdf extends PrecioLiquidadoPdf {
  descripcion: string;
  codigo: string | null;
  horario: string | null;
  tipoTarifa: string | null;
}

// UNA LIQUIDACION DE ORDEN DENTRO DEL GRUPO (una orden puede salir varias veces si se liquido por varios meses)
export interface OrdenLiquidadaPdf {
  codigo: string; // descripcionId de la orden (ej: OS-0015)
  tipoServicio: string; // nombre del tipo de servicio (Vigilancia y escolta / Monitoreo de alarmas)
  mesLiquidado: string; // "MM/YYYY"
  desde: Date;
  hasta: Date;
  servicios: ServicioLiquidadoPdf[];
  total: number;
}

// UN ADICIONAL LIQUIDADO DENTRO DEL GRUPO
export interface AdicionalLiquidadoPdf extends PrecioLiquidadoPdf {
  nombre: string;
  mesLiquidado: string; // "MM/YYYY"
}

// TODO LO QUE NECESITA EL PDF DE UN GRUPO DE LIQUIDACION (la "factura" de un cliente)
export interface GrupoLiquidacionPdf {
  idGrupoLiquidacion: number;
  descripcion: string;
  anio: number;
  mes: number;
  fechaCreacion: Date;
  aprobado: boolean;
  cliente: Cliente;
  ordenes: OrdenLiquidadaPdf[];
  adicionales: AdicionalLiquidadoPdf[];
  totales: PrecioLiquidadoPdf;
}
