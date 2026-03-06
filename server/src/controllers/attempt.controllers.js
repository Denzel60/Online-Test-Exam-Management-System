import { db } from "../db/index.js";
import {
  tests,
  questions,
  questionOptions,
  testQuestions,
  testAttempts,
  attemptAnswers,
} from "../db/schema.js";
import { eq, and, inArray, sql } from "drizzle-orm";

// ─────────────────────────────────────────────
// 📋 GET AVAILABLE TESTS FOR STUDENTS
// ─────────────────────────────────────────────

// export const getAvailableTests = async (req, res) => {
//   try {
//     const now = new Date();

//     const availableTests = await db
//       .select({
//         id: tests.id,
//         title: tests.title,
//         description: tests.description,
//         timeLimit: tests.timeLimit,
//         maxAttempts: tests.maxAttempts,
//         startDate: tests.startDate,
//         endDate: tests.endDate,
//       })
//       .from(tests)
//       .where(eq(tests.status, "published"));

//     // Filter by schedule if start/end dates are set
//     const filtered = availableTests.filter((t) => {
//       if (t.startDate && new Date(t.startDate) > now) return false;
//       if (t.endDate && new Date(t.endDate) < now) return false;
//       return true;
//     });

//     return res.status(200).json({ tests: filtered });
//   } catch (error) {
//     console.error("getAvailableTests error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

