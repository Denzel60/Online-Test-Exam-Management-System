import { Router } from "express";
import {
  // Auth
  createUser,
  loginUser,
  refreshToken,
  // Self-service
  getMe,
  updateMe,
  // Admin
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  deleteMultipleUsers
} from "../controllers/user.controllers.js";
import { authenticate } from "../middlewares/auth.middlewares.js";
import { adminOnly } from "../middlewares/roles.middlewares.js";

const router = Router();

// ─────────────────────────────────────────────
// 🔐 AUTH  (public)
// ─────────────────────────────────────────────
router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);

// ─────────────────────────────────────────────
// 👤 SELF-SERVICE  (any authenticated user)
// ─────────────────────────────────────────────
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);

// ─────────────────────────────────────────────
// 🛡️ ADMIN  (admin only)
// ─────────────────────────────────────────────
router.get("/", authenticate, adminOnly, getAllUsers);
router.get("/:id", authenticate, adminOnly, getUserById);
router.patch("/:id/role", authenticate, adminOnly, updateUserRole);
router.delete("/bulk", authenticate, adminOnly, deleteMultipleUsers);
router.delete("/:id", authenticate, adminOnly, deleteUser);

export default router;