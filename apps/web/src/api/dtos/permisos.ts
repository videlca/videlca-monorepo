export interface CreateRoleDto {
  permissionsIds: number[]
  descripcion: string
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {
  estado?: boolean
}

export interface UpdateUserStateRoleDto {
  idRol: string
  estado: boolean
}
