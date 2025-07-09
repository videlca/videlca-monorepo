import { axiosClient } from "../../config"
import type { loginUserDto } from "../../dtos"

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
      success: false,
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
      success: false,
      isAuthenticated: false,
      message: error.response?.data?.message || 'Error de autenticación'
    }
  }
}