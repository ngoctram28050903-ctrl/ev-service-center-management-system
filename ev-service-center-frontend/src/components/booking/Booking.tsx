"use client";
import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Select from "../form/Select";
import { CreateAppointmentDto, UpdateAppointmentDto, createAppointment, updateAppointment, deleteAppointment, getAppointmentById, Appointment, ServiceCenter } from "@/services/appointmentService";
import { ChevronDownIcon } from "@/icons";
import DatePicker from "../form/date-picker";
import { User } from "@/types/common";
import { Vehicle, getVehiclesByUserId } from "@/services/vehicleService";
import moment from "moment";
import axios from "axios";
import { UserRole } from "@/constants/user.constant";
import { TimeSlotOptions } from "@/constants/appointment.constant";
import toast from "react-hot-toast";

interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  extendedProps: {
    calendar: string;
  };
}

const getAppointmentStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
    'pending': "Warning",
    'confirmed': "Success",
    'cancelled': "Danger"
  };

  return statusColorMap[status] || "Primary";
};

const mapAppointmentToEvent = (appointment: Appointment): CalendarEvent => ({
  id: appointment.id.toString(),
  title: appointment.vehicle?.licensePlate || "No vehicle",
  start: moment(appointment.date).format("YYYY-MM-DD"),
  extendedProps: {
    calendar: getAppointmentStatusColor(appointment.status || "")
  }
});

const renderEventContent = (eventInfo: EventContentArg) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

interface BookingProps {
  onRefresh: () => void;
  appointments: Appointment[];
  users: User[];
  vehicles: Vehicle[];
  serviceCenters: ServiceCenter[];
}

