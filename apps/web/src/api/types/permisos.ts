export interface Modulo {
  id: number;
  descripcion: string;
  nombre: string;
}

export type Modulos = Modulo[]

export interface Rol {
  id: number;
  nombreRol: string;
  descripcion: string;
  estado: boolean;
  permissions: Modulo[] | null;
}

export type RolesWithPermissions = Rol[]
