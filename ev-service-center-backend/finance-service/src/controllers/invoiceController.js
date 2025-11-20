import sequelize from "../config/db.js";
import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";
import { publishToExchange } from '../utils/rabbitmq.js';
import { bookingClient, workorderClient, inventoryClient, authClient } from "../client/index.js";
import { recordPaymentSchema, createInvoiceSchema, createInvoiceWithPaymentSchema } from "../validators/invoiceValidator.js";

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
  const { error, value } = createInvoiceSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const { customerId, amount, dueDate, description, appointmentId } = value;
  try {
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
  const { error, value } = recordPaymentSchema.validate(req.body);
  if (error) {
    // Nếu thất bại, trả về lỗi 400 (Bad Request)
    return res.status(400).json({ error: error.details[0].message });
  }

  const { invoiceId, amount, paymentMethod, transactionId, note, paidAt } = value;
  const t = await sequelize.transaction();
  try {
    const invoice = await Invoice.findByPk(invoiceId, { 
      transaction: t, 
      lock: t.LOCK.UPDATE // Khóa hàng này lại để tránh xung đột
    });
    if (!invoice) {await t.rollback(); // Hoàn tác
      return res.status(404).json({ error: "Invoice not found" });
    }
    if (invoice.status === "paid") {
      await t.rollback();
      return res.status(400).json({ error: "Invoice is already paid" });
    }
    const newPayment = await Payment.create({
      invoiceId,
      amount,
      paymentMethod,
      transactionId,
      status: "success",
      paidAt: paidAt || new Date(),
      note
    }, { transaction: t });
    
    invoice.status = "paid"; // trạng thát hóa đơn 
    await invoice.save({ transaction: t });

    await t.commit();

    
   await publishToExchange('payment_events', {
    type: 'PAYMENT_SUCCESSFUL',
      payload: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        amount: newPayment.amount,
        paidAt: newPayment.paidAt
      }
    });
    
    res.status(201).json({ data: newPayment, message: "Payment recorded successfully" });
      } catch (err) {
        await t.rollback();
        res.status(500).json({ error: err.message });
      }
    };

export const createInvoiceWithPayment = async (req, res) => {
  const { error, value } = createInvoiceSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const { customerId, amount, dueDate, description, appointmentId, paymentMethod, transactionId, note } = value;
  const t = await sequelize.transaction();
  try {
    const newInvoice = await Invoice.create({
      customerId,
      amount,
      status: 'paid', // Ghi thẳng là đã thanh toán
      dueDate: dueDate || new Date(),
      description,
      appointmentId
    }, { transaction: t });

    const newPayment = await Payment.create({
      invoiceId: newInvoice.id,
      amount,
      paymentMethod,
      transactionId,
      status: 'success',
      paidAt: new Date(),
      note
    }, { transaction: t });

    await t.commit();

  await publishToExchange('payment_events', {
      type: 'PAYMENT_SUCCESSFUL',
      payload: {
        invoiceId: newInvoice.id,
        customerId: newInvoice.customerId,
        amount: newPayment.amount,
        paidAt: newPayment.paidAt
      }
    });

    res.status(201).json({
      invoice: newInvoice,
      payment: newPayment
    });
  } catch (err) {
    await t.rollback();
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
    res.status(500).json({ message: 'Failed to get dashboard stats' });
  }
};

