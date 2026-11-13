import type { Usuario } from "../../../types";
import { axiosClient } from "../../config";
import type { CambiarClaveDto, CreateUserDto, UpdateUserDto, UpdateUserStatusDto } from "../../dtos";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse, PaginatedResponse } from "../../types/common";

export const getUsuarios = async (pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Usuario[]>>> => {
  const response = await axiosClient.get('/users', { params: pagination }).then((res) => {
    return {
      status: res.status,
      data: res.data
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
};

export const getFilteredUsuarios = async (filter: any): Promise<ApiResponse<PaginatedResponse<Usuario[]>>> => {
  const response = await axiosClient.get('/users/filter', { params: filter }).then((res) => {
    return {
      status: res.status,
      data: res.data
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
};

export const createUsuario = async (data: CreateUserDto): Promise<ApiResponse> => {
  const response = await axiosClient.post('/users', data).then((res) => {
    return {
      status: res.status,
      data: res.data
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
}

export const updateUsuario = async (id: number, data: UpdateUserDto | UpdateUserStatusDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/users/${id}`, data).then((res) => {
    return {
      status: res.status,
      data: res.data
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
}

export const getUsuarioById = async (id: number): Promise<ApiResponse<Usuario>> => {
  const response = await axiosClient.get(`/users/${id}`).then((res) => {
    return {
      status: res.status,
      data: res.data
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
}

// Perfil de usuario

// Eliminar un usuario por id (lo usa el admin en la pantalla de usuarios). /users/mi-perfil es otra ruta: la de
// que cada usuario elimine su propio perfil, no recibe id
export const deleteUsuario = async (id: number): Promise<ApiResponse> => {
  const response = await axiosClient.delete(`/users/${id}`).then((res) => {
    return {
      status: res.status,
      data: res.data
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
}

export const getUsuarioByCookie = async (): Promise<ApiResponse<Usuario>> => {
  const response = await axiosClient.get('/users/mi-perfil').then((res) => {
    return {
      status: res.status,
      data: res.data
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
}

export const updateUsuarioPerfil = async (data: UpdateUserDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/users/mi-perfil`, data).then((res) => {
    return {
      status: res.status,
      data: res.data
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
}

// Cambiar la contraseña del usuario logueado (pide la actual)
export const cambiarClavePerfil = async (data: CambiarClaveDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/users/mi-perfil/clave`, data).then((res) => {
    return {
      status: res.status,
      data: res.data
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
}
