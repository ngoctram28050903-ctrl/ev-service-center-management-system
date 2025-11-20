"use client";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";
import React from "react";

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  className?: string;
  showItemsPerPage?: boolean;
  itemsPerPageOptions?: number[];
}

export default function Pagination({
  pagination,
  onPageChange,
  onItemsPerPageChange,
  className = "",
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 20, 50, 100]
}: PaginationProps) {
  const { currentPage, totalPages, totalItems, itemsPerPage, hasNext, hasPrev } = pagination;

  // Debug info
  console.log('Pagination debug:', { currentPage, totalPages, totalItems, itemsPerPage, hasNext, hasPrev });

  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(event.target.value);
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newLimit);
    }
  };

  // Don't render if there's only one page and no items per page selector
  if (totalPages <= 1 && !showItemsPerPage) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Items per page selector */}
      {showItemsPerPage && (
        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">Hiển thị</span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="font-medium">trên tổng số <span className="text-brand-600 dark:text-brand-400">{totalItems}</span> mục</span>
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {/* Previous button */}
          <button
            onClick={() => {
              console.log('Previous button clicked', { currentPage, totalPages, hasPrev });
              handlePageChange(currentPage - 1);
            }}
            disabled={!hasPrev}
            className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 border ${
              hasPrev
                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-300 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500'
                : 'text-gray-300 border-gray-200 cursor-not-allowed dark:text-gray-600 dark:border-gray-700'
            }`}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {/* Page numbers */}
          {getVisiblePages().map((page, index) => {
            // Ensure both are numbers for comparison
            const pageNumber = typeof page === 'number' ? page : parseInt(String(page));
            const currentPageNumber = typeof currentPage === 'number' ? currentPage : parseInt(String(currentPage));
            const isCurrentPage = pageNumber === currentPageNumber;
            
            console.log('Page rendering:', { 
              page, 
              pageNumber,
              currentPage, 
              currentPageNumber,
              isCurrentPage, 
              totalPages,
              type: typeof page,
              typeCurrent: typeof currentPage
            });
            
            return (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 font-medium">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      console.log('Page button clicked:', { page, pageNumber, currentPage, currentPageNumber, totalPages });
                      handlePageChange(pageNumber);
                    }}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                      isCurrentPage
                        ? 'bg-blue-100 text-blue-800 border-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-500'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-300 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500'
                    }`}
                    style={isCurrentPage ? {
                      backgroundColor: '#dbeafe', // blue-100
                      color: '#1e40af', // blue-800
                      borderColor: '#2563eb', // blue-600
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    } : {}}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            );
          })}

          {/* Next button */}
          <button
            onClick={() => {
              console.log('Next button clicked', { currentPage, totalPages, hasNext });
              handlePageChange(currentPage + 1);
            }}
            disabled={!hasNext}
            className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 border ${
              hasNext
                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-300 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500'
                : 'text-gray-300 border-gray-200 cursor-not-allowed dark:text-gray-600 dark:border-gray-700'
            }`}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Page info */}
      {totalPages > 1 && (
        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          Trang <span className="text-brand-600 dark:text-brand-400">{currentPage}</span> của <span className="text-brand-600 dark:text-brand-400">{totalPages}</span>
        </div>
      )}
    </div>
  );
}
