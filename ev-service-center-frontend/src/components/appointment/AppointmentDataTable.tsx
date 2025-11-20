"use client";
import React, { useState, useEffect } from "react";
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { BadgeColor, Header } from "@/types/common";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import Select from "../form/Select";
import { AppointmentStatus, AppointmentStatusOptions, TimeSlotOptions, getStatusColor, getStatusLabel } from "@/constants/appointment.constant";
import { ChevronDownIcon } from "@/icons";
import { CreateAppointmentDto, deleteAppointment, updateAppointment, Appointment, createAppointment, getAllServiceCenters, ServiceCenter, getAppointmentsByUserId, getAppointmentById } from "@/services/appointmentService";
import { getAllVehicles, getVehiclesByUserId, Vehicle } from "@/services/vehicleService";
import { getRolesObject } from "@/utils/user.utils";
import { IUserRole } from "@/types/common";
import { createWorkOrder, addChecklistItem, updateWorkOrder, getWorkOrderByAppointmentId, getChecklistItems, updateChecklistItem, CreateWorkOrderRequest, CreateChecklistItemRequest, WorkOrder, ChecklistItem, WorkOrderStatus } from "@/services/workorderService";
import { createInvoiceWithPayment, CreateInvoiceRequest, RecordPaymentRequest, getInvoiceByAppointmentId, Invoice } from "@/services/financeService";
import toast from "react-hot-toast";
import SearchableDataTable from "../common/SearchableDataTable";
import { PaginationInfo } from "../common/Pagination";

interface AppointmentDataTableProps {
  onRefresh: () => void;
  items: Appointment[];
  headers: Header[];
  searchTerm?: string;
  onSearch?: (query: string) => void;
  isSearching?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
}

