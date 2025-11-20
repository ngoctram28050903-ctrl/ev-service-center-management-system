"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AppointmentDataTable from "@/components/appointment/AppointmentDataTable";
import { getAllAppointments, Appointment } from "@/services/appointmentService";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";

export default function AppointmentPage() {
  const headers = [
    { key: "userId", title: "Khách hàng" },
    { key: "serviceCenter", title: "Trung tâm dịch vụ" },
    { key: "vehicleId", title: "Phương tiện" },
    { key: "datetime", title: "Ngày giờ hẹn" },
    { key: "status", title: "Trạng thái" },
    { key: "notes", title: "Ghi chú" },
    { key: "action", title: "Hành động" },
  ];

  const [appointments, setAppointments] = useState<Appointment[]>([]);
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

  const fetchAppointments = useCallback(async (isSearch = false) => {
    try {
      if (isSearch) {
        setIsSearching(true);
      } else {
        setIsLoading(true);
      }
      const data = await getAllAppointments();
      setAppointments(data);
      
      // Client-side pagination
      const filtered = searchTerm.trim() 
        ? data.filter((a: Appointment) =>
            [
              a.user?.username,
              a.user?.email,
              a.serviceCenter?.name,
              a.notes,
              a.status,
            ]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(searchTerm.trim().toLowerCase()))
          )
        : data;
      
      setTotalItems(filtered.length);
      const pages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
      setTotalPages(pages);
    } catch (e) {
      toast.error(getErrorMessage(e, "Không thể tải danh sách lịch hẹn"));
    } finally {
      if (isSearch) {
        setIsSearching(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [searchTerm, itemsPerPage, setTotalItems, setTotalPages]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    setSearchTerm(trimmedQuery);
    resetToFirstPage();
    fetchAppointments(true);
  }, [fetchAppointments, resetToFirstPage]);

  const handleRefresh = useCallback(() => {
    fetchAppointments(true);
  }, [fetchAppointments]);

  // Client-side filtering and pagination
  const filteredAppointments = searchTerm.trim()
    ? appointments.filter((a) =>
        [
          a.user?.username,
          a.user?.email,
          a.serviceCenter?.name,
          a.notes,
          a.status,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(searchTerm.trim().toLowerCase()))
      )
    : appointments;

  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản lý lịch hẹn" />
      <div className="space-y-6">
        <ComponentCard title="">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              </div>
            </div>
          ) : (
            <AppointmentDataTable 
              headers={headers} 
              items={paginatedAppointments} 
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