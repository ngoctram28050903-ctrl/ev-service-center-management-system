"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import BookingDataTable from "@/components/booking/Booking";
import {
  getAllAppointments,
  getAppointmentsByUserId,
  getAllServiceCenters,
  Appointment,
  ServiceCenter,
} from "@/services/appointmentService";
import { 
  getAllVehicles,
  getVehiclesByUserId,
  Vehicle as VehicleType 
} from "@/services/vehicleService";
import { 
  getUsers 
} from "@/services/userService";
import { User, IUserRole } from "@/types/common";
import { useAuth } from "@/hooks/useAuth";

export default function BookingPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Memoize role check để tránh re-render liên tục
  const isAdminOrStaff = useMemo(() => {
    if (!user || !user.userRoles) return false;
    const userRoles = user.userRoles.map((ur: IUserRole) => ur.role.name);
    return ['admin', 'staff'].some(role => userRoles.includes(role));
  }, [user]);
  
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      let appointmentsData: Appointment[];
      let vehiclesData: VehicleType[];
      
      if (isAdminOrStaff) {
        // Admin và staff có thể xem tất cả appointments và vehicles
        appointmentsData = await getAllAppointments();
        const vehiclesResponse = await getAllVehicles();
        vehiclesData = (vehiclesResponse?.data as VehicleType[]) || [];
      } else {
        // User chỉ có thể xem appointments và vehicles của chính họ
        if (user?.id) {
          appointmentsData = await getAppointmentsByUserId(user.id);
          vehiclesData = await getVehiclesByUserId(user.id);
        } else {
          appointmentsData = [];
          vehiclesData = [];
        }
      }

      const [serviceCentersData, usersData] = await Promise.all([
        getAllServiceCenters(),
        getUsers(),
      ]);
      
      setAppointments(appointmentsData || []);
      setServiceCenters(serviceCentersData || []);
      setVehicles(vehiclesData || []);
      setUsers(usersData?.data || []);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdminOrStaff]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    loadAll();
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Đặt lịch bảo dưỡng" />
      <div className="space-y-6">
        <ComponentCard title="">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <BookingDataTable
              onRefresh={onRefresh}
              appointments={appointments}
              users={users}
              vehicles={vehicles}
              serviceCenters={serviceCenters}
            />
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
