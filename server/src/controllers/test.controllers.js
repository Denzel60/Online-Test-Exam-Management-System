import { db } from "../db/index.js";
import { tests, questions, questionOptions, questionBanks, testQuestions } from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";

// ─────────────────────────────────────────────
// 🗂️ TEST CONTROLLERS
// ─────────────────────────────────────────────

export const createTest = async (req, res) => {
  try {
    const { title, description, timeLimit, maxAttempts, startDate, endDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const [test] = await db
      .insert(tests)
      .values({
        title,
        description,
        timeLimit,
        maxAttempts,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdBy: req.user.userId,
        status: "draft",
      })
      .returning();

    return res.status(201).json({ message: "Test created successfully", test });
  } catch (error) {
    console.error("createTest error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllTests = async (req, res) => {
  try {
    const allTests = await db.select().from(tests);
    return res.status(200).json({ tests: allTests });
  } catch (error) {
    console.error("getAllTests error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getTestById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid test ID" });

    const [test] = await db.select().from(tests).where(eq(tests.id, id)).limit(1);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Fetch questions attached to the test
    const attached = await db
      .select({ question: questions, order: testQuestions.order })
      .from(testQuestions)
      .innerJoin(questions, eq(testQuestions.questionId, questions.id))
      .where(eq(testQuestions.testId, id))
      .orderBy(testQuestions.order);

    return res.status(200).json({ test, questions: attached });
  } catch (error) {
    console.error("getTestById error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateTest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid test ID" });

    const { title, description, timeLimit, maxAttempts, startDate, endDate, status } = req.body;

    const [existing] = await db.select().from(tests).where(eq(tests.id, id)).limit(1);
    if (!existing) return res.status(404).json({ message: "Test not found" });

    // Teachers can only update their own tests
    if (req.user.role === "teacher" && existing.createdBy !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to update this test" });
    }

    const [updated] = await db
      .update(tests)
      .set({
        ...(title && { title }),
        ...(description && { description }),
        ...(timeLimit !== undefined && { timeLimit }),
        ...(maxAttempts !== undefined && { maxAttempts }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
        updatedAt: new Date(),
      })
      .where(eq(tests.id, id))
      .returning();

    return res.status(200).json({ message: "Test updated successfully", test: updated });
  } catch (error) {
    console.error("updateTest error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteTest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid test ID" });

    const [existing] = await db.select().from(tests).where(eq(tests.id, id)).limit(1);
    if (!existing) return res.status(404).json({ message: "Test not found" });

    if (req.user.role === "teacher" && existing.createdBy !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to delete this test" });
    }

    await db.delete(tests).where(eq(tests.id, id));
    return res.status(200).json({ message: "Test deleted successfully" });
  } catch (error) {
    console.error("deleteTest error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const publishTest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid test ID" });

    const [existing] = await db.select().from(tests).where(eq(tests.id, id)).limit(1);
    if (!existing) return res.status(404).json({ message: "Test not found" });

    if (req.user.role === "teacher" && existing.createdBy !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to publish this test" });
    }

    // Make sure there are questions before publishing
    const attached = await db.select().from(testQuestions).where(eq(testQuestions.testId, id));
    if (attached.length === 0) {
      return res.status(400).json({ message: "Cannot publish a test with no questions" });
    }

    const [updated] = await db
      .update(tests)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(tests.id, id))
      .returning();

    return res.status(200).json({ message: "Test published successfully", test: updated });
  } catch (error) {
    console.error("publishTest error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// ❓ QUESTION BANK CONTROLLERS
// ─────────────────────────────────────────────

export const createQuestionBank = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Bank name is required" });

    const [bank] = await db
      .insert(questionBanks)
      .values({ name, description, createdBy: req.user.userId })
      .returning();

    return res.status(201).json({ message: "Question bank created", bank });
  } catch (error) {
    console.error("createQuestionBank error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllQuestionBanks = async (req, res) => {
  try {
    const banks = await db.select().from(questionBanks);
    return res.status(200).json({ banks });
  } catch (error) {
    console.error("getAllQuestionBanks error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// ❓ QUESTION CONTROLLERS
// ─────────────────────────────────────────────

export const createQuestion = async (req, res) => {
  try {
    const { bankId, type, text, points, options } = req.body;

    if (!type || !text) {
      return res.status(400).json({ message: "Type and text are required" });
    }

    // Validate options for multiple_choice and true_false
    if (type === "multiple_choice" || type === "true_false") {
      if (!options || options.length < 2) {
        return res.status(400).json({ message: "At least 2 options are required for this question type" });
      }
      const hasCorrect = options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        return res.status(400).json({ message: "At least one correct option is required" });
      }
    }

    const [question] = await db
      .insert(questions)
      .values({ bankId, type, text, points, createdBy: req.user.userId })
      .returning();

    // Insert options if provided
    if (options && options.length > 0) {
      await db.insert(questionOptions).values(
        options.map((o) => ({
          questionId: question.id,
          text: o.text,
          isCorrect: o.isCorrect ?? false,
        }))
      );
    }

    const insertedOptions = await db
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.questionId, question.id));

    return res.status(201).json({ message: "Question created", question, options: insertedOptions });
  } catch (error) {
    console.error("createQuestion error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid question ID" });

    const [existing] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
    if (!existing) return res.status(404).json({ message: "Question not found" });

    if (req.user.role === "teacher" && existing.createdBy !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to delete this question" });
    }

    // ✅ Remove from any tests it's linked to first
    await db.delete(testQuestions).where(eq(testQuestions.questionId, id));

    // ✅ Now safe to delete the question
    await db.delete(questions).where(eq(questions.id, id));

    return res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("deleteQuestion error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
// ─────────────────────────────────────────────
// 📎 TEST ↔ QUESTION LINKING CONTROLLERS
// ─────────────────────────────────────────────

export const addQuestionsToTest = async (req, res) => {
  try {
    const testId = Number(req.params.id);
    if (isNaN(testId)) return res.status(400).json({ message: "Invalid test ID" });

    const { questionIds } = req.body; // [{ questionId: 1, order: 1 }, ...]
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ message: "questionIds array is required" });
    }

    const [test] = await db.select().from(tests).where(eq(tests.id, testId)).limit(1);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (req.user.role === "teacher" && test.createdBy !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to modify this test" });
    }

    await db.insert(testQuestions).values(
      questionIds.map((q) => ({
        testId,
        questionId: q.questionId,
        order: q.order,
      }))
    );

    return res.status(200).json({ message: "Questions added to test successfully" });
  } catch (error) {
    console.error("addQuestionsToTest error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeQuestionFromTest = async (req, res) => {
  try {
    const testId = Number(req.params.id);
    const questionId = Number(req.params.questionId);
    if (isNaN(testId) || isNaN(questionId)) {
      return res.status(400).json({ message: "Invalid test or question ID" });
    }

    await db
      .delete(testQuestions)
      .where(and(eq(testQuestions.testId, testId), eq(testQuestions.questionId, questionId)));

    return res.status(200).json({ message: "Question removed from test" });
  } catch (error) {
    console.error("removeQuestionFromTest error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 🗑️ DELETE MULTIPLE TESTS
// ─────────────────────────────────────────────
export const deleteMultipleTests = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid or empty test IDs array" });
    }

    const parsedIds = ids.map(Number);
    if (parsedIds.some(isNaN)) {
      return res.status(400).json({ message: "All test IDs must be valid numbers" });
    }

    const existing = await db
      .select({ id: tests.id, createdBy: tests.createdBy })
      .from(tests)
      .where(inArray(tests.id, parsedIds));

    if (existing.length === 0) {
      return res.status(404).json({ message: "No tests found for the provided IDs" });
    }

    // Teachers can only delete their own tests
    if (req.user.role === "teacher") {
      const unauthorized = existing.filter((t) => t.createdBy !== req.user.userId);
      if (unauthorized.length > 0) {
        return res.status(403).json({
          message: "Not authorized to delete some of these tests",
          unauthorizedIds: unauthorized.map((t) => t.id),
        });
      }
    }

    const existingIds = existing.map((t) => t.id);

    // Remove linked questions from test_questions first
    await db.delete(testQuestions).where(inArray(testQuestions.testId, existingIds));

    // Now safe to delete the tests
    await db.delete(tests).where(inArray(tests.id, existingIds));

    const notFoundIds = parsedIds.filter((id) => !existingIds.includes(id));
    return res.status(200).json({
      message: `${existingIds.length} test(s) deleted successfully`,
      deleted: existingIds,
      ...(notFoundIds.length > 0 && { notFound: notFoundIds }),
    });
  } catch (error) {
    console.error("deleteMultipleTests error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 🗑️ DELETE MULTIPLE QUESTIONS FROM A TEST
// ─────────────────────────────────────────────
export const deleteMultipleQuestionsFromTest = async (req, res) => {
  try {
    const testId = Number(req.params.id);
    if (isNaN(testId)) return res.status(400).json({ message: "Invalid test ID" });

    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ message: "Invalid or empty questionIds array" });
    }

    const parsedIds = questionIds.map(Number);
    if (parsedIds.some(isNaN)) {
      return res.status(400).json({ message: "All question IDs must be valid numbers" });
    }

    const [test] = await db.select().from(tests).where(eq(tests.id, testId)).limit(1);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (req.user.role === "teacher" && test.createdBy !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to modify this test" });
    }

    // Check which questionIds actually exist in this test
    const existing = await db
      .select({ questionId: testQuestions.questionId })
      .from(testQuestions)
      .where(
        and(
          eq(testQuestions.testId, testId),
          inArray(testQuestions.questionId, parsedIds)
        )
      );

    if (existing.length === 0) {
      return res.status(404).json({ message: "None of the provided questions are linked to this test" });
    }

    const existingIds = existing.map((q) => q.questionId);

    await db
      .delete(testQuestions)
      .where(
        and(
          eq(testQuestions.testId, testId),
          inArray(testQuestions.questionId, existingIds)
        )
      );

    const notFoundIds = parsedIds.filter((id) => !existingIds.includes(id));
    return res.status(200).json({
      message: `${existingIds.length} question(s) removed from test successfully`,
      removed: existingIds,
      ...(notFoundIds.length > 0 && { notFound: notFoundIds }),
    });
  } catch (error) {
    console.error("deleteMultipleQuestionsFromTest error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 🗑️ DELETE MULTIPLE QUESTIONS
// ─────────────────────────────────────────────
export const deleteMultipleQuestions = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid or empty question IDs array" });
    }

    const parsedIds = ids.map(Number);
    if (parsedIds.some(isNaN)) {
      return res.status(400).json({ message: "All question IDs must be valid numbers" });
    }

    const existing = await db
      .select({ id: questions.id, createdBy: questions.createdBy })
      .from(questions)
      .where(inArray(questions.id, parsedIds));

    if (existing.length === 0) {
      return res.status(404).json({ message: "No questions found for the provided IDs" });
    }

    // Teachers can only delete their own questions
    if (req.user.role === "teacher") {
      const unauthorized = existing.filter((q) => q.createdBy !== req.user.userId);
      if (unauthorized.length > 0) {
        return res.status(403).json({
          message: "Not authorized to delete some of these questions",
          unauthorizedIds: unauthorized.map((q) => q.id),
        });
      }
    }

    const existingIds = existing.map((q) => q.id);

    // Remove from test_questions first to avoid foreign key error
    await db.delete(testQuestions).where(inArray(testQuestions.questionId, existingIds));

    // Now safe to delete the questions
    await db.delete(questions).where(inArray(questions.id, existingIds));

    const notFoundIds = parsedIds.filter((id) => !existingIds.includes(id));
    return res.status(200).json({
      message: `${existingIds.length} question(s) deleted successfully`,
      deleted: existingIds,
      ...(notFoundIds.length > 0 && { notFound: notFoundIds }),
    });
  } catch (error) {
    console.error("deleteMultipleQuestions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};