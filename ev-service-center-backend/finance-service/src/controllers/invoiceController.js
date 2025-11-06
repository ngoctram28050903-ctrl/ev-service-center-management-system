import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";
import { publishToExchange } from '../utils/rabbitmq.js';
import { bookingClient, workorderClient, inventoryClient, authClient } from "../client/index.js";

export const getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Invoice.findAndCountAll({
      include: Payment,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + limit < count,
      hasPrev: page > 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvoiceByAppointmentId = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const invoice = await Invoice.findOne({
      where: { appointmentId },
      include: Payment
    });
    
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found for this appointment" });
    }
    
    res.status(200).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { customerId, amount, dueDate, description, appointmentId } = req.body;
    const invoice = await Invoice.create({ 
      customerId, 
      amount, 
      dueDate, 
      description,
      appointmentId,
      status: 'pending'
    });
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, reference } = req.body;

    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const payment = await Payment.create({ 
      invoiceId, 
      amount, 
      transactionId: reference,
      paymentMethod, 
      status: "success",
      paidAt: new Date()
    });
    
    invoice.status = "paid";
    await invoice.save();

    
   await publishToExchange('payment_events', {
    type: 'PAYMENT_SUCCESSFUL',
    payload: invoice
  });
    

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createInvoiceWithPayment = async (req, res) => {
  try {
    const { invoice, payment } = req.body;
    
    const newInvoice = await Invoice.create({
      customerId: invoice.customerId,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      description: invoice.description,
      appointmentId: invoice.appointmentId,
      status: 'pending'
    });

    const newPayment = await Payment.create({
      invoiceId: newInvoice.id,
      amount: payment.amount,
      transactionId: payment.reference,
      paymentMethod: payment.paymentMethod,
      status: "success",
      paidAt: new Date()
    });

    newInvoice.status = "paid";
    await newInvoice.save();


  await publishToExchange('payment_events', {
    type: 'PAYMENT_SUCCESSFUL',
    payload: newInvoice
  });


    res.status(201).json({
      invoice: newInvoice,
      payment: newPayment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {    
    const currentYear = new Date().getFullYear();
    
    let bookingStats = {
      totalBookings: 0,
      monthlyBookings: new Array(12).fill(0)
    };

    try {
      const bookingResponse = await bookingClient.getDashboardStats();
      if (bookingResponse && bookingResponse.data) {
        bookingStats = {
          totalBookings: bookingResponse.data.totalBookings || 0,
          monthlyBookings: bookingResponse.data.monthlyBookings || new Array(12).fill(0)
        };
      }
    } catch (bookingError) {
      console.log('Booking service not available:', bookingError.message);
    }

    let userStats = {
      totalUsers: 0,
      monthlyUsers: new Array(12).fill(0)
    };

    try {
      const authResponse = await authClient.getUserStats();
      if (authResponse && authResponse.data) {
        userStats = {
          totalUsers: authResponse.data.totalUsers || 0,
          monthlyUsers: authResponse.data.monthlyUsers || new Array(12).fill(0)
        };
      }
    } catch (authError) {
      console.log('Auth service not available:', authError.message);
    }

    let revenueStats = {
      totalRevenue: 0,
      monthlyRevenue: new Array(12).fill(0)
    };

    try {
      const workOrderStats = await workorderClient.getRevenueStats(currentYear);
      
      if (workOrderStats && workOrderStats.data) {
        const revenueData = workOrderStats.data;
        
        revenueStats = {
          totalRevenue: revenueData.totalRevenue || 0,
          monthlyRevenue: revenueData.monthlyRevenue || new Array(12).fill(0)
        };
      }
    } catch (workOrderError) {
      console.log('WorkOrder service not available:', workOrderError.message);
    }

    let partsStats = {
      totalParts: 0,
      totalQuantity: 0,
      monthlyParts: new Array(12).fill(0),
      monthlyQuantities: new Array(12).fill(0)
    };

    try {
      const inventoryResponse = await inventoryClient.getPartsStats(currentYear);
      
      if (inventoryResponse && inventoryResponse.data) {
        const partsData = inventoryResponse.data;
        
        partsStats = {
          totalParts: partsData.totalParts || 0,
          totalQuantity: partsData.totalQuantity || 0,
          monthlyParts: partsData.monthlyParts || new Array(12).fill(0),
          monthlyQuantities: partsData.monthlyQuantities || new Array(12).fill(0)
        };
      }
    } catch (inventoryError) {
      console.log('Inventory service not available:', inventoryError.message);
    }

    let taskStats = {
      totalTasks: 0,
      monthlyTasks: new Array(12).fill(0),
      monthlyCompleted: new Array(12).fill(0),
      monthlyPending: new Array(12).fill(0)
    };

    try {
      const taskResponse = await workorderClient.getTaskStats();
      
      if (taskResponse && taskResponse.data) {
        const taskData = taskResponse.data;
        
        taskStats = {
          totalTasks: taskData.totalTasks || 0,
          monthlyTasks: taskData.monthlyTasks || new Array(12).fill(0),
          monthlyCompleted: taskData.monthlyCompleted || new Array(12).fill(0),
          monthlyPending: taskData.monthlyPending || new Array(12).fill(0)
        };
      }
    } catch (taskError) {
      console.log('WorkOrder service task stats not available:', taskError.message);
    }

    const dashboardStats = {
      totalBookings: bookingStats.totalBookings,
      totalRevenue: revenueStats.totalRevenue,
      totalUsers: userStats.totalUsers,
      totalParts: partsStats.totalParts,
      totalQuantity: partsStats.totalQuantity,
      totalTasks: taskStats.totalTasks,
      monthlyBookings: bookingStats.monthlyBookings,
      monthlyRevenue: revenueStats.monthlyRevenue,
      monthlyUsers: userStats.monthlyUsers,
      monthlyParts: partsStats.monthlyParts,
      monthlyQuantities: partsStats.monthlyQuantities,
      // --- 📍 LỖI CÚ PHÁP 1 ĐÃ BỊ XÓA TẠI ĐÂY ---
      monthlyTasks: taskStats.monthlyTasks,
      monthlyCompleted: taskStats.monthlyCompleted,
      monthlyPending: taskStats.monthlyPending
    };

    console.log('Dashboard stats result:', dashboardStats);

    res.status(200).json({
      data: dashboardStats,
      message: 'Dashboard stats retrieved successfully'
    });
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    // --- 📍 LỖI CÚ PHÁP 2 ĐÃ SỬA TẠI ĐÂY ---
    res.status(500).json({ message: 'Failed to get dashboard stats' });
  }
};

