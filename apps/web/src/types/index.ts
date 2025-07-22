// Configuraciones

export type TableType = "ciudades" | "departamentos" | "paises";
export type ClientesTableType = "clientes" | "locaciones" | "segmentacion" | "sub-segmentacion";

export interface TipoNovedad {
  idTipoNovedad: number;
  descripcion: string;
  estado: boolean;
  retirado: boolean;
}

export interface Correo {
  idCorreo: number;
  nombre: string;
  apellido: string;
  email: string;
  locacion: Locacion;
  estados: EstadoOrden[];
}

export interface EstadoOrden {
  idEstadoOrdenServicio: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  programable: boolean;
  correo: Correo[];
}

export interface TipoGenero {
  idTipoGenero: number;
  descripcion: string;
  estado: boolean;
}

export interface TipoIdentificacion {
  idTipoIdentificacion: number;
  descripcion: string;
  estado: boolean;
}

export interface TipoCliente {
  idTipoCliente: number;
  descripcion: string;
  estado: boolean;
}

export interface TipoPersonal {
  idTipoPersonal: number;
  descripcion: string;
  estado: boolean;
}


export interface Ciudad {
  idCiudad: number;
  descripcion: string;
  codigoCiudad: string;
  estado: boolean;
  departamento: Departamento;
}

export interface Departamento {
  idDepartamento: number;
  descripcion: string;
  codigoDepartamento: string;
  pais: Pais;
}

export interface Pais {
  idPais: number;
  descripcion: string;
}

// Clientes
export interface Cliente {
  idCliente: number;
  numeroIdentificacion: string;
  nombre: string;
  estado: boolean;
  idTipoIdentificacion: TipoIdentificacion;
  idTipoCliente: TipoCliente;
  idSubSegmentacion: SubSegmentacion;
}


export interface SubSegmentacion {
  idSubSegmentacion?: number;
  descripcion: string;
  estado?: boolean;
  segmentacion?: Segmentacion;
}

export interface Segmentacion {
  idSegmentacion: number;
  descripcion: string;
  estado: boolean;
  subSegmentaciones?: SubSegmentacion[];
}

export interface Locacion {
  idLocacion: number;
  nombre: string;
  idCiudad: Ciudad;
  direccion: string;
  latitud: number;
  longitud: number;
  primerNombreResponsable: string;
  primerApellidoResponsable: string;
  telefono: string;
  segundoTelefono: string;
  diasAnticipacionNotificacion: number;
  correos: Correo[];
  idCliente: Cliente;
  estado: boolean;
}

// Usuarios
export interface Usuario {
  idUser: number;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  email: string;
  clave: string;
  numeroIdentificacion: string;
  estado: boolean;
  idTipoIdentificacion: TipoIdentificacion;
  idRol: Rol;
}

// Roles
export interface Rol {
  id: number;
  nombreRol: string;
  descripcion: string;
  estado: boolean;
}

export interface Permiso {
  idPermiso: number;
  ruta: string;
  descripcion: string;
  nombre: string;
  modulo: string;
  estado: boolean;
  modificar: boolean;
}

// Personal
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