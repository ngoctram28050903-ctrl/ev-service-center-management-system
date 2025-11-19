"use client";
import React, { useState, useEffect } from "react";
import { TableCell, TableRow } from "../ui/table";
import { ApiError, Header, IStockLog } from "@/types/common";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import {
  CreatePartDto,
  deletePart,
  updatePart,
  Part,
  createPart,
  updateStock,
  UpdateStockDto,
  getStockHistory,
  StockHistoryResponse
} from "@/services/partService";
import toast from "react-hot-toast";
import SearchableDataTable from "../common/SearchableDataTable";
import { PaginationInfo } from "../common/Pagination";

interface PartDataTableProps {
  onRefresh: () => void;
  items: Part[];
  headers: Header[];
  searchTerm?: string;
  onSearch?: (query: string) => void;
  isSearching?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
}

export default function PartDataTable({ 
  headers, 
  items, 
  onRefresh,
  searchTerm = "", 
  onSearch,
  isSearching = false,
  pagination,
  onPageChange,
  onItemsPerPageChange
}: PartDataTableProps) {
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreatePartDto>({
    name: "",
    partNumber: "",
    quantity: 0,
    minStock: 0,
  });
  const [stockFormData, setStockFormData] = useState<UpdateStockDto>({
    changeType: 'IN',
    quantity: 0,
    reason: '',
  });
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isStockHistoryModalOpen, setIsStockHistoryModalOpen] = useState(false);
  const [stockHistoryData, setStockHistoryData] = useState<StockHistoryResponse | null>(null);
  const [stockHistoryPage, setStockHistoryPage] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPart(null);
      setFormData({
        name: "",
        partNumber: "",
        quantity: 0,
        minStock: 0,
      });
    }
  }, [isOpen]);

  // Update form data when selected part changes
  useEffect(() => {
    if (selectedPart) {
      setFormData({
        name: selectedPart.name,
        partNumber: selectedPart.partNumber,
        quantity: selectedPart.quantity,
        minStock: selectedPart.minStock,
      });
    }
  }, [selectedPart]);

  const handleEdit = (part: Part) => {
    setSelectedPart(part);
    openModal();
  };

  const handleStockUpdate = (part: Part) => {
    setSelectedPart(part);
    setStockFormData({
      changeType: 'IN',
      quantity: 0,
      reason: '',
    });
    setIsStockModalOpen(true);
  };

  const handleStockHistory = async (part: Part) => {
    setSelectedPart(part);
    setStockHistoryPage(1);
    await fetchStockHistory(part.id, 1);
    setIsStockHistoryModalOpen(true);
  };

  const fetchStockHistory = async (partId: number, page: number) => {
    try {
      setIsLoadingHistory(true);
      const response = await getStockHistory(partId, { page, limit: 10 });
      setStockHistoryData(response);
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || "Không thể tải lịch sử kho");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleStockHistoryPageChange = async (newPage: number) => {
    if (!selectedPart) return;
    setStockHistoryPage(newPage);
    await fetchStockHistory(selectedPart.id, newPage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (selectedPart?.id) {
        await updatePart(selectedPart.id, formData);
        toast.success("Cập nhật phụ tùng thành công");
      } else {
        await createPart(formData);
        toast.success("Thêm phụ tùng thành công");
      }
      closeModal();
      onRefresh();
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || (selectedPart?.id ? "Không thể cập nhật phụ tùng" : "Không thể thêm phụ tùng"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedPart) return;

    try {
      setIsSubmitting(true);
      await updateStock(selectedPart.id, stockFormData);
      toast.success(`Cập nhật kho thành công: ${stockFormData.changeType === 'IN' ? 'Nhập' : 'Xuất'} ${stockFormData.quantity} sản phẩm`);
      setIsStockModalOpen(false);
      onRefresh();
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || "Không thể cập nhật kho");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isSubmitting) return;

    const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa phụ tùng này?");
    if (!isConfirmed) return;

    try {
      setIsSubmitting(true);
      await deletePart(id);
      toast.success("Xóa phụ tùng thành công");
      onRefresh();
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || "Không thể xóa phụ tùng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity <= 0) return { text: "Hết hàng", color: "text-red-500" };
    if (quantity <= minStock) return { text: "Sắp hết", color: "text-yellow-500" };
    return { text: "Còn hàng", color: "text-green-500" };
  };

  // Render row function
  const renderRow = (item: Part) => {
    const stockStatus = getStockStatus(item.quantity, item.minStock);
    return (
      <TableRow key={item.id}>
        <TableCell className="px-5 py-4 sm:px-6 text-start">
          <div className="flex items-center gap-3">
            <div>
              <span className="block text-gray-500 text-theme-sm dark:text-gray-400">
                {item.name}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {item.partNumber}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <span className={`font-medium ${stockStatus.color}`}>
            {item.quantity}
          </span>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {item.minStock}
        </TableCell>
        <TableCell className="px-4 py-3 text-start text-theme-sm">
          <span className={`font-medium ${stockStatus.color}`}>
            {stockStatus.text}
          </span>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {formatDate(item.createdAt)}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-end text-theme-sm dark:text-gray-400">
          <div className="flex items-end gap-2">
            <button
              onClick={() => handleEdit(item)}
              className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600 sm:w-auto"
            >
              Sửa
            </button>
            <button
              onClick={() => handleStockUpdate(item)}
              className="btn btn-info btn-update-event flex w-full justify-center rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600 sm:w-auto"
            >
              Kho
            </button>
            <button
              onClick={() => handleStockHistory(item)}
              className="btn btn-secondary btn-update-event flex w-full justify-center rounded-lg bg-gray-500 px-3 py-2 text-xs font-medium text-white hover:bg-gray-600 sm:w-auto"
            >
              Lịch sử
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="btn btn-error btn-delete-event flex w-full justify-center rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 sm:w-auto"
            >
              Xóa
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Action button
  const actionButton = (
    <button
      onClick={openModal}
      type="button"
      className="btn btn-success btn-update-event flex justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
    >
      + Thêm phụ tùng
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
        searchPlaceholder="Tìm kiếm theo tên hoặc mã phụ tùng..."
        isSearching={isSearching}
        pagination={pagination}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
        actionButton={actionButton}
      />

      {/* Part Form Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {selectedPart ? "Chỉnh sửa phụ tùng" : "Thêm phụ tùng"}
            </h5>
          </div>
          <div className="mt-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tên phụ tùng *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Nhập tên phụ tùng"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Mã phụ tùng *
                </label>
                <input
                  id="partNumber"
                  type="text"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Nhập mã phụ tùng"
                  required
                />
              </div>
              {!selectedPart && (
                <div className="mb-3">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Số lượng ban đầu
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity || 0}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="Nhập số lượng ban đầu"
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tồn kho tối thiểu
                </label>
                <input
                  id="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock || 0}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Nhập tồn kho tối thiểu"
                />
              </div>
            </form>
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
              {isSubmitting ? "Đang xử lý..." : selectedPart ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stock Update Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        className="max-w-[500px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Cập nhật kho: {selectedPart?.name}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tồn kho hiện tại: <span className="font-medium">{selectedPart?.quantity}</span>
            </p>
          </div>
          <div className="mt-8">
            <form onSubmit={handleStockSubmit}>
              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Loại thay đổi *
                </label>
                <select
                  value={stockFormData.changeType}
                  onChange={(e) => setStockFormData({ ...stockFormData, changeType: e.target.value as 'IN' | 'OUT' })}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  required
                >
                  <option value="IN">Nhập kho</option>
                  <option value="OUT">Xuất kho</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Số lượng *
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockFormData.quantity || 0}
                  onChange={(e) => setStockFormData({ ...stockFormData, quantity: parseInt(e.target.value) || 0 })}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Nhập số lượng"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Lý do (tùy chọn)
                </label>
                <textarea
                  value={stockFormData.reason || ''}
                  onChange={(e) => setStockFormData({ ...stockFormData, reason: e.target.value })}
                  className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  rows={3}
                  placeholder="Nhập lý do thay đổi kho"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={() => setIsStockModalOpen(false)}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Đóng
            </button>
            <button
              onClick={handleStockSubmit}
              type="button"
              disabled={isSubmitting}
              className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
            >
              {isSubmitting ? "Đang xử lý..." : "Cập nhật kho"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stock History Modal */}
      <Modal
        isOpen={isStockHistoryModalOpen}
        onClose={() => setIsStockHistoryModalOpen(false)}
        className="max-w-[800px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Lịch sử xuất nhập kho: {selectedPart?.name}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mã phụ tùng: <span className="font-medium">{selectedPart?.partNumber}</span>
            </p>
          </div>
          
          <div className="mt-8">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            ) : stockHistoryData ? (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                          Thời gian
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          Loại
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          Số lượng
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                          Lý do
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockHistoryData.data.stockLogs.map((log: IStockLog, index: number) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              log.changeType === 'IN' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {log.changeType === 'IN' ? 'Nhập kho' : 'Xuất kho'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-gray-100">
                            {log.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {log.reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {stockHistoryData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Trang {stockHistoryData.page} / {stockHistoryData.totalPages} 
                      ({stockHistoryData.total} bản ghi)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStockHistoryPageChange(stockHistoryPage - 1)}
                        disabled={!stockHistoryData.hasPrev || isLoadingHistory}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-800"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => handleStockHistoryPageChange(stockHistoryPage + 1)}
                        disabled={!stockHistoryData.hasNext || isLoadingHistory}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-800"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Không có dữ liệu lịch sử
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={() => setIsStockHistoryModalOpen(false)}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}