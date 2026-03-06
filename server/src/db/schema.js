import {
  pgTable,
  text,
  timestamp,
  serial, 
  integer, 
  boolean, 
  pgEnum
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionTypeEnum = pgEnum("question_type", ["multiple_choice", "true_false", "short_answer"]);
export const testStatusEnum = pgEnum("test_status", ["draft", "published", "archived"]);

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  timeLimit: integer("time_limit"), // in minutes, null = no limit
  maxAttempts: integer("max_attempts").default(1),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: testStatusEnum("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const questionBanks = pgTable("question_banks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  bankId: integer("bank_id").references(() => questionBanks.id, { onDelete: "cascade" }),
  type: questionTypeEnum("type").notNull(),
  text: text("text").notNull(),
  points: integer("points").default(1),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionOptions = pgTable("question_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").default(false),
});

export const testQuestions = pgTable("test_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }), // 👈 add this
  order: integer("order").notNull(),
});

export const attemptStatusEnum = pgEnum("attempt_status", ["in_progress", "submitted"]);

export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: attemptStatusEnum("status").default("in_progress"),
  score: integer("score"),
  totalPoints: integer("total_points"),
  isPassed: boolean("is_passed"),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
});

export const attemptAnswers = pgTable("attempt_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => testAttempts.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questions.id),
  selectedOptionId: integer("selected_option_id").references(() => questionOptions.id), // for multiple_choice & true_false
  answerText: text("answer_text"), // for short_answer
  isCorrect: boolean("is_correct"),
  pointsAwarded: integer("points_awarded").default(0),
});