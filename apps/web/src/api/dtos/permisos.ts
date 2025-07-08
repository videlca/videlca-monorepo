export interface CreateRoleDto {
  permissionsIds: string[]
  descripcion: string
}

export interface UpdateRoleDto {
  estado: boolean
}

export interface UpdateUserStateRoleDto {
  idRol: string
  estado: boolean
}
