import express from "express";
import { register, login, refresh, indexUsers, getUserById, getUserByIdInternal, createUser, updateUser, deleteUser, getUserStats, getUserStatsInternal } from "../controllers/authController.js";
import { verifyToken, isAdmin, isSelfOrAdmin } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

// user management
router.post("/users", [verifyToken, isAdmin], createUser);
router.get("/users", [verifyToken, isAdmin], indexUsers);
router.get("/stats/users", [verifyToken, isAdmin], getUserStats);
router.delete("/users/:id", [verifyToken, isAdmin], deleteUser);
router.get("/users/:id", [verifyToken, isSelfOrAdmin], getUserById);
router.get('/internal/users/:id', getUserByIdInternal);
router.patch("/users/:id", [verifyToken, isSelfOrAdmin], updateUser);
router.get('/internal/stats/users', getUserStatsInternal);

export default router;
