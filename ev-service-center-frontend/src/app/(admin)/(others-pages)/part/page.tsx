"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PartDataTable from "@/components/part/PartDataTable";
import { getParts, Part } from "@/services/partService";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";

export default function PartPage() {
  const headers = [
    { key: "name", title: "Tên phụ tùng" },
    { key: "partNumber", title: "Mã phụ tùng" },
    { key: "quantity", title: "Số lượng" },
    { key: "minStock", title: "Tồn kho tối thiểu" },
    { key: "status", title: "Trạng thái" },
    { key: "createdAt", title: "Ngày tạo" },
    { key: "action", title: "Hành động" },
  ];

  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Use pagination hook
  const {
    currentPage,
    itemsPerPage,
    paginationInfo,
    handlePageChange,
    handleItemsPerPageChange,
    setTotalItems,
    setTotalPages,
    resetToFirstPage,
  } = usePagination();

  const fetchParts = useCallback(async (params?: Record<string, string | number>, isSearch = false) => {
    try {
      if (isSearch) {
        setIsSearching(true);
      } else {
        setIsLoading(true);
      }
      
      const searchParams = {
        page: currentPage,
        limit: itemsPerPage,
        ...params,
      };
      
      const response = await getParts(searchParams);
      
      setParts(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tải danh sách phụ tùng"));
    } finally {
      if (isSearch) {
        setIsSearching(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [currentPage, itemsPerPage, setTotalItems, setTotalPages]);

  // Initial load and fetch data when pagination changes
  useEffect(() => {
    fetchParts({});
  }, [fetchParts]);

  const handleSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    setSearchTerm(trimmedQuery);
    resetToFirstPage();
    
    if (trimmedQuery) {
      fetchParts({ 
        search: trimmedQuery,
      }, true);
    } else {
      fetchParts({}, true);
    }
  }, [fetchParts, resetToFirstPage]);

  const handleRefresh = useCallback(() => {
    if (searchTerm.trim()) {
      fetchParts({ 
        search: searchTerm.trim(),
      }, true);
    } else {
      fetchParts({}, true);
    }
  }, [searchTerm, fetchParts]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản lý phụ tùng" />
      <div className="space-y-6">
        <ComponentCard title="">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              </div>
            </div>
          ) : (
            <PartDataTable 
              headers={headers} 
              items={parts} 
              onRefresh={handleRefresh}
              searchTerm={searchTerm}
              onSearch={handleSearch}
              isSearching={isSearching}
              pagination={paginationInfo}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </ComponentCard>
      </div>
    </div>
  );
}