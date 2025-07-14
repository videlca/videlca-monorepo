import { axiosClient } from "../../config"
import type { loginUserDto } from "../../dtos"
import type { ApiResponse } from "../../types/common"

interface loginResponse {
  status?: number
  message?: string
  data?: {
    user: {
      idUser: number
      email: string
      nombre: string
    }
  }
}

export const login = async (data: loginUserDto): Promise<loginResponse> => {
  const response = await axiosClient.post('/auth/login', data).then((res) => {
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

export const logout = async () => {
  const response = await axiosClient.get('/auth/logout').then((res) => {
    return res.data
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
}

export const checkAuth = async () => {
  try {
    const response = await axiosClient.get('/auth/validate')
    return response.data
  } catch (error: any) {
    console.error('Auth validation error:', error)
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de autenticación'
    }
  }
}

// Recuperar contraseña
export const recoverPassword = async (data: { numeroIdentificacion: string }): Promise<ApiResponse> => {
  const response = await axiosClient.post('/auth/olvide-password', data).then((res) => {
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

export const validateToken = async (token: string): Promise<ApiResponse> => {
  const response = await axiosClient.get(`/auth/olvide-password/${token}`).then((res) => {
    return {
      status: res.status,
      data: true
    }
  }).catch((error) => {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || 'Error de conexión',
    }
  })
  return response
}

export const updatePassword = async (token: string, data: { clave: string, confirmarClave: string }): Promise<ApiResponse> => {
  const response = await axiosClient.post(`/auth/olvide-password/${token}`, data).then((res) => {
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