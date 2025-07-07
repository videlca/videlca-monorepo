// Configuraciones

export type TableType = "ciudades" | "departamentos" | "paises";
export type ClientesTableType = "clientes" | "locaciones" | "segmentacion" | "sub-segmentacion";

export interface TipoNovedad {
  idTipoNovedad: number;
  descripcion: string;
  estado: boolean;
  retirado: boolean;
}

export interface TipoOrdenServicio {
  idEstadoOrdenServicio: number;
  descripcion: string;
  estado: boolean;
  programable: boolean;
  dias: number;
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
  idDepartamento: Departamento;
}

export interface Departamento {
  idDepartamento: number;
  descripcion: string;
  codigoDepartamento: string;
  idPais: Pais;
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
  idSubSegmentacion: number;
  descripcion: string;
  estado: boolean;
  idSegmentacion: Segmentacion;
}

export interface Segmentacion {
  idSegmentacion: number;
  descripcion: string;
  estado: boolean;
}

export interface Locacion {
  idLocacion: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  primerNombreResponsable: string;
  primerApellidoResponsable: string;
  telefono: string;
  telefono_2: string;
  estado: boolean;
  idCliente: Cliente;
  idCiudad: Ciudad;
}

// Usuarios
export interface Usuario {
  idUsuario: number;
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
  idRol: number;
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