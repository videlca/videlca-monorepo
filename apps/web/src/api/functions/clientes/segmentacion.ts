import type { Segmentacion, SubSegmentacion } from "../../../types"
import { axiosClient } from "../../config"
import type { CreateSegmentacionDto, UpdateSegmentacionDto } from "../../dtos"
import type { PaginationDto } from "../../dtos/common"
import type { ApiResponse } from "../../types/common"

export const createSegmentacion = async (data: CreateSegmentacionDto): Promise<ApiResponse> => {
  const response = await axiosClient.post('/segmentaciones', data).then((res) => {
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

export const getSegmentaciones = async (pagination: PaginationDto): Promise<ApiResponse<Segmentacion[]>> => {
  const response = await axiosClient.get('/segmentaciones', { params: pagination }).then((res) => {
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

export const getSegmentacionById = async (id: number): Promise<ApiResponse<Segmentacion>> => {
  const response = await axiosClient.get(`/segmentaciones/${id}`).then((res) => {
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

export const updateSegmentacion = async (id: number, data: UpdateSegmentacionDto): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/segmentaciones/${id}`, data).then((res) => {
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
  return response;
};

export const deleteSegmentacion = async (id: number): Promise<ApiResponse> => {
  const response = await axiosClient.delete(`/segmentaciones/${id}`).then((res) => {
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


// Subsegmentaciones
export const getSubSegmentaciones = async (pagination: PaginationDto): Promise<ApiResponse<SubSegmentacion[]>> => {
  const response = await axiosClient.get('/subsegmentaciones', { params: pagination }).then((res) => {
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

export const deleteSubSegmentacion = async (id: number): Promise<ApiResponse> => {
  const response = await axiosClient.delete(`/subsegmentaciones/${id}`).then((res) => {
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

export const updateSubSegmentacion = async (
  id: number,
  data: { descripcion?: string; estado?: boolean },
): Promise<ApiResponse> => {
  const response = await axiosClient.patch(`/subsegmentaciones/${id}`, data).then((res) => {
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
