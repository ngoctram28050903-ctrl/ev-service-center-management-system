"use client";
import React from "react";
import { BasicTableProps, Header, RowData } from "@/types/common";
import DataTable from "./DataTable";
import SearchBox from "./SearchBox";
import { PaginationInfo } from "./Pagination";

export interface SearchableDataTableProps<T extends RowData> extends BasicTableProps {
  headers: Header[];
  items: T[];
  renderRow: (item: T) => React.ReactNode;
  
  // Search props
  searchTerm?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  isSearching?: boolean;
  
  // Pagination props
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  
  // Action props
  actionButton?: React.ReactNode;
  
  // Customization
  emptyState?: React.ReactNode;
  className?: string;
  showSearch?: boolean;
  showPagination?: boolean;
}

export default function SearchableDataTable<T extends RowData>({
  headers,
  items,
  renderRow,
  
  // Search props
  searchTerm = "",
  onSearch,
  searchPlaceholder = "Tìm kiếm...",
  isSearching = false,
  
  // Pagination props
  pagination,
  onPageChange,
  onItemsPerPageChange,
  
  // Action props
  actionButton,
  
  // Customization
  emptyState,
  className = "",
  showSearch = true,
  showPagination = true,
}: SearchableDataTableProps<T>) {
  return (
    <div className={`overflow-hidden rounded-xl bg-white dark:border-white/[0.05] dark:bg-white/[0.03] relative ${className}`}>
      {/* Header with actions and search */}
      <div className="mb-6 px-5 flex items-center justify-between gap-4">
        {actionButton && (
          <div className="flex-shrink-0">
            {actionButton}
          </div>
        )}
        
        {showSearch && onSearch && (
          <div className="flex-1 max-w-2xl ml-auto">
            <SearchBox
              placeholder={searchPlaceholder}
              onSearch={onSearch}
              defaultValue={searchTerm}
            />
          </div>
        )}
      </div>
      
      {/* Search Loading Overlay */}
      {isSearching && (
        <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tìm kiếm...</p>
          </div>
        </div>
      )}
      
      {/* Data Table */}
      <DataTable
        headers={headers}
        items={items}
        renderRow={renderRow}
        pagination={showPagination ? pagination : undefined}
        onPageChange={showPagination ? onPageChange : undefined}
        onItemsPerPageChange={showPagination ? onItemsPerPageChange : undefined}
        emptyState={emptyState}
        searchTerm={searchTerm}
        className="border-0"
      />
    </div>
  );
}
