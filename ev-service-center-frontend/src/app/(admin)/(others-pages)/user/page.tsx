"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserDataTable from "@/components/user/UserDataTable";
import { getUsers, SearchUserDto } from "@/services/userService";
import { User } from "@/types/common";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";

export default function UserPage() {
  const headers = [
    { key: "name", title: "Tên người dùng" },
    { key: "email", title: "Email" },
    { key: "role", title: "Vai trò" },
    { key: "createdAt", title: "Ngày tạo" },
    { key: "updatedAt", title: "Ngày cập nhật" },
    { key: "action", title: "Hành động" },
  ];

  const [users, setUsers] = useState<User[]>([]);
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

  const fetchUsers = useCallback(async (params?: SearchUserDto, isSearch = false) => {
    try {
      if (isSearch) {
        setIsSearching(true);
      } else {
        setIsLoading(true);
      }
      
      // Always include pagination parameters
      const searchParams: SearchUserDto = {
        ...params,
        page: currentPage,
        limit: itemsPerPage,
      };
      
      const data = await getUsers(searchParams);
      
      // API now always returns paginated response
      setUsers(data.data);
      setTotalItems(data.total);
      setTotalPages(data.totalPages);
      // Don't override currentPage from API response, let the pagination hook handle it
      // setCurrentPage(data.page); // Remove this line
    } catch (e) {
      toast.error(getErrorMessage(e, "Không thể tải danh sách tài khoản"));
    } finally {
      if (isSearch) {
        setIsSearching(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [currentPage, itemsPerPage, setTotalItems, setTotalPages]);

  const handleSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    setSearchTerm(trimmedQuery);
    resetToFirstPage(); // Reset to first page when searching
    
    if (trimmedQuery) {
      // Search by username (which is the primary field for user identification)
      fetchUsers({ 
        username: trimmedQuery,
      }, true);
    } else {
      // If no search term, fetch all users
      fetchUsers({}, true);
    }
  }, [fetchUsers, resetToFirstPage]);

  const handleRefresh = useCallback(() => {
    // Refresh with current search term and pagination
    if (searchTerm.trim()) {
      // Search by username
      fetchUsers({ 
        username: searchTerm.trim(),
      }, true);
    } else {
      fetchUsers({}, true);
    }
  }, [searchTerm, fetchUsers]);

  // Initial load and fetch data when pagination changes
  useEffect(() => {
    fetchUsers({});
  }, [fetchUsers]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản lý tài khoản" />
      <div className="space-y-6">
        <ComponentCard title="">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              </div>
            </div>
          ) : (
            <UserDataTable 
              headers={headers} 
              items={users} 
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
