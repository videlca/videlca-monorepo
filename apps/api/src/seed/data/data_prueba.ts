interface User {
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    email: string;
    clave?: string;
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

interface EstadoOrdenServicio {
    descripcion: string;
    estado: boolean;
    programable: boolean;
    dias: number;
}

interface SeedData {
    users: User[],
    roles: Role[],
    permissions: Permission[],
    tiposId: Tipo[],
    estadosOrdenServicio: EstadoOrdenServicio[]
}

export const initialData: SeedData = {
    
    estadosOrdenServicio: [
        {descripcion: "programado", estado: true, programable: false, dias: 0},
        {descripcion: "por iniciar", estado: true, programable: true, dias: 2},
        {descripcion: "iniciado", estado: true, programable: false, dias: 0},
        {descripcion: "por terminar", estado: true, programable: true, dias: 2},
        {descripcion: "terminado", estado: true, programable: false, dias: 0}
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
    ],

    tiposId: [
        {descripcion: 'Cedula Ciudadania'},
        {descripcion: 'NIT'},
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