export const getAvailableTests = async (req, res) => {
  try {
    const now = new Date();

    const availableTests = await db
      .select({
        id: tests.id,
        title: tests.title,
        description: tests.description,
        timeLimit: tests.timeLimit,
        maxAttempts: tests.maxAttempts,
        startDate: tests.startDate,
        endDate: tests.endDate,
      })
      .from(tests)
      .where(eq(tests.status, "published"));

    // ✅ Only filter by date if dates are actually set
    const filtered = availableTests.filter((t) => {
      if (t.startDate && new Date(t.startDate) > now) return false; // not started yet
      if (t.endDate && new Date(t.endDate) < now) return false;     // already ended
      return true; // null dates = always available
    });

    return res.status(200).json({ tests: filtered });
  } catch (error) {
    console.error("getAvailableTests error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 🚀 START OR RESUME A TEST ATTEMPT
// ─────────────────────────────────────────────

export const startAttempt = async (req, res) => {
  try {
    const testId = Number(req.params.testId);
    if (isNaN(testId)) return res.status(400).json({ message: "Invalid test ID" });

    const studentId = req.user.userId;
    const now = new Date();

    // Check test exists and is published
    const [test] = await db.select().from(tests).where(eq(tests.id, testId)).limit(1);
    if (!test) return res.status(404).json({ message: "Test not found" });
    if (test.status !== "published") return res.status(403).json({ message: "Test is not available" });

    // Check schedule
    if (test.startDate && new Date(test.startDate) > now) {
      return res.status(403).json({ message: "Test has not started yet" });
    }
    if (test.endDate && new Date(test.endDate) < now) {
      return res.status(403).json({ message: "Test has already ended" });
    }

    // Check if student has an in_progress attempt to resume
    const [inProgress] = await db
      .select()
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.testId, testId),
          eq(testAttempts.studentId, studentId),
          eq(testAttempts.status, "in_progress")
        )
      )
      .limit(1);

    if (inProgress) {
      // Resume existing attempt — fetch saved answers
      const saved = await db
        .select()
        .from(attemptAnswers)
        .where(eq(attemptAnswers.attemptId, inProgress.id));

      return res.status(200).json({
        message: "Resuming existing attempt",
        attempt: inProgress,
        savedAnswers: saved,
      });
    }

    // Check max attempts
    const previousAttempts = await db
      .select()
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.testId, testId),
          eq(testAttempts.studentId, studentId),
          eq(testAttempts.status, "submitted")
        )
      );

    if (test.maxAttempts && previousAttempts.length >= test.maxAttempts) {
      return res.status(403).json({
        message: `Maximum attempts (${test.maxAttempts}) reached for this test`,
      });
    }

    // Fetch test questions
    const testQs = await db
      .select({ question: questions, order: testQuestions.order })
      .from(testQuestions)
      .innerJoin(questions, eq(testQuestions.questionId, questions.id))
      .where(eq(testQuestions.testId, testId))
      .orderBy(testQuestions.order);

    // Fetch options for each question (hide isCorrect from student)
    const questionIds = testQs.map((q) => q.question.id);
    const options = await db
      .select({
        id: questionOptions.id,
        questionId: questionOptions.questionId,
        text: questionOptions.text,
      })
      .from(questionOptions)
      .where(inArray(questionOptions.questionId, questionIds));

    // Create new attempt
    const [attempt] = await db
      .insert(testAttempts)
      .values({ testId, studentId, status: "in_progress" })
      .returning();

    // Attach options to each question
    const questionsWithOptions = testQs.map((q) => ({
      ...q.question,
      order: q.order,
      options: options.filter((o) => o.questionId === q.question.id),
    }));

    return res.status(201).json({
      message: "Attempt started",
      attempt,
      questions: questionsWithOptions,
    });
  } catch (error) {
    console.error("startAttempt error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 💾 SAVE PROGRESS (auto-save / resume support)
// ─────────────────────────────────────────────

export const saveProgress = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    if (isNaN(attemptId)) return res.status(400).json({ message: "Invalid attempt ID" });

    const { answers } = req.body;
    // answers: [{ questionId, selectedOptionId?, answerText? }]
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Answers array is required" });
    }

    const [attempt] = await db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, attemptId))
      .limit(1);

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.studentId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (attempt.status === "submitted") {
      return res.status(400).json({ message: "Cannot save progress on a submitted attempt" });
    }

    // Upsert each answer — update if exists, insert if not
    for (const answer of answers) {
      const [existing] = await db
        .select()
        .from(attemptAnswers)
        .where(
          and(
            eq(attemptAnswers.attemptId, attemptId),
            eq(attemptAnswers.questionId, answer.questionId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(attemptAnswers)
          .set({
            selectedOptionId: answer.selectedOptionId ?? null,
            answerText: answer.answerText ?? null,
          })
          .where(eq(attemptAnswers.id, existing.id));
      } else {
        await db.insert(attemptAnswers).values({
          attemptId,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId ?? null,
          answerText: answer.answerText ?? null,
        });
      }
    }

    return res.status(200).json({ message: "Progress saved successfully" });
  } catch (error) {
    console.error("saveProgress error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 📤 SUBMIT ATTEMPT
// ─────────────────────────────────────────────

export const submitAttempt = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    if (isNaN(attemptId)) return res.status(400).json({ message: "Invalid attempt ID" });

    const [attempt] = await db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, attemptId))
      .limit(1);

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.studentId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (attempt.status === "submitted") {
      return res.status(400).json({ message: "Attempt already submitted" });
    }

    // Fetch all answers for this attempt
    const answers = await db
      .select()
      .from(attemptAnswers)
      .where(eq(attemptAnswers.attemptId, attemptId));

    // Fetch all questions for this test with their points
    const testQs = await db
      .select({ question: questions })
      .from(testQuestions)
      .innerJoin(questions, eq(testQuestions.questionId, questions.id))
      .where(eq(testQuestions.testId, attempt.testId));

    // Fetch all correct options
    const questionIds = testQs.map((q) => q.question.id);
    const allOptions = await db
      .select()
      .from(questionOptions)
      .where(inArray(questionOptions.questionId, questionIds));

    let totalPoints = 0;
    let score = 0;

    // Grade each answer
    for (const tq of testQs) {
      const q = tq.question;
      totalPoints += q.points;

      const studentAnswer = answers.find((a) => a.questionId === q.id);
      if (!studentAnswer) continue;

      let isCorrect = false;

      if (q.type === "multiple_choice" || q.type === "true_false") {
        const selectedOption = allOptions.find((o) => o.id === studentAnswer.selectedOptionId);
        isCorrect = selectedOption?.isCorrect ?? false;
      } else if (q.type === "short_answer") {
        // Auto-grade by exact text match (case insensitive)
        const correctOption = allOptions.find(
          (o) => o.questionId === q.id && o.isCorrect
        );
        if (correctOption && studentAnswer.answerText) {
          isCorrect =
            studentAnswer.answerText.trim().toLowerCase() ===
            correctOption.text.trim().toLowerCase();
        }
      }

      const pointsAwarded = isCorrect ? q.points : 0;
      score += pointsAwarded;

      // Update answer with grading result
      await db
        .update(attemptAnswers)
        .set({ isCorrect, pointsAwarded })
        .where(eq(attemptAnswers.id, studentAnswer.id));
    }

    const isPassed = totalPoints > 0 ? score / totalPoints >= 0.5 : false;

    // Mark attempt as submitted
    const [submitted] = await db
      .update(testAttempts)
      .set({
        status: "submitted",
        score,
        totalPoints,
        isPassed,
        submittedAt: new Date(),
      })
      .where(eq(testAttempts.id, attemptId))
      .returning();

    return res.status(200).json({
      message: "Test submitted successfully",
      result: {
        score,
        totalPoints,
        percentage: totalPoints > 0 ? ((score / totalPoints) * 100).toFixed(1) : 0,
        isPassed,
      },
    });
  } catch (error) {
    console.error("submitAttempt error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 📊 VIEW SCORE & CORRECT ANSWERS
// ─────────────────────────────────────────────

export const getAttemptResult = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    if (isNaN(attemptId)) return res.status(400).json({ message: "Invalid attempt ID" });

    const [attempt] = await db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, attemptId))
      .limit(1);

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.studentId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (attempt.status !== "submitted") {
      return res.status(400).json({ message: "Attempt has not been submitted yet" });
    }

    // Fetch answers with question and correct option details
    const answers = await db
      .select()
      .from(attemptAnswers)
      .where(eq(attemptAnswers.attemptId, attemptId));

    const questionIds = answers.map((a) => a.questionId);
    const allQuestions = await db
      .select()
      .from(questions)
      .where(inArray(questions.id, questionIds));

    const allOptions = await db
      .select()
      .from(questionOptions)
      .where(inArray(questionOptions.questionId, questionIds));

    // Build detailed result per question
    const breakdown = allQuestions.map((q) => {
      const studentAnswer = answers.find((a) => a.questionId === q.id);
      const correctOption = allOptions.find((o) => o.questionId === q.id && o.isCorrect);
      const selectedOption = allOptions.find((o) => o.id === studentAnswer?.selectedOptionId);

      return {
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        points: q.points,
        pointsAwarded: studentAnswer?.pointsAwarded ?? 0,
        isCorrect: studentAnswer?.isCorrect ?? false,
        yourAnswer: selectedOption?.text ?? studentAnswer?.answerText ?? null,
        correctAnswer: correctOption?.text ?? null,
      };
    });

    return res.status(200).json({
      result: {
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        percentage:
          attempt.totalPoints > 0
            ? ((attempt.score / attempt.totalPoints) * 100).toFixed(1)
            : 0,
        isPassed: attempt.isPassed,
        submittedAt: attempt.submittedAt,
      },
      breakdown,
    });
  } catch (error) {
    console.error("getAttemptResult error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 📜 GET STUDENT'S OWN ATTEMPT HISTORY
// ─────────────────────────────────────────────

export const getMyAttempts = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const attempts = await db
      .select({
        id: testAttempts.id,
        testId: testAttempts.testId,
        testTitle: tests.title,
        status: testAttempts.status,
        score: testAttempts.score,
        totalPoints: testAttempts.totalPoints,
        isPassed: testAttempts.isPassed,
        startedAt: testAttempts.startedAt,
        submittedAt: testAttempts.submittedAt,
      })
      .from(testAttempts)
      .innerJoin(tests, eq(testAttempts.testId, tests.id))
      .where(eq(testAttempts.studentId, studentId));

    return res.status(200).json({ attempts });
  } catch (error) {
    console.error("getMyAttempts error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};