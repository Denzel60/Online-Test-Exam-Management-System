import { Router } from "express";
import {
  getAvailableTests,
  startAttempt,
  saveProgress,
  submitAttempt,
  getAttemptResult,
  getMyAttempts,
} from "../controllers/attempt.controllers.js";
import { authenticate } from "../middlewares/auth.middlewares.js";
import { studentOnly } from "../middlewares/roles.middlewares.js";

const router = Router();

// ─────────────────────────────────────────────
// 📋 TESTS
// ─────────────────────────────────────────────
router.get("/", authenticate, studentOnly, getAvailableTests);
router.post("/:testId/start", authenticate, studentOnly, startAttempt);

// ─────────────────────────────────────────────
// ✍️ ATTEMPTS
// ─────────────────────────────────────────────
router.get("/attempts", authenticate, studentOnly, getMyAttempts);
router.post("/attempts/:attemptId/save", authenticate, studentOnly, saveProgress);
router.post("/attempts/:attemptId/submit", authenticate, studentOnly, submitAttempt);
router.get("/attempts/:attemptId/result", authenticate, studentOnly, getAttemptResult);

export default router;