"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TaskDataTable from "@/components/task/TaskDataTable";
import React, { useEffect, useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { getAllChecklistItems, ChecklistItem } from "@/services/workorderService";
import { getErrorMessage } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";

export default function TaskPage() {
  const headers = [
    { key: "vehicleId", title: "Phương tiện" },
    { key: "task", title: "Tên nhiệm vụ" },
    { key: "price", title: "Giá" },
    { key: "createdAt", title: "Ngày tạo" },
    { key: "status", title: "Trạng thái" },
    { key: "assignee", title: "Nhân viên phụ trách" },
    { key: "action", title: "Hành động" },
  ];

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

  const fetchTasks = useCallback(
    async (params?: Record<string, string | number>, isSearch = false) => {
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

        const response = await getAllChecklistItems(searchParams);

        setChecklistItems(response.data);
        setTotalItems(response.total);
        setTotalPages(response.totalPages);
      } catch (e) {
        toast.error(getErrorMessage(e, "Không thể tải danh sách công việc"));
      } finally {
        if (isSearch) {
          setIsSearching(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [currentPage, itemsPerPage, setTotalItems, setTotalPages]
  );

  // Initial load and fetch data when pagination changes
  useEffect(() => {
    fetchTasks({});
  }, [fetchTasks]);

  const handleSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      setSearchTerm(trimmedQuery);
      resetToFirstPage();

      if (trimmedQuery) {
        fetchTasks(
          {
            keyword: trimmedQuery,
          },
          true
        );
      } else {
        fetchTasks({}, true);
      }
    },
    [fetchTasks, resetToFirstPage]
  );

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản lý công việc" />
      <div className="space-y-6">
        <ComponentCard title="">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              </div>
            </div>
          ) : (
            <TaskDataTable 
              headers={headers} 
              items={checklistItems} 
              searchTerm={searchTerm}
              onSearch={handleSearch}
              isSearching={isSearching}
              pagination={paginationInfo}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              onRefresh={() => fetchTasks({})}
            />
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
