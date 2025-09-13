export interface Puesto {
  nombre: string;
  direccion: string;
  telefono: string;
  nombreCliente: string;
  Ciudad: string;
}

export interface OrdenServicio {
  ordenServicioId: string;
  estado: string;
  fechaCreacion: string;
  puesto: Puesto;
}

export interface Event {
  idEvento: string;
  tituloEvento: string;
  tipoEvento: "asignado" | "permiso" | "vacaciones" | "incapacidad";
  fechaInicioEvento: string;
  fechaFinEvento: string;
  horaInicioEvento: string;
  horaFinEvento: string;
  horaInicioEmpleado: string;
  horaFinEmpleado: string;
  ordenServicio?: OrdenServicio;
}

export interface PersonalAsignado {
  idPersonal: number;
  nombreCompleto: string;
  numeroIdentificacion: string;
  idTipoPersonal: number;
  tipoPersonal: string;
  eventos?: Event[];
}