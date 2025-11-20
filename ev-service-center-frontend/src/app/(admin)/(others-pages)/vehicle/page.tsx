"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import VehicleDataTable from "@/components/vehicle/VehicleDataTable";
import { getVehicles, Vehicle } from "@/services/vehicleService";
import React, { useEffect, useCallback, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";
import { useAuth } from "@/hooks/useAuth";
import { IUserRole } from "@/types/common";

export default function VehiclePage() {
  const { user } = useAuth();
  const headers = [
    { key: "ownerName", title: "Chủ xe" },
    { key: "brand", title: "Thương hiệu" },
    { key: "licensePlate", title: "Biển số xe" },
    { key: "model", title: "Mẫu xe" },
    { key: "year", title: "Năm sản xuất" },
    { key: "status", title: "Trạng thái" },
    { key: "action", title: "Hành động" },
  ];

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Memoize role check để tránh re-render liên tục
  const isUserRole = useMemo(() => {
    if (!user || !user.userRoles) return false;
    const userRoles = user.userRoles.map((ur: IUserRole) => ur.role.name);
    return userRoles.includes('user');
  }, [user]);
  
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

  const fetchVehicles = useCallback(
    async (params?: Record<string, string | number>, isSearch = false) => {
      try {
        if (isSearch) {
          setIsSearching(true);
        } else {
          setIsLoading(true);
        }

        const searchParams: Record<string, string | number> = {
          ...params,
          page: currentPage,
          limit: itemsPerPage,
        };

        // Nếu user có role = "user", thêm userId filter
        if (isUserRole && user?.id) {
          searchParams.userId = user.id;
        }

        const data = await getVehicles(searchParams);

        setVehicles(data.data as Vehicle[]);
        setTotalItems(data.total);
        setTotalPages(data.totalPages);
      } catch (e) {
        toast.error(getErrorMessage(e, "Không thể tải danh sách xe"));
      } finally {
        if (isSearch) {
          setIsSearching(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [currentPage, itemsPerPage, setTotalItems, setTotalPages, user, isUserRole]
  );

  const handleSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      setSearchTerm(trimmedQuery);
      resetToFirstPage();

      if (trimmedQuery) {
        fetchVehicles(
          {
            keyword: trimmedQuery,
          },
          true
        );
      } else {
        fetchVehicles({}, true);
      }
    },
    [fetchVehicles, resetToFirstPage]
  );

  const handleRefresh = useCallback(() => {
    if (searchTerm.trim()) {
      fetchVehicles(
        {
          keyword: searchTerm.trim(),
        },
        true
      );
    } else {
      fetchVehicles({}, true);
    }
  }, [searchTerm, fetchVehicles]);

  useEffect(() => {
    fetchVehicles({});
  }, [fetchVehicles]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản lý xe cá nhân" />
      <div className="space-y-6">
        <ComponentCard title="">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              </div>
            </div>
          ) : (
            <VehicleDataTable
              headers={headers}
              items={vehicles}
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
