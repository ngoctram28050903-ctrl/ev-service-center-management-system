import { Router } from "express";
import { getInvoices, createInvoice, recordPayment } from "../controllers/invoiceController.js";

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Finance
 *   description: Quản lý hóa đơn và thanh toán
 */

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Lấy danh sách tất cả các hóa đơn
 *     tags: [Finance]
 *     responses:
 *       200: { description: "List of invoices" }
 */
router.get("/", getInvoices);

/**
 * @swagger
 * /api/finance/invoices:
 *   get:
 *     summary: Lấy danh sách tất cả hóa đơn
 *     tags: [Finance]
 *     responses:
 *       200:
 *         description: Danh sách hóa đơn
 *
 *   post:
 *     summary: Tạo hóa đơn mới
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Hóa đơn được tạo thành công
 */
router.post("/", createInvoice);
/**
 * @swagger
 * /api/finance/payments:
 *   post:
 *     summary: Ghi nhận thanh toán hóa đơn
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceId:
 *                 type: integer
 *               method:
 *                 type: string
 *                 example: "banking"
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Thanh toán đã được ghi nhận
 */
router.post("/payment", recordPayment);

export default router;
