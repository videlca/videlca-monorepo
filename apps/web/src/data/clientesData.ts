import type {
  Cliente,
  Locacion,
  Segmentacion,
  SubSegmentacion,
} from "../types";

export const dataClientes: Cliente[] = [
  {
    idCliente: 1,
    numeroIdentificacion: "1234567890",
    nombre: "John Doe",
    estado: true,
    idTipoIdentificacion: {
      idTipoIdentificacion: 1,
      descripcion: "Cédula",
      estado: true,
    },
    idTipoCliente: {
      idTipoCliente: 1,
      descripcion: "Cliente",
      estado: true,
    },
    idSubSegmentacion: {
      idSubSegmentacion: 1,
      descripcion: "SubSegmentación 1",
      estado: true,
      idSegmentacion: {
        idSegmentacion: 1,
        descripcion: "Segmentación 1",
        estado: true,
      },
    },
  },
  {
    idCliente: 2,
    numeroIdentificacion: "1234567890",
    nombre: "Jane Smith",
    estado: true,
    idTipoIdentificacion: {
      idTipoIdentificacion: 2,
      descripcion: "NIT",
      estado: true,
    },
    idTipoCliente: {
      idTipoCliente: 2,
      descripcion: "Proveedor",
      estado: true,
    },
    idSubSegmentacion: {
      idSubSegmentacion: 2,
      descripcion: "SubSegmentación 2",
      estado: true,
      idSegmentacion: {
        idSegmentacion: 2,
        descripcion: "Segmentación 2",
        estado: true,
      },
    },
  },
];

export const dataLocaciones: Locacion[] = [
  {
    idLocacion: 1,
    nombre: "Locación 1",
    direccion: "Dirección 1",
    latitud: 1,
    longitud: 1,
    primerNombreResponsable: "Nombre 1",
    primerApellidoResponsable: "Apellido 1",
    telefono: "1234567890",
    telefono_2: "1234567890",
    estado: true,
    idCliente: {
      idCliente: 1,
      numeroIdentificacion: "1234567890",
      nombre: "Cliente 1",
      estado: true,
      idTipoIdentificacion: {
        idTipoIdentificacion: 1,
        descripcion: "Cédula",
        estado: true,
      },
      idTipoCliente: {
        idTipoCliente: 1,
        descripcion: "Cliente",
        estado: true,
      },
      idSubSegmentacion: {
        idSubSegmentacion: 1,
        descripcion: "SubSegmentación 1",
        estado: true,
        idSegmentacion: {
          idSegmentacion: 1,
          descripcion: "Segmentación 1",
          estado: true,
        },
      },
    },
    idCiudad: {
      idCiudad: 1,
      descripcion: "Ciudad 1",
      codigoCiudad: "1234567890",
      estado: true,
      idDepartamento: {
        idDepartamento: 1,
        descripcion: "Departamento 1",
        codigoDepartamento: "1234567890",
        idPais: {
          idPais: 1,
          descripcion: "Pais 1",
        },
      },
    },
  },
  {
    idLocacion: 2,
    nombre: "Locación 2",
    direccion: "Dirección 2",
    latitud: 2,
    longitud: 2,
    primerNombreResponsable: "Nombre 2",
    primerApellidoResponsable: "Apellido 2",
    telefono: "1234567890",
    telefono_2: "1234567890",
    estado: true,
    idCliente: {
      idCliente: 2,
      numeroIdentificacion: "1234567890",
      nombre: "Cliente 2",
      estado: true,
      idTipoIdentificacion: {
        idTipoIdentificacion: 2,
        descripcion: "NIT",
        estado: true,
      },
      idTipoCliente: {
        idTipoCliente: 2,
        descripcion: "Proveedor",
        estado: true,
      },
      idSubSegmentacion: {
        idSubSegmentacion: 2,
        descripcion: "SubSegmentación 2",
        estado: true,
        idSegmentacion: {
          idSegmentacion: 2,
          descripcion: "Segmentación 2",
          estado: true,
        },
      },
    },
    idCiudad: {
      idCiudad: 2,
      descripcion: "Ciudad 2",
      codigoCiudad: "1234567890",
      estado: true,
      idDepartamento: {
        idDepartamento: 2,
        descripcion: "Departamento 2",
        codigoDepartamento: "1234567890",
        idPais: {
          idPais: 2,
          descripcion: "Pais 2",
        },
      },
    },
  },
];

export const dataSegmentacion: Segmentacion[] = [
  {
    idSegmentacion: 1,
    descripcion: "Segmentación 1",
    estado: true,
  },
  {
    idSegmentacion: 2,
    descripcion: "Segmentación 2",
    estado: false,
  },
];

export const dataSubSegmentacion: SubSegmentacion[] = [
  {
    idSubSegmentacion: 1,
    descripcion: "SubSegmentación 1",
    estado: true,
    idSegmentacion: {
      idSegmentacion: 1,
      descripcion: "Segmentación 1",
      estado: true,
    },
  },
  {
    idSubSegmentacion: 2,
    descripcion: "SubSegmentación 2",
    estado: false,
    idSegmentacion: {
      idSegmentacion: 2,
      descripcion: "Segmentación 2",
      estado: true,
    },
  },
]; 