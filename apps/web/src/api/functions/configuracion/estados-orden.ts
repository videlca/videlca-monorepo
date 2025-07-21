import type { EstadoOrden } from "../../../types"
import { axiosClient } from "../../config"
import type { CreateEstadoOrdenDto, UpdateEstadoOrdenDto } from "../../dtos"
import type { PaginationDto } from "../../dtos/common"
import type { ApiResponse } from "../../types/common"


export const getEstadosOrden = async (pagination: PaginationDto): Promise<ApiResponse<EstadoOrden[]>> => {
  const response = await axiosClient.get('/estado-orden', { params: pagination }).then((res) => {
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

export const createEstadoOrden = async (data: CreateEstadoOrdenDto): Promise<ApiResponse> => {
  const response = await axiosClient.post('/estado-orden', data).then((res) => {
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

export const updateEstadoOrden = async (id: number, data: UpdateEstadoOrdenDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/estado-orden/${id}`, data).then((res) => {
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

// TODO: Eliminar estado de orden