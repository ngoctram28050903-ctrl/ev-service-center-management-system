"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { BasicTableProps, Header, RowData } from "@/types/common";
import Pagination, { PaginationInfo } from "./Pagination";

export interface DataTableProps<T extends RowData> extends BasicTableProps {
  headers: Header[];
  items: T[];
  renderRow: (item: T) => React.ReactNode;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  emptyState?: React.ReactNode;
  searchTerm?: string;
  className?: string;
}

export default function DataTable<T extends RowData>({
  headers,
  items,
  renderRow,
  pagination,
  onPageChange,
  onItemsPerPageChange,
  emptyState,
  searchTerm,
  className = "",
}: DataTableProps<T>) {
  const defaultEmptyState = (
    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 min-h-[200px] w-full">
      {searchTerm ? (
        <>
          <svg
            className="w-12 h-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <div className="text-center max-w-md mt-2">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
              Không tìm thấy kết quả
            </p>
          </div>
        </>
      ) : (
        <>
          <svg
            className="w-12 h-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div className="text-center max-w-md mt-2">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chưa có dữ liệu
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hãy thêm dữ liệu đầu tiên để bắt đầu
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`overflow-hidden rounded-xl bg-white dark:border-white/[0.05] dark:bg-white/[0.03] ${className}`}>
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {headers.map((header) => (
                  <TableCell
                    key={header.key}
                    isHeader
                    className="px-5 py-3 font-medium text-start text-theme-sm dark:text-gray-400"
                  >
                    {header.title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headers.length}>
                    {emptyState || defaultEmptyState}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => renderRow(item))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && onPageChange && (
            <Pagination
              pagination={pagination}
              onPageChange={onPageChange}
              onItemsPerPageChange={onItemsPerPageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
