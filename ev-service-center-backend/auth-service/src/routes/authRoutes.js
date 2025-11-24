import express from "express";
import { register, login, refresh, indexUsers, getUserById, createUser, updateUser, deleteUser, getUserStats } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

// user management
router.get("/users", indexUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// statistics
router.get("/stats/users", getUserStats);

export default router;
