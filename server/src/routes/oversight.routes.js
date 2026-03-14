import { Router } from "express";
import {
  getAttemptsByTest,
  getAttemptDetail,
  overrideGrade,
  flagAttempt,
  getLeaderboard,
  exportResults,
  unflagAttempt 
} from "../controllers/oversight.controllers.js";
import { authenticate } from "../middlewares/auth.middlewares.js";
import { adminOrTeacher } from "../middlewares/roles.middlewares.js";

const router = Router();

// ─────────────────────────────────────────────
// 📊 ATTEMPTS & RESULTS
// ─────────────────────────────────────────────
router.get("/tests/:testId/attempts", authenticate, adminOrTeacher, getAttemptsByTest);
router.get("/attempts/:attemptId", authenticate, adminOrTeacher, getAttemptDetail);

// ─────────────────────────────────────────────
// ✏️ GRADING
// ─────────────────────────────────────────────
router.patch("/attempts/:attemptId/questions/:questionId/grade", authenticate, adminOrTeacher, overrideGrade);

// ─────────────────────────────────────────────
// 🚩 FLAGGING
// ─────────────────────────────────────────────
router.patch("/attempts/:attemptId/flag", authenticate, adminOrTeacher, flagAttempt);
router.patch("/attempts/:attemptId/unflag", authenticate, adminOrTeacher, unflagAttempt);

// ─────────────────────────────────────────────
// 🏆 LEADERBOARD
// ─────────────────────────────────────────────
router.get("/tests/:testId/leaderboard", authenticate, adminOrTeacher, getLeaderboard);

// ─────────────────────────────────────────────
// 📥 EXPORT
// ─────────────────────────────────────────────
router.get("/tests/:testId/export", authenticate, adminOrTeacher, exportResults);

export default router;