"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ServiceCenterDataTable from "@/components/service-center/ServiceCenterDataTable";
import { getAllServiceCenters, ServiceCenter } from "@/services/serviceCenterService";
import React, { useEffect, useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";

export default function ServiceCenterPage() {
  const headers = [
    { key: "name", title: "Tên trung tâm" },
    { key: "address", title: "Địa chỉ" },
    { key: "phone", title: "Số điện thoại" },
    { key: "email", title: "Email" },
    { key: "createdAt", title: "Ngày tạo" },
    { key: "action", title: "Hành động" },
  ];

  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
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

  const fetchServiceCenters = useCallback(
    async (params?: Record<string, string | number>, isSearch = false) => {
      try {
        if (isSearch) {
          setIsSearching(true);
        } else {
          setIsLoading(true);
        }

        const searchParams = {
          ...params,
          page: currentPage,
          limit: itemsPerPage,
        };

        const data = await getAllServiceCenters(searchParams);

        setServiceCenters(data.data as ServiceCenter[]);
        setTotalItems(data.total);
        setTotalPages(data.totalPages);
      } catch (e) {
        toast.error(getErrorMessage(e, "Không thể tải danh sách trung tâm dịch vụ"));
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

  const handleSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      setSearchTerm(trimmedQuery);
      resetToFirstPage();

      if (trimmedQuery) {
        fetchServiceCenters(
          {
            keyword: trimmedQuery,
          },
          true
        );
      } else {
        fetchServiceCenters({}, true);
      }
    },
    [fetchServiceCenters, resetToFirstPage]
  );

  const handleRefresh = useCallback(() => {
    if (searchTerm.trim()) {
      fetchServiceCenters(
        {
          keyword: searchTerm.trim(),
        },
        true
      );
    } else {
      fetchServiceCenters({}, true);
    }
  }, [searchTerm, fetchServiceCenters]);

  useEffect(() => {
    fetchServiceCenters({});
  }, [fetchServiceCenters]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản lý trung tâm dịch vụ" />
      <div className="space-y-6">
        <ComponentCard title="">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              </div>
            </div>
          ) : (
            <ServiceCenterDataTable
              headers={headers}
              items={serviceCenters}
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