import type { Ciudad, TipoGenero, TipoIdentificacion, TipoPersonal } from "../../types";
import type { ProgramacionPersonal } from "./programacion-personal";

export interface Personal {
  idPersonal: number;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  numeroIdentificacion: string;
  fechaInicioContrato: string;
  fechaFinContrato: string;
  fechaNacimiento: string;
  direccionResidencia: string;
  telefono: string;
  arma: boolean;
  laborando: boolean;
  idTipoIdentificacion: TipoIdentificacion;
  idCiudad: Ciudad;
  idTipoGenero: TipoGenero;
  idTipoPersonal: TipoPersonal;
  novedades: Novedad[];
  programaciones: ProgramacionPersonal[];
}

export interface Novedad {
  idNovedad: number;
  descripcion: string;
  fechaInicio: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  idPersonal: Personal;
  idTipoNovedad: TipoNovedad;
}

export interface TipoNovedad {
  idTipoNovedad: number;
  descripcion: string;
  estado: boolean;
  retirado: boolean;
  novedades: Novedad[];
}