export default function AppointmentDataTable({
  headers,
  items,
  onRefresh,
  searchTerm = "",
  onSearch,
  isSearching = false,
  pagination,
  onPageChange,
  onItemsPerPageChange
}: AppointmentDataTableProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userRoles, setUserRoles] = useState<IUserRole[]>([]);
  const [filteredItems, setFilteredItems] = useState<Appointment[]>(items);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [selectedAppointmentForWorkOrder, setSelectedAppointmentForWorkOrder] = useState<Appointment | null>(null);
  const [workOrderFormData, setWorkOrderFormData] = useState<CreateWorkOrderRequest>({
    title: "",
    description: "",
    status: "pending",
    appointmentId: 0,
    dueDate: "",
    totalPrice: 0,
    createdById: 1,
  });
  const [checklistItems, setChecklistItems] = useState<Omit<CreateChecklistItemRequest, 'workOrderId'>[]>([
    { price: 0, task: "" }
  ]);
  const [appointmentWorkOrders, setAppointmentWorkOrders] = useState<Map<number, WorkOrder>>(new Map());
  const [isWorkOrderDetailModalOpen, setIsWorkOrderDetailModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [workOrderChecklistItems, setWorkOrderChecklistItems] = useState<ChecklistItem[]>([]);
  const [isEditingWorkOrder, setIsEditingWorkOrder] = useState(false);
  const [isLoadingWorkOrderDetail, setIsLoadingWorkOrderDetail] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isInvoiceDetailModalOpen, setIsInvoiceDetailModalOpen] = useState(false);
  const [selectedAppointmentForInvoice, setSelectedAppointmentForInvoice] = useState<Appointment | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [appointmentInvoices, setAppointmentInvoices] = useState<Map<number, Invoice | null>>(new Map());
  const [invoiceFormData, setInvoiceFormData] = useState<CreateInvoiceRequest>({
    customerId: 0,
    amount: 0,
    dueDate: "",
    description: "",
    appointmentId: 0,
    
  });
  const [paymentFormData, setPaymentFormData] = useState<Omit<RecordPaymentRequest, 'invoiceId'>>({
    amount: 0,
    paymentMethod: 'cash',
    reference: "",
  });
  const [formData, setFormData] = useState<CreateAppointmentDto>({
    createdById: 1, // Default admin id
    serviceCenterId: 1,
    vehicleId: undefined,
    date: "",
    timeSlot: "08:00",
    status: AppointmentStatus.Pending,
    notes: "",
  });
  const { isOpen, openModal, closeModal } = useModal();

  // Load user info
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      console.log('Stored user data:', parsed);
      console.log('User roles from storage:', parsed.userRoles);
      setCurrentUserId(parsed.id);
      setUserRoles(parsed.userRoles || []);
      setFormData(prev => ({ ...prev, createdById: parsed.id }));
    }
  }, []);

  // Filter appointments based on user role
  useEffect(() => {
    const filterAppointments = async () => {
      if (!currentUserId || !userRoles.length) return;

      const roles = getRolesObject(userRoles);

      if (roles.user && !roles.admin && !roles.staff) {
        // Regular user can only see their own appointments
        try {
          const userAppointments = await getAppointmentsByUserId(currentUserId);
          setFilteredItems(userAppointments);
        } catch (error) {
          console.error("Error:", error);
          toast.error("Không thể tải lịch hẹn của bạn");
          setFilteredItems([]);
        }
      } else {
        // Admin/Staff can see all appointments
        setFilteredItems(items);
      }
    };

    filterAppointments();
  }, [currentUserId, userRoles, items]);

  // Load vehicles based on user role
  useEffect(() => {
    const loadVehicles = async () => {
      if (!currentUserId && userRoles.length === 0) return;

      setIsLoadingVehicles(true);
      try {
        const roles = getRolesObject(userRoles);
        let vehicleData: Vehicle[];

        if (roles && (roles.admin || roles.staff)) {
          // Admin/Staff can see all vehicles
          vehicleData = (await getAllVehicles()).data as Vehicle[];
        } else if (currentUserId) {
          // Regular user can only see their own vehicles
          vehicleData = await getVehiclesByUserId(currentUserId);
        } else {
          vehicleData = [];
        }

        setVehicles(vehicleData);
      } catch (error) {
        console.error("Error loading vehicles:", error);
        toast.error("Không thể tải danh sách phương tiện");
        setVehicles([]);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    loadVehicles();
  }, [currentUserId, userRoles]);

  // Load service centers
  useEffect(() => {
    const loadServiceCenters = async () => {
      try {
        const data = await getAllServiceCenters();
        setServiceCenters(data);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Không thể tải danh sách trung tâm dịch vụ");
      }
    };
    loadServiceCenters();
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAppointment(null);
      setFormData({
        createdById: currentUserId || 1,
        serviceCenterId: serviceCenters[0]?.id || 1,
        vehicleId: undefined,
        date: "",
        timeSlot: "08:00",
        status: AppointmentStatus.Pending,
        notes: "",
      });
    }
  }, [isOpen, currentUserId, serviceCenters]);

  // Update form data when selected appointment changes
  useEffect(() => {
    if (selectedAppointment) {
      setFormData({
        createdById: selectedAppointment.createdById,
        serviceCenterId: selectedAppointment.serviceCenterId,
        vehicleId: selectedAppointment.vehicleId,
        date: selectedAppointment.date.split('T')[0], // Extract date part
        timeSlot: selectedAppointment.timeSlot,
        status: selectedAppointment.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
        notes: selectedAppointment.notes || "",
      });
    }
  }, [selectedAppointment]);

  // Check invoices and work orders for appointments
  useEffect(() => {
    const checkInvoicesAndWorkOrders = async () => {
      const confirmedAppointments = filteredItems.filter(item => item.status === AppointmentStatus.Confirmed);
      const completedAppointments = filteredItems.filter(item => item.status === AppointmentStatus.Completed);
      
      // Check work orders for confirmed appointments
      for (const appointment of confirmedAppointments) {
        try {
          const workOrder = await getWorkOrderByAppointmentId(appointment.id);
          if (workOrder) {
            setAppointmentWorkOrders(prev => new Map(prev.set(appointment.id, workOrder)));
          }
        } catch (error) {
          console.error("Error checking work order:", error);
        }
      }
      
      // Check invoices for completed appointments
      for (const appointment of completedAppointments) {
        await checkInvoiceExists(appointment.id);
      }
    };
    
    if (filteredItems.length > 0) {
      checkInvoicesAndWorkOrders();
    }
  }, [filteredItems]);

  const handleStatusChange = (value: string) => {
    setFormData({ ...formData, status: value as 'pending' | 'confirmed' | 'cancelled' | 'completed' });
  };

  const handleTimeSlotChange = (value: string) => {
    setFormData({ ...formData, timeSlot: value });
  };

  const handleServiceCenterChange = (value: string) => {
    setFormData({ ...formData, serviceCenterId: parseInt(value) });
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    openModal();
  };

  const handleViewDetail = async (appointment: Appointment) => {
    try {
      const detailData = await getAppointmentById(appointment.id);
      setDetailAppointment(detailData);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Không thể tải thông tin chi tiết");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (selectedAppointment?.id) {
        await updateAppointment(selectedAppointment.id, formData);
        toast.success("Cập nhật lịch hẹn thành công");
      } else {
        await createAppointment(formData);
        toast.success("Thêm lịch hẹn thành công");
      }
      closeModal();
      onRefresh();
    } catch {
      toast.error(selectedAppointment?.id ? "Không thể cập nhật lịch hẹn" : "Không thể thêm lịch hẹn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isSubmitting) return;

    const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa lịch hẹn này?");
    if (!isConfirmed) return;

    try {
      setIsSubmitting(true);
      await deleteAppointment(id);
      toast.success("Xóa lịch hẹn thành công");
      onRefresh();
    } catch {
      toast.error("Không thể xóa lịch hẹn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWorkOrder = (appointment: Appointment) => {
    setSelectedAppointmentForWorkOrder(appointment);
    setWorkOrderFormData({
      title: `Phiếu dịch vụ - ${appointment.user?.username || 'Khách hàng'}`,
      description: appointment.notes || "",
      status: "pending",
      appointmentId: appointment.id,
      dueDate: "",
      totalPrice: 0,
      createdById: currentUserId || 1,
    });
    setChecklistItems([{ price: 0, task: "" }]);
    setIsWorkOrderModalOpen(true);
  };

  const handleWorkOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!workOrderFormData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề phiếu dịch vụ");
      return;
    }

    const validChecklistItems = checklistItems.filter(item => item.task.trim());
    if (validChecklistItems.length === 0) {
      toast.error("Vui lòng nhập ít nhất một công việc");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create work order
      const workOrder = await createWorkOrder(workOrderFormData);

      // Create checklist items
      for (const item of validChecklistItems) {
        await addChecklistItem(workOrder.id, item);
      }

      toast.success("Tạo phiếu dịch vụ thành công");
      setIsWorkOrderModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error creating work order:", error);
      toast.error("Không thể tạo phiếu dịch vụ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addChecklistItemRow = () => {
    setChecklistItems([...checklistItems, { price: 0, task: "" }]);
  };

  const removeChecklistItemRow = (index: number) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter((_, i) => i !== index));
    }
  };

  const updateChecklistItemLocal = (index: number, field: 'price' | 'task', value: string | number) => {
    const updatedItems = [...checklistItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setChecklistItems(updatedItems);

    const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price || 0), 0);
    setWorkOrderFormData(prev => ({ ...prev, totalPrice }));
  };

  const calculateTotalPrice = () => {
    return checklistItems.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const handleViewWorkOrderDetail = async (appointment: Appointment) => {
    try {
      setIsLoadingWorkOrderDetail(true);
      
      // Luôn fetch dữ liệu mới nhất từ server thay vì sử dụng cache
      const freshWorkOrder = await getWorkOrderByAppointmentId(appointment.id);
      if (!freshWorkOrder) {
        toast.error("Không tìm thấy phiếu dịch vụ");
        return;
      }

      setSelectedWorkOrder(freshWorkOrder);
      
      // Fetch checklist items mới nhất
      const checklistItems = await getChecklistItems(freshWorkOrder.id);
      setWorkOrderChecklistItems(checklistItems);

      // Set form data for editing với dữ liệu mới nhất
      setWorkOrderFormData({
        title: freshWorkOrder.title,
        description: freshWorkOrder.description || "",
        status: freshWorkOrder.status as WorkOrderStatus,
        appointmentId: freshWorkOrder.appointmentId,
        dueDate: freshWorkOrder.dueDate ? freshWorkOrder.dueDate.split('T')[0] : "",
        totalPrice: freshWorkOrder.totalPrice,
        createdById: freshWorkOrder.createdById,
      });

      setIsWorkOrderDetailModalOpen(true);
    } catch (error) {
      console.error("Error loading work order detail:", error);
      toast.error("Không thể tải chi tiết phiếu dịch vụ");
    } finally {
      setIsLoadingWorkOrderDetail(false);
    }
  };

  const handleEditWorkOrder = () => {
    setIsEditingWorkOrder(true);
  };

  const handleSaveWorkOrder = async () => {
    if (!selectedWorkOrder) return;

    try {
      setIsSubmitting(true);
      await updateWorkOrder(selectedWorkOrder.id, {
        title: workOrderFormData.title,
        description: workOrderFormData.description,
        status: workOrderFormData.status,
        dueDate: workOrderFormData.dueDate,
        totalPrice: workOrderFormData.totalPrice,
      });

      // Update checklist items
      for (const item of workOrderChecklistItems) {
        await updateChecklistItem(selectedWorkOrder.id, item.id, {
          task: item.task,
          price: item.price,
          completed: item.completed,
        });
      }

      toast.success("Cập nhật phiếu dịch vụ thành công");
      setIsEditingWorkOrder(false);

      // Reload work orders
      const updatedWorkOrder = await getWorkOrderByAppointmentId(selectedWorkOrder.appointmentId);
      if (updatedWorkOrder) {
        setAppointmentWorkOrders(prev => new Map(prev.set(selectedWorkOrder.appointmentId, updatedWorkOrder)));
        setSelectedWorkOrder(updatedWorkOrder);
      }

      onRefresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Không thể cập nhật phiếu dịch vụ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEditWorkOrder = () => {
    setIsEditingWorkOrder(false);
    // Reset form data
    if (selectedWorkOrder) {
      setWorkOrderFormData({
        title: selectedWorkOrder.title,
        description: selectedWorkOrder.description || "",
        status: selectedWorkOrder.status as WorkOrderStatus,
        appointmentId: selectedWorkOrder.appointmentId,
        dueDate: selectedWorkOrder.dueDate ? selectedWorkOrder.dueDate.split('T')[0] : "",
        totalPrice: selectedWorkOrder.totalPrice,
        createdById: selectedWorkOrder.createdById,
      });
    }
  };

  const handleCreateInvoice = async (appointment: Appointment) => {
    setSelectedAppointmentForInvoice(appointment);
    
    // Lấy workOrder để tính tổng giá trị
    let totalAmount = 0;
    try {
      const workOrder = await getWorkOrderByAppointmentId(appointment.id);
      if (workOrder) {
        totalAmount = workOrder.totalPrice;
      }
    } catch (error) {
      console.error("Error loading work order:", error);
      toast.error("Không thể tải thông tin phiếu dịch vụ");
    }
    
    setInvoiceFormData({
      customerId: appointment.userId,
      amount: totalAmount,
      dueDate: new Date().toISOString().split('T')[0],
      description: `Hóa đơn dịch vụ cho lịch hẹn #${appointment.id}`,
      appointmentId: appointment.id,
    });
    setPaymentFormData({
      amount: totalAmount,
      paymentMethod: 'cash',
      reference: "",
    });
    setIsInvoiceModalOpen(true);
  };

  const checkInvoiceExists = async (appointmentId: number) => {
    try {
      const invoice = await getInvoiceByAppointmentId(appointmentId);
      setAppointmentInvoices(prev => new Map(prev.set(appointmentId, invoice)));
      return invoice;
    } catch (error) {
      console.error("Error checking invoice:", error);
      setAppointmentInvoices(prev => new Map(prev.set(appointmentId, null)));
      return null;
    }
  };

  const handleShowInvoiceDetail = async (appointment: Appointment) => {
    try {
      const invoice = await getInvoiceByAppointmentId(appointment.id);
      if (invoice) {
        setCurrentInvoice(invoice);
        setIsInvoiceDetailModalOpen(true);
      } else {
        toast.error("Không tìm thấy hóa đơn");
      }
    } catch (error) {
      console.error("Error loading invoice detail:", error);
      toast.error("Không thể tải thông tin hóa đơn");
    }
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!invoiceFormData.customerId) {
      toast.error("Không tìm thấy thông tin khách hàng");
      return;
    }
    if (invoiceFormData.amount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    if (paymentFormData.amount <= 0) {
      toast.error("Vui lòng nhập số tiền thanh toán hợp lệ");
      return;
    }
    if (paymentFormData.amount !== invoiceFormData.amount) {
      toast.error("Số tiền thanh toán phải bằng số tiền hóa đơn");
      return;
    }

    try {
      setIsSubmitting(true);
      await createInvoiceWithPayment(invoiceFormData, paymentFormData);
      toast.success("Tạo hóa đơn và thanh toán thành công");
      setIsInvoiceModalOpen(false);
      
      // Update invoice state
      if (selectedAppointmentForInvoice) {
        await checkInvoiceExists(selectedAppointmentForInvoice.id);
      }
      
      onRefresh();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Không thể tạo hóa đơn");
    } finally {
      setIsSubmitting(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string, timeSlot: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('vi-VN')} - ${timeSlot}`;
  };

  const serviceCenterOptions = serviceCenters.map(sc => ({
    value: sc.id.toString(),
    label: sc.name
  }));

  const roles = getRolesObject(userRoles);
  const isUserRole = userRoles.some(ur => ur.role.name === 'user') && 
                    !userRoles.some(ur => ur.role.name === 'admin') && 
                    !userRoles.some(ur => ur.role.name === 'staff');
  const canCreate = (roles.admin || roles.staff) && !isUserRole;

  // Render row function
  const renderRow = (item: Appointment) => {
    const roles = getRolesObject(userRoles);
    const canEdit = roles.admin || roles.staff;
    const canDelete = roles.admin || roles.staff;

    // Additional safety check - ensure user role is not admin/staff
    const isUserRole = userRoles.some(ur => ur.role.name === 'user') && 
                      !userRoles.some(ur => ur.role.name === 'admin') && 
                      !userRoles.some(ur => ur.role.name === 'staff');
    
    const finalCanEdit = canEdit && !isUserRole;
    const finalCanDelete = canDelete && !isUserRole;

    // Debug logs
    console.log('User roles:', userRoles);
    console.log('Roles object:', roles);
    console.log('Can edit:', canEdit);
    console.log('Can delete:', canDelete);
    console.log('Is user role:', isUserRole);
    console.log('Final can edit:', finalCanEdit);
    console.log('Final can delete:', finalCanDelete);

    return (
      <TableRow key={item.id}>
        <TableCell className="px-5 py-4 sm:px-6 text-start">
          <div className="flex items-center gap-3">
            <div>
              <span className="block text-gray-500 text-theme-sm dark:text-gray-400">
                {item.user?.username || "Không có"}
              </span>
              <span className="block text-gray-500 text-theme-sm dark:text-gray-400">
                ({item.user?.email || "Không có email"})
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {item.serviceCenter?.name || `Service Center #${item.serviceCenterId}`}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {item.vehicleId ? (
            (() => {
              const vehicle = vehicles.find(v => Number(v.id) === Number(item.vehicleId));
              return vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""} (${vehicle.licensePlate || ""})` : `Vehicle #${item.vehicleId}`;
            })()
          ) : "Không có"}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {formatDateTime(item.date, item.timeSlot)}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge
            size="sm"
            color={getStatusColor(item.status as AppointmentStatus) as BadgeColor}
          >
            {getStatusLabel(item.status as AppointmentStatus)}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {item.notes || "Không có ghi chú"}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <div className="flex items-start justify-start gap-2 flex-wrap">
            {/* View Detail Button */}
            <button
              onClick={() => handleViewDetail(item)}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Xem chi tiết
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>

            {/* Edit Button */}
            {finalCanEdit && (
              <button
                onClick={() => handleEdit(item)}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Cập nhật
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            )}

            {/* Work Order Buttons */}
            {item.status === AppointmentStatus.Confirmed && (
              <>
                {appointmentWorkOrders.has(item.id) ? (
                  <button
                    onClick={() => handleViewWorkOrderDetail(item)}
                    disabled={isLoadingWorkOrderDetail}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-purple-600 hover:to-purple-700 hover:shadow-xl hover:shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                  >
                    {isLoadingWorkOrderDetail ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Đang tải...</span>
                      </div>
                    ) : (
                      <>
                        <span className="relative z-10 flex items-center gap-2">
                          <svg className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Chi tiết phiếu dịch vụ
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </>
                    )}
                  </button>
                ) : finalCanEdit ? (
                  <button
                    onClick={() => handleCreateWorkOrder(item)}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Tạo phiếu dịch vụ
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                ) : null}
              </>
            )}

            {/* Invoice Buttons */}
            {item.status === AppointmentStatus.Completed && (
              <>
                {appointmentInvoices.get(item.id) ? (
                  <button
                    onClick={() => handleShowInvoiceDetail(item)}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Chi tiết hóa đơn
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                ) : finalCanEdit ? (
                  <button
                    onClick={() => handleCreateInvoice(item)}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:shadow-xl hover:shadow-green-500/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Tạo hóa đơn
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                ) : null}
              </>
            )}

            {/* Delete Button */}
            {finalCanDelete && (
              <button
                onClick={() => handleDelete(item.id)}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Action button
  const actionButton = canCreate ? (
    <button
      onClick={openModal}
      type="button"
      className="btn btn-success btn-update-event flex justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
    >
      + Thêm lịch hẹn
    </button>
  ) : undefined;

  return (
    <>
      <SearchableDataTable
        headers={headers}
        items={filteredItems as never}
        renderRow={renderRow as never}
        searchTerm={searchTerm}
        onSearch={onSearch}
        searchPlaceholder="Tìm kiếm theo khách hàng, trung tâm, ghi chú..."
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
              {selectedAppointment ? "Chỉnh sửa lịch hẹn" : "Thêm lịch hẹn"}
            </h5>
            {selectedAppointment && (
              <div className="mt-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                      Lưu ý khi chỉnh sửa lịch hẹn
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      Phương tiện không thể thay đổi khi chỉnh sửa để tránh nhầm lẫn và đảm bảo tính chính xác của dịch vụ. Các thông tin khác vẫn có thể chỉnh sửa bình thường.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-8">
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Trung tâm dịch vụ
              </label>
              <div className="relative">
                <Select
                  value={formData.serviceCenterId.toString()}
                  options={serviceCenterOptions}
                  placeholder="Chọn trung tâm dịch vụ"
                  onChange={handleServiceCenterChange}
                  className="dark:bg-dark-900"
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Phương tiện (tùy chọn)
                {selectedAppointment && (
                  <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                    (Không thể thay đổi khi chỉnh sửa)
                  </span>
                )}
                {isLoadingVehicles && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    Đang tải...
                  </span>
                )}
              </label>
              <div className="relative">
                <Select
                  value={formData.vehicleId?.toString() || "-"}
                  onChange={(value) => setFormData({ ...formData, vehicleId: value === "-" ? undefined : parseInt(value) })}
                  options={[
                    {
                      value: "-",
                      label: isLoadingVehicles ? "Đang tải phương tiện..." : "Chọn phương tiện",
                    },
                    ...vehicles.map((vehicle) => ({
                      value: vehicle.id.toString(),
                      label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
                    })),
                  ]}
                  className="dark:bg-dark-900"
                  disabled={isLoadingVehicles || !!selectedAppointment}
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <ChevronDownIcon />
                </span>
              </div>
              {selectedAppointment && (
                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-sm text-orange-800 dark:text-orange-200">
                    <span className="font-medium">Lý do:</span> Phương tiện không thể thay đổi để tránh nhầm lẫn và đảm bảo tính chính xác của dịch vụ
                  </div>
                </div>
              )}
              {formData.vehicleId && !isLoadingVehicles && !selectedAppointment && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-medium">Phương tiện đã chọn:</span> {vehicles.find(v => Number(v.id) === Number(formData.vehicleId))?.brand} {vehicles.find(v => Number(v.id) === Number(formData.vehicleId))?.model}
                  </div>
                </div>
              )}
              {vehicles.length === 0 && !isLoadingVehicles && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    Không có phương tiện nào được tìm thấy
                  </div>
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Ngày hẹn
              </label>
              <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                required
              />
            </div>
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Khung giờ
              </label>
              <div className="relative">
                <Select
                  value={formData.timeSlot}
                  options={TimeSlotOptions}
                  placeholder="Chọn khung giờ"
                  onChange={handleTimeSlotChange}
                  className="dark:bg-dark-900"
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>
            {/* Only display the status selection section for admin/staff, hide it for users */}
            {(roles.admin || roles.staff) && (
              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Trạng thái
                </label>
                <div className="relative">
                  <Select
                    value={formData.status}
                    options={AppointmentStatusOptions}
                    placeholder="Chọn trạng thái"
                    onChange={handleStatusChange}
                    className="dark:bg-dark-900"
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>
            )}
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Ghi chú
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                rows={3}
                placeholder="Nhập ghi chú..."
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
              {isSubmitting ? "Đang xử lý..." : selectedAppointment ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        className="max-w-[600px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Chi tiết lịch hẹn
            </h5>
          </div>
          <div className="mt-8">
            {detailAppointment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Số hiệu lịch hẹn
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-900 dark:text-white">#{detailAppointment.id}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Khách hàng
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-900 dark:text-white">{detailAppointment.user?.username || "Không có"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Trung tâm dịch vụ
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-900 dark:text-white">
                      {detailAppointment.serviceCenter?.name || `Service Center #${detailAppointment.serviceCenterId}`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Phương tiện
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-900 dark:text-white">
                      {detailAppointment.vehicleId ? (
                        (() => {
                          const vehicle = vehicles.find(v => Number(v.id) === Number(detailAppointment.vehicleId));
                          return vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""} (${vehicle.licensePlate || ""})` : `Vehicle #${detailAppointment.vehicleId}`;
                        })()
                      ) : "Không có"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Ngày hẹn
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(detailAppointment.date)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Khung giờ
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-900 dark:text-white">
                        {detailAppointment.timeSlot}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Trạng thái
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Badge
                      size="sm"
                      color={getStatusColor(detailAppointment.status as AppointmentStatus) as BadgeColor}
                    >
                      {getStatusLabel(detailAppointment.status as AppointmentStatus)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Ghi chú
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[60px]">
                    <span className="text-gray-900 dark:text-white">
                      {detailAppointment.notes || "Không có ghi chú"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Ngày tạo
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-900 dark:text-white text-sm">
                        {new Date(detailAppointment.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Cập nhật lần cuối
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-900 dark:text-white text-sm">
                        {new Date(detailAppointment.updatedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* Work Order Modal */}
      <Modal
        isOpen={isWorkOrderModalOpen}
        onClose={() => setIsWorkOrderModalOpen(false)}
        className="max-w-[800px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Tạo phiếu dịch vụ
            </h5>
          </div>
          <form onSubmit={handleWorkOrderSubmit} className="mt-8">
            {/* Info appointment */}
            {selectedAppointmentForWorkOrder && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h6 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Thông tin lịch hẹn
                </h6>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Khách hàng:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100">
                      {selectedAppointmentForWorkOrder.user?.username || "Không có"}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Trung tâm:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100">
                      {selectedAppointmentForWorkOrder.serviceCenter?.name || `Service Center #${selectedAppointmentForWorkOrder.serviceCenterId}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Ngày hẹn:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100">
                      {formatDateTime(selectedAppointmentForWorkOrder.date, selectedAppointmentForWorkOrder.timeSlot)}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Phương tiện:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100">
                      {selectedAppointmentForWorkOrder.vehicleId ? (
                        (() => {
                          const vehicle = vehicles.find(v => Number(v.id) === Number(selectedAppointmentForWorkOrder.vehicleId));
                          return vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""} (${vehicle.licensePlate || ""})` : `Vehicle #${selectedAppointmentForWorkOrder.vehicleId}`;
                        })()
                      ) : "Không có"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tiêu đề phiếu dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={workOrderFormData.title}
                  onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, title: e.target.value })}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Nhập tiêu đề phiếu dịch vụ..."
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Mô tả
                </label>
                <textarea
                  value={workOrderFormData.description}
                  onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, description: e.target.value })}
                  className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  rows={3}
                  placeholder="Nhập mô tả phiếu dịch vụ..."
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Trạng thái
                  </label>
                  <div className="relative">
                    <Select
                      value={workOrderFormData.status || "pending"}
                      onChange={(value) => setWorkOrderFormData({ ...workOrderFormData, status: value as WorkOrderStatus })}
                      options={[
                        { value: "pending", label: "Chờ xử lý" },
                        { value: "in_progress", label: "Đang thực hiện" },
                        { value: "completed", label: "Hoàn thành" },
                        { value: "cancelled", label: "Đã hủy" },
                      ]}
                      className="dark:bg-dark-900"
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                      <ChevronDownIcon />
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Ngày hẹn hoàn thành
                  </label>
                  <input
                    type="date"
                    value={workOrderFormData.dueDate}
                    onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, dueDate: e.target.value })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tổng giá trị dự kiến (VND)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={workOrderFormData.totalPrice}
                    onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, totalPrice: parseFloat(e.target.value) || 0 })}
                    className="dark:bg-dark-900 h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="Nhập tổng giá trị dự kiến..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const calculatedTotal = calculateTotalPrice();
                      setWorkOrderFormData(prev => ({ ...prev, totalPrice: calculatedTotal }));
                    }}
                    className="h-11 px-4 py-2.5 text-sm font-medium text-brand-600 hover:text-brand-700 border border-brand-300 hover:border-brand-400 rounded-lg transition-colors"
                  >
                    Tính từ danh sách
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Tổng từ danh sách công việc: <span className="font-medium text-brand-600 dark:text-brand-400">{calculateTotalPrice().toLocaleString('vi-VN')} VND</span>
                </div>
              </div>

              {/* Checklist items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Danh sách công việc <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addChecklistItemRow}
                    className="text-sm text-brand-500 hover:text-brand-600 font-medium"
                  >
                    + Thêm công việc
                  </button>
                </div>

                <div className="space-y-3">
                  {checklistItems.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Công việc
                        </label>
                        <input
                          type="text"
                          value={item.task}
                          onChange={(e) => updateChecklistItemLocal(index, 'task', e.target.value)}
                          className="dark:bg-dark-900 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          placeholder="Nhập công việc..."
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Giá (VND)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateChecklistItemLocal(index, 'price', parseFloat(e.target.value) || 0)}
                          className="dark:bg-dark-900 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          placeholder="0"
                        />
                      </div>
                      {checklistItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChecklistItemRow(index)}
                          className="h-10 w-10 flex items-center justify-center rounded-lg border border-red-300 text-red-500 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                type="button"
                onClick={() => setIsWorkOrderModalOpen(false)}
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-success btn-create-workorder flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {isSubmitting ? "Đang tạo..." : "Tạo phiếu dịch vụ"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Work Order Detail Modal */}
      <Modal
        isOpen={isWorkOrderDetailModalOpen}
        onClose={() => {
          setIsWorkOrderDetailModalOpen(false);
          setIsEditingWorkOrder(false);
          setSelectedWorkOrder(null);
          setWorkOrderChecklistItems([]);
        }}
        className="max-w-[900px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Chi tiết phiếu dịch vụ
            </h5>
          </div>

          {selectedWorkOrder && (
            <div className="mt-8">
              {isEditingWorkOrder ? (
                // Edit Mode
                <form onSubmit={(e) => { e.preventDefault(); handleSaveWorkOrder(); }} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Tiêu đề phiếu dịch vụ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={workOrderFormData.title}
                      onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, title: e.target.value })}
                      className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Mô tả
                    </label>
                    <textarea
                      value={workOrderFormData.description}
                      onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, description: e.target.value })}
                      className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                        Trạng thái
                      </label>
                      <div className="relative">
                        <Select
                          value={workOrderFormData.status || "pending"}
                          onChange={(value) => setWorkOrderFormData({ ...workOrderFormData, status: value as WorkOrderStatus })}
                          options={[
                            { value: "pending", label: "Chờ xử lý" },
                            { value: "in_progress", label: "Đang thực hiện" },
                            { value: "completed", label: "Hoàn thành" },
                            { value: "cancelled", label: "Đã hủy" },
                          ]}
                          className="dark:bg-dark-900"
                        />
                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                          <ChevronDownIcon />
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                        Ngày hẹn hoàn thành
                      </label>
                      <input
                        type="date"
                        value={workOrderFormData.dueDate}
                        onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, dueDate: e.target.value })}
                        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Tổng giá trị (VND)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={workOrderFormData.totalPrice}
                      onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, totalPrice: parseFloat(e.target.value) || 0 })}
                      className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  {/* Checklist Items Edit */}
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Danh sách công việc
                    </label>
                    <div className="space-y-3">
                      {workOrderChecklistItems.map((item, index) => (
                        <div key={item.id} className="flex gap-3 items-end">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Công việc
                            </label>
                            <input
                              type="text"
                              value={item.task}
                              onChange={(e) => {
                                const updatedItems = [...workOrderChecklistItems];
                                updatedItems[index] = { ...updatedItems[index], task: e.target.value };
                                setWorkOrderChecklistItems(updatedItems);
                              }}
                              className="dark:bg-dark-900 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Giá (VND)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => {
                                const updatedItems = [...workOrderChecklistItems];
                                updatedItems[index] = { ...updatedItems[index], price: parseFloat(e.target.value) || 0 };
                                setWorkOrderChecklistItems(updatedItems);
                              }}
                              className="dark:bg-dark-900 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            />
                          </div>
                          <div className="flex items-center justify-center cursor-pointer">
                            <label className="flex items-center space-x-2 cursor-pointer mb-[3px]">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={(e) => {
                                  const updatedItems = [...workOrderChecklistItems];
                                  updatedItems[index] = { ...updatedItems[index], completed: e.target.checked };
                                  setWorkOrderChecklistItems(updatedItems);
                                }}
                                className="w-8 h-8 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Hoàn thành
                              </span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCancelEditWorkOrder}
                      className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-success flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                    >
                      {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              ) : (
                // View Mode
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                        Tiêu đề
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-900 dark:text-white">{selectedWorkOrder.title}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                        Trạng thái
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Badge
                          size="sm"
                          color={selectedWorkOrder.status === 'completed' ? 'success' : selectedWorkOrder.status === 'cancelled' ? 'error' : selectedWorkOrder.status === 'in_progress' ? 'warning' : 'light'}
                        >
                          {selectedWorkOrder.status === 'pending' ? 'Chờ xử lý' :
                            selectedWorkOrder.status === 'in_progress' ? 'Đang thực hiện' :
                              selectedWorkOrder.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      Mô tả
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[60px]">
                      <span className="text-gray-900 dark:text-white">
                        {selectedWorkOrder.description || "Không có mô tả"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                        Ngày hẹn hoàn thành
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-900 dark:text-white">
                          {selectedWorkOrder.dueDate ? formatDate(selectedWorkOrder.dueDate) : "Chưa xác định"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Checklist Items */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-3">
                      Danh sách công việc
                    </label>
                    <div className="space-y-3">
                      {workOrderChecklistItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <span className="text-gray-900 dark:text-white">{item.task}</span>
                          </div>
                          <div className="w-24 text-right">
                            <span className="text-gray-900 dark:text-white font-medium">
                              {item.price.toLocaleString('vi-VN')} VND
                            </span>
                          </div>
                          <div className="w-40 text-center">
                            <Badge
                              size="sm"
                              color={item.completed ? 'success' : 'warning'}
                            >
                              {item.completed ? 'Hoàn thành' : 'Chưa hoàn thành'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                        Tổng giá trị
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-medium text-red-500 dark:text-red-400">
                          {selectedWorkOrder.totalPrice.toLocaleString('vi-VN')} VND
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                        Ngày tạo
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-900 dark:text-white text-sm">
                          {new Date(selectedWorkOrder.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                        Cập nhật lần cuối
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-900 dark:text-white text-sm">
                          {new Date(selectedWorkOrder.updatedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
                    {!isEditingWorkOrder && (roles.admin || roles.staff) && (
                      <button
                        onClick={handleEditWorkOrder}
                        className="px-5 py-2.5 text-sm font-medium text-brand-600 hover:text-brand-700 border border-brand-300 hover:border-brand-400 rounded-lg transition-colors"
                      >
                        Chỉnh sửa
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsWorkOrderDetailModalOpen(false);
                        setIsEditingWorkOrder(false);
                        setSelectedWorkOrder(null);
                        setWorkOrderChecklistItems([]);
                      }}
                      type="button"
                      className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Tạo hóa đơn
            </h5>
          </div>
          <form onSubmit={handleInvoiceSubmit} className="mt-8">
            {/* Info appointment */}
            {selectedAppointmentForInvoice && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h6 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Thông tin lịch hẹn
                </h6>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Khách hàng:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100">
                      {selectedAppointmentForInvoice.user?.username || "Không có"}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Trung tâm:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100">
                      {selectedAppointmentForInvoice.serviceCenter?.name || `Service Center #${selectedAppointmentForInvoice.serviceCenterId}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Ngày hẹn:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100">
                      {formatDateTime(selectedAppointmentForInvoice.date, selectedAppointmentForInvoice.timeSlot)}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Phương tiện:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100">
                      {selectedAppointmentForInvoice.vehicleId ? (
                        (() => {
                          const vehicle = vehicles.find(v => Number(v.id) === Number(selectedAppointmentForInvoice.vehicleId));
                          return vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""} (${vehicle.licensePlate || ""})` : `Vehicle #${selectedAppointmentForInvoice.vehicleId}`;
                        })()
                      ) : "Không có"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Work Order Info */}
            {selectedAppointmentForInvoice && appointmentWorkOrders.has(selectedAppointmentForInvoice.id) && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h6 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  Thông tin phiếu dịch vụ
                </h6>
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 dark:text-green-300">Tổng giá trị từ phiếu dịch vụ:</span>
                    <span className="text-green-900 dark:text-green-100 font-medium">
                      {invoiceFormData.amount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Số tiền này được tự động tính từ phiếu dịch vụ của lịch hẹn
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedAppointmentForInvoice) return;
                        try {
                          const workOrder = await getWorkOrderByAppointmentId(selectedAppointmentForInvoice.id);
                          if (workOrder) {
                            setInvoiceFormData(prev => ({ ...prev, amount: workOrder.totalPrice }));
                            setPaymentFormData(prev => ({ ...prev, amount: workOrder.totalPrice }));
                            toast.success("Đã cập nhật số tiền từ phiếu dịch vụ");
                          }
                        } catch (error) {
                          console.error("Error refreshing work order:", error);
                          toast.error("Không thể cập nhật số tiền");
                        }
                      }}
                      className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline"
                    >
                      Làm mới
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Warning if no work order */}
            {selectedAppointmentForInvoice && !appointmentWorkOrders.has(selectedAppointmentForInvoice.id) && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h6 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Cảnh báo
                </h6>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  Lịch hẹn này chưa có phiếu dịch vụ. Vui lòng tạo phiếu dịch vụ trước khi tạo hóa đơn để có số tiền chính xác.
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Số tiền hóa đơn (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceFormData.amount}
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      setInvoiceFormData({ ...invoiceFormData, amount });
                      setPaymentFormData({ ...paymentFormData, amount });
                    }}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="Nhập số tiền..."
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Ngày đến hạn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={invoiceFormData.dueDate}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Mô tả hóa đơn
                </label>
                <textarea
                  value={invoiceFormData.description}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
                  className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  rows={3}
                  placeholder="Nhập mô tả hóa đơn..."
                />
              </div>

              {/* Payment Information */}
              <div className="border-t pt-4">
                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-3">
                  Thông tin thanh toán
                </h6>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Số tiền thanh toán (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentFormData.amount}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) || 0 })}
                      className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      placeholder="Nhập số tiền thanh toán..."
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Phương thức thanh toán <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Select
                        value={paymentFormData.paymentMethod}
                        onChange={(value) => setPaymentFormData({ ...paymentFormData, paymentMethod: value as 'cash' | 'bank_transfer' })}
                        options={[
                          { value: 'cash', label: 'Tiền mặt' },
                          { value: 'bank_transfer', label: 'Chuyển khoản' },
                        ]}
                        className="dark:bg-dark-900"
                      />
                      <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                        <ChevronDownIcon />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Mã tham chiếu giao dịch
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.reference}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="Nhập mã tham chiếu (tùy chọn)..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-success btn-create-invoice flex w-full justify-center rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-600 sm:w-auto"
              >
                {isSubmitting ? "Đang tạo..." : "Tạo hóa đơn"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={isInvoiceDetailModalOpen}
        onClose={() => setIsInvoiceDetailModalOpen(false)}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Chi tiết hóa đơn
            </h5>
          </div>
          
          {currentInvoice && (
            <div className="mt-8 space-y-6">
              {/* Invoice Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-3">
                  Thông tin hóa đơn
                </h6>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Mã hóa đơn:</span>
                    <span className="ml-2 font-medium">#{currentInvoice.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      currentInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      currentInvoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      currentInvoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {currentInvoice.status === 'paid' ? 'Đã thanh toán' :
                       currentInvoice.status === 'pending' ? 'Chờ thanh toán' :
                       currentInvoice.status === 'overdue' ? 'Quá hạn' :
                       'Đã hủy'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Số tiền:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {currentInvoice.amount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Ngày đến hạn:</span>
                    <span className="ml-2 font-medium">
                      {new Date(currentInvoice.dueDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Mô tả:</span>
                    <span className="ml-2">{currentInvoice.description}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
                  {currentInvoice.payments && currentInvoice.payments.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h6 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                        Thông tin thanh toán
                      </h6>
                      {currentInvoice.payments.map((payment, index: number) => (
                    <div key={index} className="grid grid-cols-2 gap-4 text-sm mb-2">
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">Phương thức:</span>
                        <span className="ml-2 font-medium">
                          {payment.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">Số tiền:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {payment.amount.toLocaleString('vi-VN')} VND
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">Trạng thái:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'success' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status === 'success' ? 'Thành công' :
                           payment.status === 'pending' ? 'Chờ xử lý' :
                           payment.status === 'failed' ? 'Thất bại' :
                           'Hoàn tiền'}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">Ngày thanh toán:</span>
                        <span className="ml-2 font-medium">
                          {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('vi-VN') : 'Chưa thanh toán'}
                        </span>
                      </div>
                      {payment.transactionId && (
                        <div className="col-span-2">
                          <span className="text-blue-600 dark:text-blue-400">Mã giao dịch:</span>
                          <span className="ml-2 font-mono text-xs">{payment.transactionId}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsInvoiceDetailModalOpen(false)}
              className="btn btn-secondary flex w-full justify-center rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-600 sm:w-auto"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
