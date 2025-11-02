import { useState, useCallback, useMemo } from 'react';
import { PaginationInfo } from '@/components/common/Pagination';

export interface UsePaginationOptions {
  initialPage?: number;
  initialItemsPerPage?: number;
  initialTotalItems?: number;
  initialTotalPages?: number;
}

export interface UsePaginationReturn {
  // State
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  
  // Computed values
  paginationInfo: PaginationInfo;
  
  // Actions
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  setTotalItems: (total: number) => void;
  setTotalPages: (pages: number) => void;
  
  // Handlers
  handlePageChange: (page: number) => void;
  handleItemsPerPageChange: (limit: number) => void;
  resetToFirstPage: () => void;
  
  // Utilities
  hasNext: boolean;
  hasPrev: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  startIndex: number;
  endIndex: number;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialItemsPerPage = 10,
    initialTotalItems = 0,
    initialTotalPages = 0,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  // Computed values
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Create pagination info object
  const paginationInfo: PaginationInfo = useMemo(() => ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNext,
    hasPrev,
  }), [currentPage, totalPages, totalItems, itemsPerPage, hasNext, hasPrev]);

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [currentPage, totalPages]);

  const handleItemsPerPageChange = useCallback((limit: number) => {
    if (limit !== itemsPerPage) {
      setItemsPerPage(limit);
      setCurrentPage(1); // Reset to first page when changing items per page
    }
  }, [itemsPerPage]);

  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    // State
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    
    // Computed values
    paginationInfo,
    
    // Actions
    setCurrentPage,
    setItemsPerPage,
    setTotalItems,
    setTotalPages,
    
    // Handlers
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage,
    
    // Utilities
    hasNext,
    hasPrev,
    isFirstPage,
    isLastPage,
    startIndex,
    endIndex,
  };
}
