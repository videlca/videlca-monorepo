import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";
import type { ApiResponse } from "./types";

// Use proxy in development, direct URL in production
export const API_URL = import.meta.env.VITE_API_URL;

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export interface ApiRequestConfig<T = any, P = any> extends AxiosRequestConfig {
  endpoint: string;
  method: HttpMethod;
  data?: T;
  params?: P;
}

export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiHandler = async <T = any, P = any>(config: ApiRequestConfig<T, P>): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<T> = await axiosClient({
      url: config.endpoint,
      data: config.data,
      params: config.params,
      ...config, // Allow overriding any axios config
    });

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error: any) {
    const errorResponse: ApiResponse<T> = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Error de conexión',
    };

    if(config.method === HttpMethod.GET) {
      throw new Error(errorResponse.message);
    }

    // Log error for debugging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('API Error:', {
        endpoint: config.endpoint,
        method: config.method,
        error: errorResponse,
      });
    }

    return errorResponse;
  }
};

// Convenience methods for common operations
export const apiGet = <T = any>(endpoint: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  return apiHandler<T, any>({ endpoint, method: HttpMethod.GET as any, params, ...config });
};

export const apiPost = <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  return apiHandler<T, any>({ endpoint, method: HttpMethod.POST as any, data, ...config });
};

export const apiPut = <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  return apiHandler<T, any>({ endpoint, method: HttpMethod.PUT as any, data, ...config });
};

export const apiPatch = <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  return apiHandler<T, any>({ endpoint, method: HttpMethod.PATCH as any, data, ...config });
};

export const apiDelete = <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  return apiHandler<T, any>({ endpoint, method: HttpMethod.DELETE as any, ...config });
};