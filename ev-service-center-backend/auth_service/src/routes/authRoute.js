import express from "express";
import { register, login, refresh } from "../controllers/authController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API xác thực người dùng
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Cuong
 *               email:
 *                 type: string
 *                 example: cuong@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               role:
 *                 type: string
 *                 example: customer
 *     responses:
 *       201:
 *         description: Người dùng đã được tạo thành công
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Người dùng đã đăng nhập
 */
router.post("/login", login);
/**
 * @swagger
 * /api/auth/refresh:
 *  post:
 *    summary: Làm mới mã thông báo truy cập
 *    tags: [Auth]
 *    responses:
 *      200:
 *        description: Mã thông báo đã được làm mới
 */
router.post("/refresh", refresh);

export default router;