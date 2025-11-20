export enum VehicleType {
  Car = "car",
  Motorcycle = "motorcycle",
  Truck = "truck",
  Bus = "bus",
}

export enum VehicleStatus {
  Active = "active",
  Inactive = "inactive",
  Maintenance = "maintenance",
}

export const VehicleTypeOptions = [
  { value: VehicleType.Car, label: "Ô tô" },
  { value: VehicleType.Motorcycle, label: "Xe máy" },
  { value: VehicleType.Truck, label: "Xe tải" },
  { value: VehicleType.Bus, label: "Xe bus" },
];

export const VehicleStatusOptions = [
  { value: VehicleStatus.Active, label: "Hoạt động" },
  { value: VehicleStatus.Inactive, label: "Không hoạt động" },
  { value: VehicleStatus.Maintenance, label: "Bảo trì" },
];

export enum ReminderType {
  Maintenance = "maintenance",
  Inspection = "inspection",
  Insurance = "insurance",
  Registration = "registration",
}

export const ReminderTypeOptions = [
  { value: ReminderType.Maintenance, label: "Bảo trì" },
  { value: ReminderType.Inspection, label: "Kiểm định" },
  { value: ReminderType.Insurance, label: "Bảo hiểm" },
  { value: ReminderType.Registration, label: "Đăng ký" },
];
