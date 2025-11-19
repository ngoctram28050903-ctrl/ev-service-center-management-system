"use client";
import React, { useMemo, useState } from "react";
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Header } from "@/types/common";
import { ChecklistItem, updateChecklistItem } from "@/services/workorderService";
import { Modal } from "../ui/modal";
import Select from "../form/Select";
import { ChevronDownIcon } from "@/icons";
import { getUsers, PaginatedUserResponse } from "@/services/userService";
import { UserRole } from "@/constants/user.constant";
import { VERY_BIG_NUMBER } from "@/constants/common";
import SearchableDataTable from "../common/SearchableDataTable";
import { PaginationInfo } from "../common/Pagination";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

interface TaskDataTableProps {
  items: ChecklistItem[];
  headers: Header[];
  searchTerm?: string;
  onSearch?: (query: string) => void;
  isSearching?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  onRefresh?: () => void;
}

export default function TaskDataTable({
  headers,
  items,
  searchTerm = "",
  onSearch,
  isSearching = false,
  pagination,
  onPageChange,
  onItemsPerPageChange,
  onRefresh
}: TaskDataTableProps) {
  const { user, hasRole } = useAuth();
  const [assignedMap, setAssignedMap] = useState<Record<number, number | undefined>>({});
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [usersResponse, setUsersResponse] = useState<PaginatedUserResponse | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<number, boolean>>({});
  const [isAssigning, setIsAssigning] = useState(false);

  const isAdmin = hasRole([UserRole.Admin]);

  const isStaff = hasRole([UserRole.Staff]);

  const openAssignModal = async (itemId: number) => {
    if (!isAdmin) {
      toast.error("Chỉ quản trị viên mới có quyền gán nhân viên phụ trách");
      return;
    }

    setSelectedItemId(itemId);

    const currentItem = items.find(item => item.id === itemId);
    if (currentItem?.assignedToUserId) {
      setAssignedMap(prev => ({ ...prev, [itemId]: currentItem.assignedToUserId || undefined }));
    }

    setIsAssignModalOpen(true);
    try {
      setIsLoadingUsers(true);
      const res = await getUsers({ limit: VERY_BIG_NUMBER, role: UserRole.Staff });
      setUsersResponse(res);
    } catch {
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleMarkComplete = async (item: ChecklistItem) => {
    if (!isStaff || !user || item.assignedToUserId !== user.id) {
      toast.error("Bạn chỉ có thể đánh dấu hoàn thành những task được gán cho bạn");
      return;
    }

    if (item.completed) {
      toast.error("Task này đã được đánh dấu hoàn thành");
      return;
    }

    try {
      setIsUpdatingStatus(prev => ({ ...prev, [item.id]: true }));

      await updateChecklistItem(item.workOrderId, item.id, { completed: true });

      toast.success("Đã đánh dấu task hoàn thành");

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái task");
      console.error("Error updating task status:", error);
    } finally {
      setIsUpdatingStatus(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleMarkIncomplete = async (item: ChecklistItem) => {
    if (!isStaff || !user || item.assignedToUserId !== user.id) {
      toast.error("Bạn chỉ có thể đánh dấu chưa hoàn thành những task được gán cho bạn");
      return;
    }

    if (!item.completed) {
      toast.error("Task này đã được đánh dấu chưa hoàn thành");
      return;
    }

    try {
      setIsUpdatingStatus(prev => ({ ...prev, [item.id]: true }));

      await updateChecklistItem(item.workOrderId, item.id, { completed: false });

      toast.success("Đã đánh dấu task chưa hoàn thành");

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái task");
      console.error("Error updating task status:", error);
    } finally {
      setIsUpdatingStatus(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const userOptions = useMemo(() => {
    if (!usersResponse) return [] as { value: string; label: string }[];
    return (usersResponse.data || []).map((u) => ({ value: String(u.id), label: u.username || `User #${u.id}` }));
  }, [usersResponse]);

  const handleAssign = (userIdStr: string) => {
    if (selectedItemId == null) return;
    const userId = userIdStr === "-" ? undefined : Number(userIdStr);
    setAssignedMap((prev) => ({ ...prev, [selectedItemId]: userId }));
  };

  const handleConfirmAssign = async () => {
    if (selectedItemId == null) return;

    const selectedUserId = assignedMap[selectedItemId];
    const selectedItem = items.find(item => item.id === selectedItemId);

    if (!selectedItem) {
      toast.error("Không tìm thấy task");
      return;
    }

    try {
      setIsAssigning(true);

      await updateChecklistItem(selectedItem.workOrderId, selectedItemId, {
        assignedToUserId: selectedUserId || null,
        assignedAt: selectedUserId ? new Date().toISOString() : null
      });

      toast.success("Đã gán nhân viên phụ trách thành công");

      setIsAssignModalOpen(false);

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gán nhân viên phụ trách");
      console.error("Error assigning user:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const getAssignedName = (itemId: number) => {
    const item = items.find(i => i.id === itemId);
    if (item?.assignedUser) {
      return item.assignedUser.username || `User #${item.assignedUser.id}`;
    }

    if (item?.assignedToUserId) {
      return `User #${item.assignedToUserId}`;
    }

    const userId = assignedMap[itemId];
    if (!userId || !usersResponse) return "Chưa gán";
    const found = usersResponse.data.find((u) => Number(u.id) === Number(userId));
    return found?.username || `User #${userId}`;
  };

  // Component hiển thị nhân viên phụ trách với style đẹp
  const renderAssignee = (item: ChecklistItem) => {
    const assignedUser = item.assignedUser;
    const assignedName = getAssignedName(item.id);
    const isAssigned = assignedUser || item.assignedToUserId;

    if (!isAssigned) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Chưa gán</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">Chờ phân công</span>
          </div>
        </div>
      );
    }

    // Tạo màu ngẫu nhiên dựa trên username để có màu nhất quán
    const getAvatarColor = (username: string) => {
      const colors = [
        'bg-gradient-to-br from-blue-400 to-blue-600',
        'bg-gradient-to-br from-green-400 to-green-600', 
        'bg-gradient-to-br from-purple-400 to-purple-600',
        'bg-gradient-to-br from-pink-400 to-pink-600',
        'bg-gradient-to-br from-indigo-400 to-indigo-600',
        'bg-gradient-to-br from-yellow-400 to-yellow-600',
        'bg-gradient-to-br from-red-400 to-red-600',
        'bg-gradient-to-br from-teal-400 to-teal-600'
      ];
      const hash = username.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      return colors[hash % colors.length];
    };

    const avatarColor = getAvatarColor(assignedName);
    const initials = assignedName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
      <div className="flex items-center gap-3 group">
        <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105`}>
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {assignedName}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Đang phụ trách</span>
          </div>
        </div>
      </div>
    );
  };

  const renderRow = (item: ChecklistItem) => {
    const canModifyTask = isStaff && user && item.assignedToUserId === user.id;
    const canMarkComplete = canModifyTask && !item.completed;
    const canMarkIncomplete = canModifyTask && item.completed;

    return (
      <TableRow key={item.id}>
        <TableCell className="px-4 py-3 text-start text-gray-700 dark:text-gray-300 text-theme-sm">
          {item.vehicle ? (
            <div className="text-sm">
              <div className="font-medium">{item.vehicle.licensePlate}</div>
              <div className="text-xs text-gray-500">{item.vehicle.brand} {item.vehicle.model}</div>
            </div>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </TableCell>
        <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-700 dark:text-gray-300 text-theme-sm">
          {item.task}
        </TableCell>
        <TableCell className="px-4 py-3 text-start text-gray-700 dark:text-gray-300 text-theme-sm">
          {item.price.toLocaleString('vi-VN')} VND
        </TableCell>
        <TableCell className="px-4 py-3 text-start text-gray-700 dark:text-gray-300 text-theme-sm">
          {new Date(item.createdAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </TableCell>
        <TableCell className="px-4 py-3 text-start">
          <Badge size="sm" color={item.completed ? 'success' : 'warning'}>
            {item.completed ? 'Hoàn thành' : 'Chưa hoàn thành'}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3 text-start">
          {renderAssignee(item)}
        </TableCell>
        <TableCell className="px-4 py-3 text-start">
          <div className="flex gap-2 justify-start">
            {canMarkComplete && (
              <button
                onClick={() => handleMarkComplete(item)}
                disabled={isUpdatingStatus[item.id]}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isUpdatingStatus[item.id] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Hoàn thành
                  </>
                )}
              </button>
            )}

            {canMarkIncomplete && (
              <button
                onClick={() => handleMarkIncomplete(item)}
                disabled={isUpdatingStatus[item.id]}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isUpdatingStatus[item.id] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Chưa hoàn thành
                  </>
                )}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => openAssignModal(item.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Gán phụ trách
              </button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <>
      <SearchableDataTable
        headers={headers}
        items={items as never}
        renderRow={renderRow as never}
        searchTerm={searchTerm}
        onSearch={onSearch}
        searchPlaceholder="Tìm kiếm theo tên nhiệm vụ..."
        isSearching={isSearching}
        pagination={pagination}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
      />

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        className="max-w-[600px] p-0"
      >
        <div className="flex flex-col h-full">
          {/* Header với gradient background */}
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-8 py-6 rounded-t-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h5 className="text-2xl font-bold text-white">
                  Gán người phụ trách
                </h5>
                <p className="text-orange-100 text-sm">
                  Chọn nhân viên phụ trách cho nhiệm vụ này
                </p>
              </div>
            </div>
          </div>

          {/* Form content */}
          <div className="flex-1 px-8 py-6 bg-gray-50 dark:bg-gray-900">
            {/* Form field với styling đẹp */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Nhân viên phụ trách <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Select
                    value={assignedMap[selectedItemId ?? -1]?.toString() || "-"}
                    onChange={handleAssign}
                    options={[{ value: "-", label: isLoadingUsers ? "Đang tải..." : "Chọn nhân viên" }, ...userOptions]}
                    className="dark:bg-gray-800"
                    disabled={isLoadingUsers || isAssigning}
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon />
                  </span>
                </div>
                {isLoadingUsers && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Đang tải danh sách nhân viên...</span>
                  </div>
                )}
              </div>

              {/* Thông tin task hiện tại */}
              {selectedItemId && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Nhiệm vụ #{selectedItemId}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">
                        {items.find(item => item.id === selectedItemId)?.task || "Đang tải thông tin..."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer với gradient background */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-8 py-6 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Chọn nhân viên để gán phụ trách nhiệm vụ</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={isAssigning}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Đóng
                </button>
                
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  disabled={isAssigning}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Xác nhận gán
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
