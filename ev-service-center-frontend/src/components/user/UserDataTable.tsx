"use client";
import React, { useState, useEffect } from "react";
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { BasicTableProps, Header, User } from "@/types/common";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import SingleSelect from "../form/SingleSelect";
import { CreateUserDto, createUser, deleteUser, updateUser, UpdateUserDto } from "@/services/userService";
import { toast } from "react-hot-toast";
import { UserRole, UserRoleOptions } from "@/constants/user.constant";
// Removed academic fields; keep only username, email, role, password
import SearchableDataTable from "../common/SearchableDataTable";
import { PaginationInfo } from "../common/Pagination";

interface UserDataTableProps extends BasicTableProps {
  onRefresh: () => void;
  items: User[];
  headers: Header[];
  searchTerm?: string;
  onSearch?: (query: string) => void;
  isSearching?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
}

// Function to get Vietnamese label for role
const getRoleLabel = (role: UserRole): string => {
  const roleOption = UserRoleOptions.find(option => option.value === role);
  return roleOption ? roleOption.label : role;
};

// Function to get all role labels for a user
const getAllRoleLabels = (user: User): string[] => {
  if (!user.userRoles || user.userRoles.length === 0) {
    return [getRoleLabel(UserRole.User)];
  }
  return user.userRoles.map(userRole => getRoleLabel(userRole?.role?.name as UserRole));
};

// Function to check if user has elevated role (Admin/Staff)
const hasElevatedRole = (user: User): boolean | undefined => {
  return user.userRoles && user.userRoles.some(userRole => [UserRole.Admin, UserRole.Staff].includes(userRole?.role?.name as UserRole));
};

export default function UserDataTable({ 
  headers, 
  items, 
  onRefresh, 
  searchTerm = "", 
  onSearch,
  isSearching = false,
  pagination,
  onPageChange,
  onItemsPerPageChange
}: UserDataTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateUserDto | UpdateUserDto>({
    username: "",
    email: "",
    roles: UserRole.User,
    password: "",
  });
  const { isOpen, openModal, closeModal } = useModal();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUser(null);
      setFormData({
        username: "",
        email: "",
        roles: UserRole.User,
        password: "",
      });
    }
  }, [isOpen]);

  // Update form data when selected User changes
  useEffect(() => {
    if (selectedUser) {
      const firstRole = selectedUser.userRoles?.[0]?.role?.name || UserRole.User;
      setFormData({
        username: selectedUser.username,
        email: selectedUser.email,
        roles: firstRole,
      });
    }
  }, [selectedUser]);

  const handleSelectUserRoleChange = (value: string) => {
    setFormData({ ...formData, roles: value as UserRole });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    openModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (selectedUser?.id) {
        await updateUser(selectedUser.id.toString(), formData as UpdateUserDto);
        toast.success("Cập nhật tài khoản thành công");
      } else {
        await createUser(formData as CreateUserDto);
        toast.success("Thêm tài khoản thành công");
      }
      closeModal();
      onRefresh();
    } catch (error: unknown) {
      console.error('Error in handleSubmit:', error);
      const errorMessage = selectedUser?.id ? "Không thể cập nhật tài khoản" : "Không thể thêm tài khoản";
      
      // Try to get specific error message
      if (error instanceof Error && error.message) {
        toast.error(`${errorMessage}: ${error.message}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isSubmitting) return;

    const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?");
    if (!isConfirmed) return;

    try {
      setIsSubmitting(true);
      await deleteUser(id.toString());
      toast.success("Xóa tài khoản thành công");
      onRefresh();
    } catch (error: unknown) {
      console.error('Error in handleDelete:', error);
      
      let errorMessage = "Không thể xóa tài khoản";
      
      // Handle constraint violation error
      if (error instanceof Error && error.message) {
        if (error.message.includes("Không thể xóa tài khoản này vì đang được sử dụng trong:")) {
          errorMessage = error.message;
          toast.error(errorMessage, {
            duration: 6000, // Show longer for constraint errors
          });
        } else {
          toast.error(`${errorMessage}: ${error.message}`);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render row function
  const renderRow = (user: User) => (
    <TableRow key={user.id}>
      <TableCell className="px-5 py-4 sm:px-6 text-start">
        <div className="flex items-center gap-3">
          <div>
            <span className="block text-gray-500 text-theme-sm dark:text-gray-400">
              {user.username}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {user.email}
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        <div className="flex flex-wrap gap-1">
          {getAllRoleLabels(user).map((roleLabel, index) => (
            <Badge
              key={index}
              size="sm"
              color={hasElevatedRole(user) ? "success" : "error"}
            >
              {roleLabel}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {new Date(user.createdAt).toLocaleString('vi-VN')}
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {new Date(user.updatedAt).toLocaleString('vi-VN')}
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleEdit(user)}
            className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
          >
            Sửa
          </button>
          <button
            onClick={() => handleDelete(user.id)}
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
      Thêm tài khoản
    </button>
  );

  return (
    <>
      <SearchableDataTable
        headers={headers}
        items={items}
        renderRow={renderRow}
        searchTerm={searchTerm}
        onSearch={onSearch}
        searchPlaceholder="Tìm kiếm theo username..."
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
              {selectedUser ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}
            </h5>
          </div>
          <div className="mt-8">
            <div className="mb-3">
              <div className="relative">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Loại tài khoản
                </label>
                <SingleSelect
                  value={formData.roles}
                  options={UserRoleOptions}
                  placeholder="Loại tài khoản"
                  onChange={handleSelectUserRoleChange}
                  className="dark:bg-dark-900"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Tên tài khoản
              </label>
              <input
                id="name"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Email
              </label>
              <input
                id="email"
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            
            {selectedUser && selectedUser?.id ?
              null
              : (<div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>)}
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
              {isSubmitting ? "Đang xử lý..." : selectedUser ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
