// Configuraciones

export type TableType = "ciudades" | "departamentos" | "paises";
export type ClientesTableType = "clientes" | "puestos" | "segmentacion" | "sub-segmentacion";
export type ExportacionesBaseFacturacionTableType = "Consolidación" | "Archivo de interfaz" | "Anexo de facturación";
export type TabsExportaciones = "Generar" | "Archivos generados";

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
  puesto?: Puesto;
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

export interface Puesto {
  idLocacion: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  primerNombreResponsable: string;
  primerApellidoResponsable: string;
  telefono: string;
  segundoTelefono: string;
  diasAnticipaticionNotificacion: number;
  estado: boolean;
  idCiudad: Ciudad;
  idCliente: Cliente;
  correos: Correo[];
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