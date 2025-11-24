export enum AppointmentStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Cancelled = "cancelled",
  Completed = "completed",
}

export const AppointmentStatusOptions = [
  { value: AppointmentStatus.Pending, label: "Chờ xác nhận" },
  { value: AppointmentStatus.Confirmed, label: "Đang bảo dưỡng" },
  { value: AppointmentStatus.Completed, label: "Hoàn thành" },
  { value: AppointmentStatus.Cancelled, label: "Đã hủy" },
];

export const TimeSlotOptions = [
  { value: "08:00", label: "08:00" },
  { value: "09:00", label: "09:00" },
  { value: "10:00", label: "10:00" },
  { value: "11:00", label: "11:00" },
  { value: "13:00", label: "13:00" },
  { value: "14:00", label: "14:00" },
  { value: "15:00", label: "15:00" },
  { value: "16:00", label: "16:00" },
  { value: "17:00", label: "17:00" },
];

export const getStatusColor = (status: AppointmentStatus): string => {
  switch (status) {
    case AppointmentStatus.Pending:
      return "warning";
    case AppointmentStatus.Confirmed:
      return "success";
    case AppointmentStatus.Cancelled:
      return "error";
    case AppointmentStatus.Completed:
      return "info";
    default:
      return "light";
  }
};

export const getStatusLabel = (status: AppointmentStatus): string => {
  const option = AppointmentStatusOptions.find(opt => opt.value === status);
  return option ? option.label : status;
};
