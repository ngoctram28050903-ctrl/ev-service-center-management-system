export enum UserRole {
  User = "user",
  Staff = "staff", 
  Admin = "admin",
}

export enum UserStatus {
  Active = "Active",
  Inactive = "Inactive",
}

export const UserStatusOptions = [
  { value: UserStatus.Active, label: "Active" },
  { value: UserStatus.Inactive, label: "Inactive" },
];

export const UserRoleOptions = [
  { value: UserRole.User, label: "Khách hàng" },
  { value: UserRole.Staff, label: "Nhân viên" },
  { value: UserRole.Admin, label: "Quản trị viên" },
];

