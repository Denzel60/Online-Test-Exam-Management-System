import { Router } from "express";
import {
  // Tests
  createTest,
  getAllTests,
  getTestById,
  updateTest,
  deleteTest,
  publishTest,
  // Question Banks
  createQuestionBank,
  getAllQuestionBanks,
  // Questions
  createQuestion,
  deleteQuestion,
  // Linking
  addQuestionsToTest,
  removeQuestionFromTest,
  deleteMultipleTests,
  deleteMultipleQuestionsFromTest,
  deleteMultipleQuestions,
} from "../controllers/test.controllers.js";
import { authenticate } from "../middlewares/auth.middlewares.js";
import { adminOnly, adminOrTeacher } from "../middlewares/roles.middlewares.js";

const router = Router();

// ─────────────────────────────────────────────
// 🗃️ QUESTION BANKS
// ─────────────────────────────────────────────
router.get("/banks", authenticate, adminOrTeacher, getAllQuestionBanks);
router.post("/banks", authenticate, adminOrTeacher, createQuestionBank);

// Add these alongside the existing routes — keep them above /:id routes
router.delete("/bulk", authenticate, adminOrTeacher, deleteMultipleTests);                        // delete multiple tests
router.delete("/questions/bulk", authenticate, adminOrTeacher, deleteMultipleQuestions);          // delete multiple questions
router.delete("/:id/questions/bulk", authenticate, adminOrTeacher, deleteMultipleQuestionsFromTest); // remove multiple questions from a te

// ─────────────────────────────────────────────
// 🗂️ TESTS
// ─────────────────────────────────────────────
router.get("/", authenticate, adminOrTeacher, getAllTests);
router.post("/", authenticate, adminOrTeacher, createTest);
router.get("/:id", authenticate, adminOrTeacher, getTestById);
router.patch("/:id", authenticate, adminOrTeacher, updateTest);
router.delete("/:id", authenticate, adminOrTeacher, deleteTest);
router.patch("/:id/publish", authenticate, adminOrTeacher, publishTest);

// ─────────────────────────────────────────────
// 📎 TEST ↔ QUESTION LINKING
// ─────────────────────────────────────────────
router.post("/:id/questions", authenticate, adminOrTeacher, addQuestionsToTest);
router.delete("/:id/questions/:questionId", authenticate, adminOrTeacher, removeQuestionFromTest)

// ─────────────────────────────────────────────
// ❓ QUESTIONS
// ─────────────────────────────────────────────
router.post("/questions", authenticate, adminOrTeacher, createQuestion);
router.delete("/questions/:id", authenticate, adminOrTeacher, deleteQuestion);

export default router;