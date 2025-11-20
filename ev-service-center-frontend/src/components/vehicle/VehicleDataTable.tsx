"use client";
import React, { useState, useEffect } from "react";
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Header } from "@/types/common";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import { CreateVehicleRequest, deleteVehicle, updateVehicle, Vehicle } from "@/services/vehicleService";
import { createVehicle } from "@/services/vehicleService";
import { getAllUsers, User } from "@/services/authService";
import SingleSelect from "../form/SingleSelect";
import toast from "react-hot-toast";
import ReminderManagement from "./ReminderManagement";
import { UserRole } from "@/constants/user.constant";
import { VERY_BIG_NUMBER } from "@/constants/common";
import SearchableDataTable from "../common/SearchableDataTable";
import { PaginationInfo } from "../common/Pagination";

interface VehicleDataTableProps {
  onRefresh: () => void;
  items: Vehicle[];
  headers: Header[];
  searchTerm?: string;
  onSearch?: (query: string) => void;
  isSearching?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
}

export default function VehicleDataTable({ 
  headers, 
  items, 
  onRefresh,
  searchTerm = "", 
  onSearch,
  isSearching = false,
  pagination, 
  onPageChange, 
  onItemsPerPageChange 
}: VehicleDataTableProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formData, setFormData] = useState<CreateVehicleRequest>({
    licensePlate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    userId: null,
  });
  const { isOpen, openModal, closeModal } = useModal();

  // Load users when component mounts
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await getAllUsers({ limit: VERY_BIG_NUMBER, role: UserRole.User });
        setUsers(response.data);
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error("Không thể tải danh sách người dùng");
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVehicle(null);
      setFormData({
        licensePlate: "",
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        userId: null,
      });
    }
  }, [isOpen]);

  // Update form data when selected vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      setFormData({
        licensePlate: selectedVehicle.licensePlate,
        brand: selectedVehicle.brand,
        model: selectedVehicle.model,
        year: selectedVehicle.year,
        userId: selectedVehicle.userId,
      });
    }
  }, [selectedVehicle]);

  const handleUserChange = (userId: string) => {
    setFormData({ ...formData, userId: parseInt(userId) });
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    openModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (selectedVehicle?.id) {
        await updateVehicle(selectedVehicle.id, { ...formData, userId: formData.userId ?? (null as unknown as number) });
        toast.success("Cập nhật phương tiện thành công");
      } else {
        await createVehicle({ ...formData, userId: formData.userId ?? (null as unknown as number) });
        toast.success("Thêm phương tiện thành công");
      }
      closeModal();
      onRefresh();
    } catch {
      toast.error(selectedVehicle?.id ? "Không thể cập nhật phương tiện" : "Không thể thêm phương tiện");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isSubmitting) return;

    const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa phương tiện này?");
    if (!isConfirmed) return;

    try {
      setIsSubmitting(true);
      await deleteVehicle(id);
      toast.success("Xóa phương tiện thành công");
      onRefresh(); // Refresh data after successful deletion
    } catch {
      toast.error("Không thể xóa phương tiện");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render row function
  const renderRow = (item: Vehicle) => (
    <TableRow key={item.id}>
      <TableCell className="px-5 py-4 sm:px-6 text-center">
        <div className="flex items-start gap-3">
          <div>
            <span className="block text-gray-500 text-theme-sm dark:text-gray-400">
              {(() => {
                const user = users.find(u => u.id === item.userId);
                return user ? (user.username || user.email) : `Email: ${item.email}`;
              })()}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {item.brand}
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {item.licensePlate}
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {item.model}
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {item.year}
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        <Badge
          size="sm"
          color="success"
        >
          Hoạt động
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-end text-theme-sm dark:text-gray-400">
        <div className="flex items-end gap-3">
          <ReminderManagement 
            vehicleId={item.id} 
            vehicleName={`${item.brand} ${item.model} - ${item.licensePlate}`}
          />
          <button
            onClick={() => handleEdit(item)}
            className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
          >
            Cập nhật
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="btn btn-error btn-delete-event flex w-full justify-center rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 sm:w-auto"
          >
            Xóa
          </button>
        </div>
      </TableCell>
    </TableRow>
  );

  // Action button
  const actionButton = (
    <button
      onClick={openModal}
      type="button"
      className="btn btn-success btn-update-event flex justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
    >
      + Thêm phương tiện
    </button>
  );

  return (
    <>
      <SearchableDataTable
        headers={headers}
        items={items as never}
        renderRow={renderRow as never}
        searchTerm={searchTerm}
        onSearch={onSearch}
        searchPlaceholder="Tìm kiếm theo biển số, hãng, mẫu, năm..."
        isSearching={isSearching}
        pagination={pagination}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
        actionButton={actionButton}
      />

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                  {selectedVehicle ? "Chỉnh sửa phương tiện" : "Thêm phương tiện"}
            </h5>
          </div>
          <div className="mt-8">
                <div className="mb-3">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Biển số xe
                  </label>
                  <input
                    id="license-plate"
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Thương hiệu
                  </label>
                  <input
                    id="brand"
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Mẫu xe
                  </label>
                  <input
                    id="model"
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Năm sản xuất
                  </label>
                  <input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Người dùng
                  </label>
                  <SingleSelect
                    options={users.map(user => ({
                      value: user.id.toString(),
                      label: `${user.username || user.email} (${user.email ?? 'Không có email'})`
                    }))}
                    value={formData?.userId?.toString()}
                    onChange={handleUserChange}
                    placeholder={loadingUsers ? "Đang tải..." : "Chọn người dùng"}
                    disabled={loadingUsers}
                  />
                </div>
              </div>
          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={closeModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
                  Đóng
            </button>
            <button
                  onClick={handleSubmit}
              type="button"
                  disabled={isSubmitting}
              className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
            >
                  {isSubmitting ? "Đang xử lý..." : selectedVehicle ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
