export interface ApiResponse<T = any> {
  status?: number
  message?: string | string[]
  data?: T
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T;
  pagination: PaginationInfo;
}