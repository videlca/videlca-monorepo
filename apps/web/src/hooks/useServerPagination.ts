import { useState, useCallback } from 'react';
import type { PaginationDto } from '../api/dtos/common';

interface UseServerPaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  paginationParams: PaginationDto;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: number) => void;
}

export function useServerPagination(defaultPageSize = 10): UseServerPaginationReturn {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const paginationParams: PaginationDto = {
    pagination: 'true',
    limit: pageSize,
    offset: page * pageSize,
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(0); // Reset to first page when changing page size
  }, []);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    paginationParams,
    handlePageChange,
    handlePageSizeChange,
  };
}