export default function BookingDataTable({ onRefresh, appointments, users, vehicles: initialVehicles, serviceCenters }: BookingProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateAppointmentDto>({
    createdById: 0,
    serviceCenterId: 0,
    vehicleId: initialVehicles.length > 0 ? initialVehicles[0].id : 0,
    date: "",
    timeSlot: "",
    status: 'pending',
    notes: ""
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const { isOpen, openModal, closeModal } = useModal();
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    if (!appointments || appointments.length === 0) return [];
    return appointments.map(mapAppointmentToEvent);
  });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.userRoles?.[0]?.role?.name === UserRole.User) {
        setFormData(prev => ({
          ...prev,
          createdById: parsedUser.id
        }));
      }
    }
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAppointment(null);
      setFormData({
        createdById: user?.id || 0,
        serviceCenterId: 0,
        vehicleId: initialVehicles.length > 0 ? initialVehicles[0].id : 0,
        date: "",
        timeSlot: "",
        status: 'pending',
        notes: ""
      });
      setVehicles(initialVehicles);
    }
  }, [isOpen, initialVehicles, user]);

  // Update events when appointments change
  useEffect(() => {
    if (!appointments || appointments.length === 0) {
      setEvents([]);
      return;
    }
    setEvents(appointments.map(mapAppointmentToEvent));
  }, [appointments]);

  const handleSelectUserChange = async (value: string) => {
    const userId = parseInt(value);

    try {
      const userVehicles = await getVehiclesByUserId(userId);
      setVehicles(userVehicles);
      // Set vehicleId to first vehicle if available, otherwise 0
      const vehicleId = userVehicles.length > 0 ? userVehicles[0].id : 0;
      setFormData({ ...formData, createdById: userId, vehicleId });
    } catch {
      toast.error("Không thể tải danh sách xe");
      setVehicles([]);
      setFormData({ ...formData, createdById: userId, vehicleId: 0 });
    }
  };

  const handleSelectVehicleChange = (value: string) => {
    setFormData({ ...formData, vehicleId: parseInt(value) });
  };

  const handleSelectStatusChange = (value: string) => {
    setFormData({ ...formData, status: value as 'pending' | 'confirmed' | 'cancelled' });
  };

  const handleSelectServiceCenterChange = (value: string) => {
    setFormData({ ...formData, serviceCenterId: parseInt(value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation: Không cho phép submit khi vehicleId = 0
    if (formData.vehicleId === 0) {
      toast.error("Vui lòng chọn xe");
      return;
    }

    // Validation: Không cho phép submit khi serviceCenterId = 0
    if (formData.serviceCenterId === 0) {
      toast.error("Vui lòng chọn trung tâm dịch vụ");
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedAppointment?.id) {
        await updateAppointment(selectedAppointment.id, formData as UpdateAppointmentDto);
        toast.success("Cập nhật lịch hẹn thành công");
      } else {
        await createAppointment(formData as CreateAppointmentDto);
        toast.success("Tạo lịch hẹn thành công");
      }
      closeModal();
      onRefresh();
    } catch {
      toast.error(selectedAppointment?.id ? "Không thể cập nhật lịch hẹn" : "Không thể tạo lịch hẹn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isSubmitting) return;

    const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa lịch hẹn này không?");
    if (!isConfirmed) return;

    try {
      setIsSubmitting(true);
      await deleteAppointment(id);
      toast.success("Xóa lịch hẹn thành công");
      closeModal();
      onRefresh();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const serverError = error.response.data;
        toast.error(serverError.message || "Không thể xóa lịch hẹn");
      } else {
        toast.error("Không thể xóa lịch hẹn");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calendarRef = useRef<FullCalendar>(null);

  const handleEventClick = async (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const appointmentId = parseInt(event.id);

    try {
      const appointment = await getAppointmentById(appointmentId);
      if (appointment) {
        setSelectedAppointment(appointment);
        setFormData({
          createdById: appointment.createdById,
          serviceCenterId: appointment.serviceCenterId,
          vehicleId: appointment.vehicleId || 0,
          date: moment(appointment.date).format("YYYY-MM-DD"),
          timeSlot: appointment.timeSlot,
          status: appointment.status,
          notes: appointment.notes || ""
        });
        openModal();
      }
    } catch {
      toast.error("Không thể lấy thông tin lịch hẹn");
    }
  };

  return (
    <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="custom-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next addEventButton",
            center: "title",
            right: "",
          }}
          events={events}
          selectable={true}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          customButtons={{
            addEventButton: {
              text: "Đặt lịch hẹn +",
              click: openModal,
            },
          }}
        />
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[800px] p-0"
      >
        <div className="flex flex-col h-full">
          {/* Header với gradient background */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6 rounded-t-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h5 className="text-2xl font-bold text-white">
                  {selectedAppointment ? "Chi tiết lịch hẹn" : "Đặt lịch hẹn mới"}
                </h5>
                <p className="text-blue-100 text-sm">
                  {selectedAppointment ? "Xem và chỉnh sửa thông tin lịch hẹn" : "Đặt lịch bảo dưỡng ngay hôm nay để trải nghiệm dịch vụ hoàn hảo nhất"}
                </p>
              </div>
            </div>
          </div>

          {/* Form content */}
          <div className="flex-1 px-8 py-6 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-900">
            {/* Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ngày hẹn */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ngày hẹn <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DatePicker
                    id="date-picker"
                    placeholder="Chọn ngày hẹn"
                    onChange={(dates) => {
                      if (dates && dates[0]) {
                        const date = dates[0];
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const formattedDate = `${year}-${month}-${day}`;
                        setFormData(prev => ({
                          ...prev,
                          date: formattedDate
                        }));
                      }
                    }}
                    defaultDate={formData.date ? moment(formData.date).format("YYYY-MM-DD") : undefined}
                  />
                </div>
              </div>

              {/* Khung giờ */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Khung giờ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Select
                    value={formData.timeSlot || ""}
                    options={TimeSlotOptions}
                    placeholder="Chọn khung giờ"
                    onChange={(value) => setFormData({ ...formData, timeSlot: value })}
                    className="dark:bg-gray-800"
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>
            </div>
            {/* Khách hàng */}
            <div className="mt-8 space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Khách hàng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Select
                  value={formData.createdById?.toString() || "0"}
                  onChange={handleSelectUserChange}
                  options={[
                    {
                      value: "0",
                      label: "Chọn khách hàng",
                    },
                    ...(user?.userRoles?.[0]?.role?.name === UserRole.User
                      ? users
                        .filter(u => u.id === user?.id)
                        .map(u => ({
                          value: u.id.toString(),
                          label: String(u.name || u.username || `User ${u.id}`),
                        }))
                      : users
                        .filter(u => u.userRoles?.[0]?.role?.name === UserRole.User)
                        .map(u => ({
                          value: u.id.toString(),
                          label: String(u.name || u.username || `User ${u.id}`),
                        })))
                  ]}
                  disabled={user?.userRoles?.[0]?.role?.name === UserRole.User}
                  className="dark:bg-gray-800"
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <ChevronDownIcon />
                </span>
              </div>
              {user?.userRoles?.[0]?.role?.name === UserRole.User && (
                <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {String(user?.name || user?.username || `User ${user?.id}`)}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">
                        Khách hàng đã được chọn tự động
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Grid cho xe và trung tâm */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Phương tiện */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0M15 17a2 2 0 104 0" />
                  </svg>
                  Phương tiện
                </label>
                <div className="relative">
                  <Select
                    value={formData.vehicleId?.toString() || ""}
                    options={vehicles.map((vehicle) => ({
                      value: vehicle.id.toString(),
                      label: vehicle.licensePlate,
                    }))}
                    onChange={handleSelectVehicleChange}
                    className="dark:bg-gray-800"
                    disabled={!formData.createdById}
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>

              {/* Trung tâm dịch vụ */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Trung tâm dịch vụ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Select
                    value={formData.serviceCenterId?.toString() || ""}
                    options={[
                      {
                        value: "0",
                        label: "Chọn trung tâm dịch vụ",
                      },
                      ...serviceCenters.map((center) => ({
                        value: center.id.toString(),
                        label: center.name,
                      })),
                    ]}
                    onChange={handleSelectServiceCenterChange}
                    className="dark:bg-gray-800"
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>
            </div>
            {/* Trạng thái (chỉ admin/staff) */}
            {(user?.userRoles?.[0]?.role?.name === UserRole.Admin || user?.userRoles?.[0]?.role?.name === UserRole.Staff) && (
              <div className="mt-8 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Trạng thái
                </label>
                <div className="relative">
                  <Select
                    value={formData.status?.toString() || ""}
                    options={[
                      {
                        value: "",
                        label: "Chọn trạng thái",
                      },
                      { value: "pending", label: "Chờ xác nhận" },
                      { value: "confirmed", label: "Đã xác nhận" },
                      { value: "cancelled", label: "Đã hủy" }
                    ]}
                    onChange={handleSelectStatusChange}
                    className="dark:bg-gray-800"
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>
            )}

            {/* Ghi chú */}
            <div className="mt-8 space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Ghi chú
              </label>
              <div className="relative">
                <textarea
                  placeholder="Nhập ghi chú về lịch hẹn (tùy chọn)..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-600 transition-all duration-200 resize-none"
                  rows={4}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {formData.notes?.length || 0}/500
                </div>
              </div>
            </div>
          </div>

          {/* Footer với gradient background */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-8 py-6 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Các trường có dấu <span className="text-red-500">*</span> là bắt buộc</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  type="button"
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Đóng
                </button>

                {selectedAppointment && selectedAppointment.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(selectedAppointment.id)}
                      type="button"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa
                    </button>
                    <button
                      onClick={handleSubmit}
                      type="button"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Cập nhật
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSubmit}
                    type="button"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Tạo lịch hẹn
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}