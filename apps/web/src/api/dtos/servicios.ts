export interface CreateTipoServicioDto {
  nombre: string;
  prefijo: string;
  descripcion: string;
  requierePersonal: boolean;
}

export interface UpdateTipoServicioDto extends Partial<CreateTipoServicioDto> {
  estado?: boolean;
}

export enum TipoServicioFilterColumn {
  NOMBRE = 'nombre',
  DESCRIPCION = 'descripcion',
  PREFIJO = 'prefijo',
}

export interface FilterTipoServicioDto {
  column: TipoServicioFilterColumn;
  query: string;
  limit?: number;
  offset?: number;
  pagination?: boolean;
}

export interface CreateServicioDto {
  codigo: string;
  descripcion: string;
  idTipoServicio: number;
  idTipoDuracion: number;
  idTipoHorarioDescripcion: number;
  idTipoTarifa: number;
  horasFijas?: number;
  horasMinimas?: number;
  horasMaximas?: number;
  dominical?: boolean;
}

export interface UpdateServicioDto extends Partial<CreateServicioDto> {
  estado?: boolean;
}

export interface CreateTipoHorarioDto {
  horaInicioDiurno: string;
  horaFinDiurno: string;
  horaInicioNocturno: string;
  horaFinNocturno: string;
  fechaVigenciaInicio: string;
  fechaVigenciaFin?: string | null;
}

export interface UpdateTipoHorarioDto extends Partial<CreateTipoHorarioDto> {}