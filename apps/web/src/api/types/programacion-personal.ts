// El backend solo genera eventos a partir de las novedades del personal (ver
// ProgramacionPersonalService.findAll); ya no existe una relacion entre la programacion de
// personal y las ordenes de servicio, por lo que tipoEvento es el texto libre de
// TipoNovedad.descripcion y no hay informacion de orden de servicio asociada a un evento.
export interface Event {
  idEvento: string;
  tituloEvento: string;
  tipoEvento: string;
  fechaInicioEvento: string;
  fechaFinEvento: string;
  horaInicioEvento: string;
  horaFinEvento: string;
  horaInicioEmpleado: string;
  horaFinEmpleado: string;
}

export interface PersonalAsignado {
  idPersonal: number;
  nombreCompleto: string;
  numeroIdentificacion: string;
  idTipoPersonal: number;
  tipoPersonal: string;
  eventos?: Event[];
}