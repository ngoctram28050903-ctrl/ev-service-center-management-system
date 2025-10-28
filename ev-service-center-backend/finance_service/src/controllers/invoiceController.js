import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";

/**
 * @desc   Lấy tất cả hóa đơn và thông tin thanh toán đi kèm
 * @route  GET /api/finance/invoices
 * @access Public / Internal
 */
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [{ model: Payment, as: "payments" }],
    });
    res.status(200).json(invoices);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách hóa đơn:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * @desc   Tạo hóa đơn mới
 * @route  POST /api/finance/invoices
 * @access Internal (Staff/Admin)
 */
export const createInvoice = async (req, res) => {
  try {
    const { customerId, amount, dueDate, description } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!customerId || !amount || !dueDate) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
    }

    const invoice = await Invoice.create({
      customerId,
      amount,
      dueDate,
      description: description || null,
      status: "unpaid",
    });

    res
      .status(201)
      .json({ message: "Tạo hóa đơn thành công", invoice });
  } catch (err) {
    console.error("❌ Lỗi tạo hóa đơn:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * @desc   Ghi nhận thanh toán cho hóa đơn
 * @route  POST /api/finance/payments
 * @access Public / Internal
 */
export const recordPayment = async (req, res) => {
  try {
    const { invoiceId, method, amount } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!invoiceId || !method || !amount) {
      return res
        .status(400)
        .json({ error: "Thiếu thông tin: invoiceId, method hoặc amount." });
    }

    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: "Không tìm thấy hóa đơn." });
    }

    // Tạo bản ghi thanh toán mới
    const payment = await Payment.create({
      invoiceId,
      method,
      amount,
      paymentDate: new Date(),
    });

    // Cập nhật trạng thái hóa đơn
    invoice.status = "paid";
    await invoice.save();

    res.status(201).json({
      message: "Thanh toán đã được ghi nhận.",
      payment,
    });
  } catch (err) {
    console.error("❌ Lỗi ghi nhận thanh toán:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * @desc   Lấy danh sách thanh toán
 * @route  GET /api/finance/payments
 * @access Internal
 */
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [{ model: Invoice, as: "invoice" }],
    });
    res.status(200).json(payments);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách thanh toán:", err);
    res.status(500).json({ error: err.message });
  }
};
