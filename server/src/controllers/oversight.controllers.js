import { db } from "../db/index.js";
import {
  tests,
  questions,
  questionOptions,
  testAttempts,
  attemptAnswers,
  users,
} from "../db/schema.js";
import { eq, and, inArray, desc } from "drizzle-orm";

// ─────────────────────────────────────────────
// 📊 GET ALL ATTEMPTS FOR A TEST
// ─────────────────────────────────────────────

export const getAttemptsByTest = async (req, res) => {
  try {
    const testId = Number(req.params.testId);
    if (isNaN(testId)) return res.status(400).json({ message: "Invalid test ID" });

    const [test] = await db.select().from(tests).where(eq(tests.id, testId)).limit(1);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Teachers can only view attempts for their own tests
    if (req.user.role === "teacher" && test.createdBy !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to view attempts for this test" });
    }

    const attempts = await db
      .select({
        attemptId: testAttempts.id,
        studentId: testAttempts.studentId,
        studentName: users.name,
        studentEmail: users.email,
        status: testAttempts.status,
        score: testAttempts.score,
        totalPoints: testAttempts.totalPoints,
        isPassed: testAttempts.isPassed,
        isFlagged: testAttempts.isFlagged,
        flagReason: testAttempts.flagReason,
        startedAt: testAttempts.startedAt,
        submittedAt: testAttempts.submittedAt,
      })
      .from(testAttempts)
      .innerJoin(users, eq(testAttempts.studentId, users.id))
      .where(eq(testAttempts.testId, testId))
      .orderBy(desc(testAttempts.submittedAt));

    return res.status(200).json({ attempts });
  } catch (error) {
    console.error("getAttemptsByTest error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 🔍 GET A SPECIFIC STUDENT ATTEMPT DETAIL
// ─────────────────────────────────────────────

export const getAttemptDetail = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    if (isNaN(attemptId)) return res.status(400).json({ message: "Invalid attempt ID" });

    const [attempt] = await db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, attemptId))
      .limit(1);

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    // Teachers can only view attempts for their own tests
    if (req.user.role === "teacher") {
      const [test] = await db.select().from(tests).where(eq(tests.id, attempt.testId)).limit(1);
      if (test.createdBy !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to view this attempt" });
      }
    }

    const answers = await db
      .select()
      .from(attemptAnswers)
      .where(eq(attemptAnswers.attemptId, attemptId));

    if (answers.length === 0) {
      return res.status(200).json({ attempt, breakdown: [] });
    }

    const questionIds = answers.map((a) => a.questionId);

    const allQuestions = await db
      .select()
      .from(questions)
      .where(inArray(questions.id, questionIds));

    const allOptions = await db
      .select()
      .from(questionOptions)
      .where(inArray(questionOptions.questionId, questionIds));

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

    return res.status(200).json({ attempt, breakdown });
  } catch (error) {
    console.error("getAttemptDetail error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// ✏️ OVERRIDE SHORT ANSWER GRADE
// ─────────────────────────────────────────────

export const overrideGrade = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    const questionId = Number(req.params.questionId);
    if (isNaN(attemptId) || isNaN(questionId)) {
      return res.status(400).json({ message: "Invalid attempt or question ID" });
    }

    const { pointsAwarded, isCorrect } = req.body;
    if (pointsAwarded === undefined || isCorrect === undefined) {
      return res.status(400).json({ message: "pointsAwarded and isCorrect are required" });
    }

    const [attempt] = await db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, attemptId))
      .limit(1);

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.status !== "submitted") {
      return res.status(400).json({ message: "Can only override grades on submitted attempts" });
    }

    // Teachers can only override grades for their own tests
    if (req.user.role === "teacher") {
      const [test] = await db.select().from(tests).where(eq(tests.id, attempt.testId)).limit(1);
      if (test.createdBy !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to override this grade" });
      }
    }

    // Make sure it's a short answer question
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (!question) return res.status(404).json({ message: "Question not found" });
    if (question.type !== "short_answer") {
      return res.status(400).json({ message: "Can only override grades for short answer questions" });
    }

    // Update the specific answer
    await db
      .update(attemptAnswers)
      .set({ pointsAwarded, isCorrect })
      .where(
        and(
          eq(attemptAnswers.attemptId, attemptId),
          eq(attemptAnswers.questionId, questionId)
        )
      );

    // Recalculate total score for the attempt
    const allAnswers = await db
      .select()
      .from(attemptAnswers)
      .where(eq(attemptAnswers.attemptId, attemptId));

    const newScore = allAnswers.reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0);

    const [testRecord] = await db
      .select()
      .from(tests)
      .where(eq(tests.id, attempt.testId))
      .limit(1);

    const passMarkPercent = testRecord?.passMarkPercent ?? 50;
    const isPassed =
      attempt.totalPoints > 0
        ? (newScore / attempt.totalPoints) * 100 >= passMarkPercent
        : false;

    const [updated] = await db
      .update(testAttempts)
      .set({ score: newScore, isPassed })
      .where(eq(testAttempts.id, attemptId))
      .returning();

    return res.status(200).json({
      message: "Grade overridden successfully",
      updatedAttempt: {
        score: updated.score,
        totalPoints: updated.totalPoints,
        isPassed: updated.isPassed,
        percentage:
          updated.totalPoints > 0
            ? ((updated.score / updated.totalPoints) * 100).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    console.error("overrideGrade error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 🚩 FLAG A SUSPICIOUS ATTEMPT
// ─────────────────────────────────────────────

export const flagAttempt = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    if (isNaN(attemptId)) return res.status(400).json({ message: "Invalid attempt ID" });

    const { flagReason } = req.body;
    if (!flagReason) return res.status(400).json({ message: "Flag reason is required" });

    const [attempt] = await db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, attemptId))
      .limit(1);

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    // Teachers can only flag attempts on their own tests
    if (req.user.role === "teacher") {
      const [test] = await db.select().from(tests).where(eq(tests.id, attempt.testId)).limit(1);
      if (test.createdBy !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to flag this attempt" });
      }
    }

    await db
      .update(testAttempts)
      .set({ isFlagged: true, flagReason })
      .where(eq(testAttempts.id, attemptId));

    return res.status(200).json({ message: "Attempt flagged successfully" });
  } catch (error) {
    console.error("flagAttempt error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 🏆 LEADERBOARD FOR A TEST
// ─────────────────────────────────────────────

export const getLeaderboard = async (req, res) => {
  try {
    const testId = Number(req.params.testId);
    if (isNaN(testId)) return res.status(400).json({ message: "Invalid test ID" });

    const [test] = await db.select().from(tests).where(eq(tests.id, testId)).limit(1);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (req.user.role === "teacher" && test.createdBy !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to view this leaderboard" });
    }

    const attempts = await db
      .select({
        studentName: users.name,
        score: testAttempts.score,
        totalPoints: testAttempts.totalPoints,
        isPassed: testAttempts.isPassed,
        submittedAt: testAttempts.submittedAt,
      })
      .from(testAttempts)
      .innerJoin(users, eq(testAttempts.studentId, users.id))
      .where(
        and(
          eq(testAttempts.testId, testId),
          eq(testAttempts.status, "submitted")
        )
      )
      .orderBy(desc(testAttempts.score));

    const leaderboard = attempts.map((a, index) => ({
      rank: index + 1,
      studentName: a.studentName,
      score: a.score,
      totalPoints: a.totalPoints,
      percentage:
        a.totalPoints > 0 ? ((a.score / a.totalPoints) * 100).toFixed(1) : 0,
      isPassed: a.isPassed,
      submittedAt: a.submittedAt,
    }));

    return res.status(200).json({ testTitle: test.title, leaderboard });
  } catch (error) {
    console.error("getLeaderboard error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 📥 EXPORT RESULTS AS CSV
// ─────────────────────────────────────────────

export const exportResults = async (req, res) => {
  try {
    const testId = Number(req.params.testId);
    if (isNaN(testId)) return res.status(400).json({ message: "Invalid test ID" });

    const [test] = await db.select().from(tests).where(eq(tests.id, testId)).limit(1);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (req.user.role === "teacher" && test.createdBy !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to export results for this test" });
    }

    const attempts = await db
      .select({
        studentName: users.name,
        studentEmail: users.email,
        score: testAttempts.score,
        totalPoints: testAttempts.totalPoints,
        isPassed: testAttempts.isPassed,
        isFlagged: testAttempts.isFlagged,
        flagReason: testAttempts.flagReason,
        submittedAt: testAttempts.submittedAt,
      })
      .from(testAttempts)
      .innerJoin(users, eq(testAttempts.studentId, users.id))
      .where(
        and(
          eq(testAttempts.testId, testId),
          eq(testAttempts.status, "submitted")
        )
      )
      .orderBy(desc(testAttempts.score));

    // Build CSV
    const header = "Name,Email,Score,Total Points,Percentage,Passed,Flagged,Flag Reason,Submitted At";
    const rows = attempts.map((a) => {
      const percentage =
        a.totalPoints > 0 ? ((a.score / a.totalPoints) * 100).toFixed(1) : 0;
      return `${a.studentName},${a.studentEmail},${a.score},${a.totalPoints},${percentage}%,${a.isPassed ? "Yes" : "No"},${a.isFlagged ? "Yes" : "No"},${a.flagReason ?? ""},${a.submittedAt}`;
    });

    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="results-test-${testId}.csv"`
    );

    return res.status(200).send(csv);
  } catch (error) {
    console.error("exportResults error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};