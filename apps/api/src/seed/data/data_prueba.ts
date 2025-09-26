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

interface EstadoApp {
    nombre: string,
    descripcion: string;
    estado: boolean;
}

// tipo novedad
interface TipoNovedad {
    descripcion: string;
    retirado: boolean;
}

// Tipo horario descripcion
interface TipoHorarioDescripcion {
    nombre: string;
    descripcion: string;
}

interface SeedData {
    users: User[],
    roles: Role[],
    permissions: Permission[],
    tiposId: Tipo[],
    tiposGenero: Tipo[],
    tiposDuracion: Tipo[],
    tiposHorario: TipoHorarioDescripcion[],
    paises: Tipo[],
    tiposNovedad: TipoNovedad[],
    estadosOrdenServicio: EstadoOrdenServicio[],
    estadosApp: EstadoApp[],
    tiposUnidadTiempo: TipoUnidadTiempo[],
    tiposTarifa: TipoTarifa[]
}

export const initialData: SeedData = {

    tiposUnidadTiempo: [
        {descripcion: "dias", requiereTiempo: true},
        {descripcion: "no aplica", requiereTiempo: false},
    ],

    tiposDuracion: [
        {descripcion: "fija"},
        {descripcion: "flexible"},
    ],

    tiposTarifa: [
        {nombre: "mes", descripcion: "El precio total del servicio equivale a un mes", tipoUnidadTiempo: "dias", cantidadTiempo: 30},
        {nombre: "dia", descripcion: "El precio total del servicio equivale a un dia", tipoUnidadTiempo: "no aplica"},
        {nombre: "hora", descripcion: "El precio total del servicio equivale a una hora", tipoUnidadTiempo: "no aplica"},
        {nombre: "unidad", descripcion: "El precio total del servicio equivale a un evento o dia", tipoUnidadTiempo: "no aplica"},
    ],
    
    estadosOrdenServicio: [
        {nombre: "anulada", descripcion: "Estado para indicar que una orden de servicio ha sido anulada", estado: true, programable: false},
        {nombre: "cancelada", descripcion: "Estado para indicar que una orden de servicio ha sido cancelada", estado: true, programable: false},
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

    estadosApp: [
        
        {nombre: "creacion periodo", descripcion: "Enviar correos referentes al modulo tarifa: creacion de periodos", estado: true},
        {nombre: "configuracion de tarifas de un periodo", descripcion: "Enviar correos refrentes al modulo tarifas: configurar tarifas a un periodo", estado: true},
        {nombre: "creacion liquidacion", descripcion: "Enviar correos refrentes al modulo liquidacion: creacion de liquidacion", estado: true},
        {nombre: "aprobacion/desaprobacion liquidacion", descripcion: "Enviar correos refrentes al modulo liquidacion: aprobacion o desaprobacion de liquidacion de ordenes", estado: true},
        
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
        {descripcion: 'servicios', nombre: 'Servicios'},
        {descripcion: 'ordenes-servicio', nombre: 'Ordenes Servicio'},
        {descripcion: 'programaciones', nombre: 'Programacion Personal'},
        {descripcion: 'liquidaciones', nombre: 'Liquidaciones'},
        {descripcion: 'aprobacion-liquidaciones-ordenes', nombre: 'Aprobacion Liquidacion Ordenes Servicio'},
        {descripcion: 'reportes', nombre: 'Reportes'},
        {descripcion: 'exportaciones-base-facturacion', nombre: 'Exportaciones Base Facturacion'},
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

    tiposHorario: [
        {nombre: "diurno", descripcion: "Horario que se realiza durante el dia, este horario va ligado a la ley de horas laborales"},
        {nombre: "nocturno", descripcion: "Horario que se realiza durante la noche, este horario va ligado a la ley de horas laborales"},
        {nombre: "dia completo (24 horas)", descripcion: "Horario que se realiza durante todo el dia, servicio que se presta las 24 horas"},
        {nombre: "mixto", descripcion: "Horario que se realiza durante el dia o la noche, dependiendo de la necesidad del cliente, por ejemplo Recogida de dinero"},
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