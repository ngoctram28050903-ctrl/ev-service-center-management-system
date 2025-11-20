"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import { Reminder, CreateReminderRequest, addReminder, getReminders } from "@/services/vehicleService";
import { toast } from "react-hot-toast";
import Bell from "@/icons/bell.svg";
import Plus from "@/icons/plus.svg";
import Alert from "@/icons/alert.svg";

interface ReminderManagementProps {
  vehicleId: number;
  vehicleName: string;
}

export default function ReminderManagement({ vehicleId, vehicleName }: ReminderManagementProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateReminderRequest>({
    vehicleId,
    message: "",
    date: "",
  });
  const { isOpen, openModal, closeModal } = useModal();

  const fetchReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getReminders(vehicleId);
      setReminders(data);
    } catch {
      toast.error("Không thể tải danh sách nhắc nhở");
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    if (isOpen) {
      fetchReminders();
    }
  }, [isOpen, vehicleId, fetchReminders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addReminder(vehicleId, formData);
      toast.success("Thêm nhắc nhở thành công");
      setFormData({
        vehicleId,
        message: "",
        date: "",
      });
      fetchReminders();
    } catch {
      toast.error("Không thể thêm nhắc nhở");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-amber-600 hover:to-orange-600 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2"
      >
        Nhắc nhở
      </button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] p-0"
      >
        <div className="flex flex-col h-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
              <Bell className="h-5 w-5 fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Quản lý nhắc nhở
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {vehicleName}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

            {/* Add Reminder Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-left">
                      Nội dung nhắc nhở
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors duration-200"
                      rows={4}
                      placeholder="Nhập nội dung nhắc nhở..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-left">
                      Ngày nhắc nhở
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-base text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors duration-200"
                      required
                    />
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Đang thêm...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 fill-white" />
                          Thêm nhắc nhở
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Reminders List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Danh sách nhắc nhở
                  </h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {reminders.length} nhắc nhở
                  </span>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải danh sách nhắc nhở...</p>
                  </div>
                ) : reminders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                      <Alert className="h-8 w-8 fill-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có nhắc nhở nào</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                      Hãy thêm nhắc nhở đầu tiên để quản lý lịch bảo dưỡng xe của bạn
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    {reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`group relative overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-md ${
                          reminder.completed
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800"
                            : "bg-gradient-to-r from-white to-gray-50 border-gray-200 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                        }`}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className={`text-base font-semibold mb-2 ${
                                reminder.completed 
                                  ? "line-through text-gray-500 dark:text-gray-400" 
                                  : "text-gray-900 dark:text-white"
                              }`}>
                                {reminder.message}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Ngày: {formatDate(reminder.date)}
                              </p>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              <span
                                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                                  reminder.completed
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                }`}
                              >
                                {reminder.completed ? "Hoàn thành" : "Chờ xử lý"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={closeModal}
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
