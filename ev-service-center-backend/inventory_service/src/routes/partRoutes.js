import { Router } from "express";
import { getParts, addPart, updateStock } from "../controllers/partController.js";

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Quản lý kho phụ tùng EV
 */

/**
 * @swagger
 * /api/inventory/parts:
 *   get:
 *     summary: Lấy danh sách tất cả phụ tùng
 *     tags: [Inventory]
 *     responses:
 *       200: { description: "Danh sách phụ tùng" }
 */
router.get("/", getParts);

/**
 * @swagger
 * /api/inventory/parts:
 *   get:
 *     summary: Lấy danh sách tất cả phụ tùng
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Danh sách phụ tùng
 *
 *   post:
 *     summary: Thêm phụ tùng mới vào kho
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               partNumber:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               minStock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Thêm phụ tùng thành công
 */
router.post("/", addPart);
/**
 * @swagger
 * /api/inventory/parts/{id}/stock:
 *   put:
 *     summary: Cập nhật tồn kho (nhập hoặc xuất)
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phụ tùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               changeType:
 *                 type: string
 *                 example: "IN"
 *               quantity:
 *                 type: integer
 *                 example: 10
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật tồn kho thành công
 */
router.put("/:id/stock", updateStock);

export default router;
