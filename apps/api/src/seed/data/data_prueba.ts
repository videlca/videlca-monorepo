interface User {
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    email: string;
    clave: string;
    numeroIdentificacion: string;
    tipoIdentificacion: string;
    rol: string;
}

interface Role {
    permissionsIds: number[];
    descripcion: string;
}

interface Permission {
    nombre: string;
    descripcion: string;
}

interface Tipo {
    descripcion: string;
}

interface TipoTarifa {
    nombre: string;
    descripcion: string;
    tipoUnidadTiempo: string;
    cantidadTiempo?: number;
}

interface TipoUnidadTiempo {
    descripcion: string;
    requiereTiempo: boolean;
}

interface EstadoOrdenServicio {
    nombre: string,
    descripcion: string;
    estado: boolean;
    programable: boolean;
}

// tipo novedad
interface TipoNovedad {
    descripcion: string;
    retirado: boolean;
}

interface SeedData {
    users: User[],
    roles: Role[],
    permissions: Permission[],
    tiposId: Tipo[],
    tiposGenero: Tipo[],
    tiposDuracion: Tipo[],
    tiposHorario: Tipo[],
    paises: Tipo[],
    tiposNovedad: TipoNovedad[],
    estadosOrdenServicio: EstadoOrdenServicio[],
    tiposUnidadTiempo: TipoUnidadTiempo[],
    tiposTarifa: TipoTarifa[]
}

export const initialData: SeedData = {

    tiposUnidadTiempo: [
        {descripcion: "dias", requiereTiempo: true},
        {descripcion: "horas", requiereTiempo: true},
        {descripcion: "no aplica", requiereTiempo: false},
    ],

    tiposTarifa: [
        {nombre: "mes", descripcion: "El monto precio total del servicio equivale a un mes, se puede ajustar cantidad de dias que equivale el mes que cobran", tipoUnidadTiempo: "dias", cantidadTiempo: 30},
        {nombre: "turno", descripcion: "El monto precio total del servicio equivale a un turno, se puede ajustar cantidad de horas que equivale el turno que cobran", tipoUnidadTiempo: "horas", cantidadTiempo: 8},
        {nombre: "Servicio unico", descripcion: "El precio total del servicio es de unico cobro", tipoUnidadTiempo: "no aplica"},
    ],
    
    estadosOrdenServicio: [
        {nombre: "cancelada", descripcion: "Estado para indicar que una orden de sevricio ha sido cancelada", estado: true, programable: false},
        {nombre: "programado", descripcion: "Estado para indicar que una orden de servicio ha sido programada", estado: true, programable: false},
        {
            nombre: "por iniciar", 
            descripcion: "Estado para indicar que una orden servicio esta por iniciar, este estado se utiliza para notificar por medio de un email", 
            estado: true, 
            programable: true
        },
        {nombre: "iniciado", descripcion: "Estado para indicar que una orden servicio ha iniciado", estado: true, programable: false},
        {
            nombre: "por terminar", 
            descripcion: "Estado para indicar que una orden servicio esta por terminar, este estado se utiliza para notificar por medio de un email", 
            estado: true, 
            programable: true
        },
        {nombre: "terminado", descripcion: "Estado para indicar que una orden servicio ha terminado", estado: true, programable: false}
    ],

    roles: [
        {descripcion: 'super-admin', permissionsIds: []},
        {descripcion: 'user', permissionsIds: []},
    ],
    
    permissions: [
        {descripcion: 'configuracion', nombre: 'Configuración'},
        {descripcion: 'personal', nombre: 'Personal'},
        {descripcion: 'permisos', nombre: 'Permisos'},
        {descripcion: 'usuarios', nombre: 'Usuarios'},
        {descripcion: 'clientes', nombre: 'Clientes'},
        {descripcion: 'tarifas', nombre: 'Tarifas'},
        {descripcion: 'servicios', nombre: 'Servciios'},
    ],

    paises: [
        {descripcion: "Colombia"}
    ],

    tiposId: [
        {descripcion: 'Cedula Ciudadania'},
        {descripcion: 'NIT'},
    ],

    tiposGenero: [
        {descripcion: 'Masculino'},
        {descripcion: 'Femenino'},
    ],

    tiposDuracion: [
        {descripcion: "fija"},
        {descripcion: "flexible"},
    ],

    tiposHorario: [
        {descripcion: "diurno"},
        {descripcion: "nocturno"},
    ],

    tiposNovedad: [
        {descripcion: 'retirado', retirado: true},
        {descripcion: 'vacaciones', retirado: false},
        {descripcion: 'permiso', retirado: false},
        {descripcion: 'incapacidad', retirado: false},
    ],
    
    users: [
        {
            primerNombre: 'Videlca', 
            primerApellido: 'User', 
            email: 'example@example.com', 
            clave: '123Abc!', 
            numeroIdentificacion: '1234567890', 
            tipoIdentificacion: 'Cedula Ciudadania', 
            rol: 'super-admin'
        },
    ],
}