// src/pages/student/TakeTest.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Progress, Tag, Radio, Modal, Spin, Result } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SendOutlined,
  TrophyOutlined,
  ReloadOutlined,
  EyeOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import { RefreshButton } from "../../components/RefreshButton.jsx";

export const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("loading"); // loading | taking | submitted | error
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selectedOptionId?, answerText? } }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null); // in seconds, null = no limit
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const hasAutoSubmitted = useRef(false); // ✅ prevent double auto-submit

  // ─────────────────────────────────────────────
  // LOAD TEST ON MOUNT
  // ─────────────────────────────────────────────
  useEffect(() => {
    startOrResumeAttempt();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(autoSaveRef.current);
    };
  }, [testId]);

  // ─────────────────────────────────────────────
  // START OR RESUME ATTEMPT
  // ─────────────────────────────────────────────
  const startOrResumeAttempt = async () => {
    try {
      setPhase("loading");
      hasAutoSubmitted.current = false;

      const { data } = await axiosInstance.post(
        `/student/tests/${testId}/start`
      );

      setAttempt(data.attempt);
      setTest(data.test || {});
      setQuestions(data.questions || []);

      // ✅ Restore saved answers if resuming
      if (data.savedAnswers && data.savedAnswers.length > 0) {
        const restored = {};
        data.savedAnswers.forEach((a) => {
          restored[a.questionId] = {
            selectedOptionId: a.selectedOptionId || null,
            answerText: a.answerText || "",
          };
        });
        setAnswers(restored);
      }

      // ✅ Calculate timer from test.timeLimit
      const timeLimit = data.test?.timeLimit;

      if (timeLimit && timeLimit > 0) {
        if (
          data.message === "Resuming existing attempt" &&
          data.attempt?.startedAt
        ) {
          // ✅ RESUME: calculate remaining time based on when attempt started
          const startedAt = new Date(data.attempt.startedAt).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startedAt) / 1000);
          const totalSeconds = timeLimit * 60;
          const remaining = totalSeconds - elapsedSeconds;

          if (remaining <= 0) {
            // ✅ Time already expired while away — auto submit immediately
            setPhase("taking");
            setTimeout(() => {
              if (!hasAutoSubmitted.current) {
                hasAutoSubmitted.current = true;
                handleSubmit(true);
              }
            }, 500);
            return;
          }

          setTimeLeft(remaining);
        } else {
          // ✅ Fresh attempt — full time
          setTimeLeft(timeLimit * 60);
        }
      } else {
        setTimeLeft(null); // No time limit
      }

      setPhase("taking");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load test";
      setError(msg);
      setPhase("error");
    }
  };

  // ─────────────────────────────────────────────
  // ⏱️ COUNTDOWN TIMER
  // ─────────────────────────────────────────────
  useEffect(() => {
    // Only start timer when in taking phase and timeLeft is a valid positive number
    if (phase !== "taking" || timeLeft === null || timeLeft <= 0) return;

    // Clear any existing timer before starting a new one
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]); // ✅ Only restart when phase changes, not every tick

  // ─────────────────────────────────────────────
  // ⚡ WATCH FOR TIMER HITTING ZERO → AUTO SUBMIT
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === 0 && phase === "taking" && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      clearInterval(timerRef.current);
      clearInterval(autoSaveRef.current);
      setAutoSubmitting(true);
      handleSubmit(true);
    }
  }, [timeLeft, phase]);

  // ─────────────────────────────────────────────
  // 💾 AUTO SAVE EVERY 30 SECONDS
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "taking" || !attempt) return;

    clearInterval(autoSaveRef.current);
    autoSaveRef.current = setInterval(() => {
      saveProgress(false);
    }, 30000);

    return () => clearInterval(autoSaveRef.current);
  }, [phase, attempt, answers]);

  // ─────────────────────────────────────────────
  // FORMAT TIME mm:ss
  // ─────────────────────────────────────────────
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return "--:--";
    const totalSecs = Math.max(0, secs);
    const m = Math.floor(totalSecs / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSecs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ✅ Timer color based on urgency
  const getTimerColor = () => {
    if (timeLeft === null) return "#34d399";
    if (timeLeft < 60) return "#f87171";   // red — under 1 min
    if (timeLeft < 300) return "#f59e0b";  // amber — under 5 mins
    return "#34d399";                       // green — plenty of time
  };

  const timerColor = getTimerColor();

  // ✅ Timer percentage for circular progress (if desired)
  const getTimerPercent = () => {
    if (!test?.timeLimit || timeLeft === null) return 100;
    const total = test.timeLimit * 60;
    return Math.round((timeLeft / total) * 100);
  };

  // ─────────────────────────────────────────────
  // ANSWER HANDLER
  // ─────────────────────────────────────────────
  const handleAnswer = (questionId, value, type) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]:
        type === "short_answer"
          ? { answerText: value }
          : { selectedOptionId: value },
    }));
  };

  // ─────────────────────────────────────────────
  // SAVE PROGRESS
  // ─────────────────────────────────────────────
  const saveProgress = async (showIndicator = true) => {
    if (!attempt || Object.keys(answers).length === 0) return;
    if (showIndicator) setSaving(true);
    try {
      const payload = Object.entries(answers).map(([questionId, ans]) => ({
        questionId: Number(questionId),
        selectedOptionId: ans.selectedOptionId || null,
        answerText: ans.answerText || null,
      }));
      await axiosInstance.post(
        `/student/tests/attempts/${attempt.id}/save`,
        { answers: payload }
      );
    } catch (err) {
      console.error("Save progress error:", err);
    } finally {
      if (showIndicator) setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────
  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) setShowSubmitModal(false);
    setSubmitting(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);

    try {
      // Save latest answers first
      await saveProgress(false);

      // Submit the attempt
      await axiosInstance.post(
        `/student/tests/attempts/${attempt.id}/submit`
      );

      // Fetch results
      const { data } = await axiosInstance.get(
        `/student/tests/attempts/${attempt.id}/result`
      );

      setResult(data);
      setPhase("submitted");
      setAutoSubmitting(false);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.response?.data?.message || "Failed to submit test");
      setPhase("error");
      setAutoSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  // RETAKE
  // ─────────────────────────────────────────────
  const handleRetake = async () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setTimeLeft(null);
    hasAutoSubmitted.current = false;
    await startOrResumeAttempt();
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progressPercent =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  // ─────────────────────────────────────────────
  // PHASE: LOADING
  // ─────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div style={styles.centered}>
        <Spin size="large" />
        <p style={styles.loadingText}>Loading your test...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // PHASE: AUTO SUBMITTING
  // ─────────────────────────────────────────────
  if (autoSubmitting && phase === "taking") {
    return (
      <div style={styles.centered}>
        <div style={styles.autoSubmitBox}>
          <div style={styles.autoSubmitIcon}>⏰</div>
          <h2 style={styles.autoSubmitTitle}>Time's Up!</h2>
          <p style={styles.autoSubmitSubtitle}>
            Your test is being submitted automatically...
          </p>
          <Spin size="large" style={{ marginTop: 16 }} />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // PHASE: ERROR
  // ─────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div style={styles.centered}>
        <Result
          status="error"
          title="Could not load test"
          subTitle={error}
          extra={[
            <Button
              key="back"
              onClick={() => navigate("/student/tests")}
              style={styles.outlineBtn}
            >
              Back to Tests
            </Button>,
            <Button
              key="retry"
              type="primary"
              onClick={startOrResumeAttempt}
              style={styles.primaryBtn}
            >
              Try Again
            </Button>,
          ]}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // PHASE: SUBMITTED — RESULTS SCREEN
  // ─────────────────────────────────────────────
  if (phase === "submitted" && result) {
    const { score, totalPoints, percentage, isPassed } = result.result;
    const breakdown = result.breakdown || [];

    return (
      <div style={styles.wrapper}>
        <div style={styles.resultContainer}>

          {/* Result Hero */}
          <div
            style={{
              ...styles.resultHero,
              borderColor: isPassed
                ? "rgba(52,211,153,0.3)"
                : "rgba(248,113,113,0.3)",
              background: isPassed
                ? "linear-gradient(135deg, #0a1f18 0%, #0d1829 100%)"
                : "linear-gradient(135deg, #1f0a0a 0%, #0d1829 100%)",
            }}
          >
            <div
              style={{
                ...styles.resultIconWrap,
                background: isPassed
                  ? "rgba(52,211,153,0.15)"
                  : "rgba(248,113,113,0.15)",
              }}
            >
              {isPassed ? (
                <TrophyOutlined
                  style={{ fontSize: 40, color: "#34d399" }}
                />
              ) : (
                <ReloadOutlined
                  style={{ fontSize: 40, color: "#f87171" }}
                />
              )}
            </div>
            <h1
              style={{
                ...styles.resultTitle,
                color: isPassed ? "#34d399" : "#f87171",
              }}
            >
              {isPassed ? "Test Passed! 🎉" : "Better Luck Next Time"}
            </h1>
            <p style={styles.resultSubtitle}>
              {isPassed
                ? "Great work! You've successfully passed this test."
                : "Don't give up — review the answers and try again."}
            </p>

            {/* Score Display */}
            <div style={styles.scoreDisplay}>
              <div style={styles.scoreCircle}>
                <Progress
                  type="circle"
                  percent={Number(percentage)}
                  size={140}
                  strokeColor={
                    isPassed
                      ? { "0%": "#34d399", "100%": "#10b981" }
                      : { "0%": "#f87171", "100%": "#ef4444" }
                  }
                  trailColor="rgba(255,255,255,0.06)"
                  format={(p) => (
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 800,
                          color: isPassed ? "#34d399" : "#f87171",
                          fontFamily: "'Syne', sans-serif",
                          lineHeight: 1,
                        }}
                      >
                        {p}%
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginTop: 4,
                        }}
                      >
                        Score
                      </div>
                    </div>
                  )}
                />
              </div>
              <div style={styles.scoreStats}>
                <div style={styles.scoreStat}>
                  <span style={{ ...styles.scoreStatValue, color: "#38bdf8" }}>
                    {score}
                  </span>
                  <span style={styles.scoreStatLabel}>Points Earned</span>
                </div>
                <div style={styles.scoreStat}>
                  <span
                    style={{ ...styles.scoreStatValue, color: "#94a3b8" }}
                  >
                    {totalPoints}
                  </span>
                  <span style={styles.scoreStatLabel}>Total Points</span>
                </div>
                <div style={styles.scoreStat}>
                  <span
                    style={{
                      ...styles.scoreStatValue,
                      color: isPassed ? "#34d399" : "#f87171",
                    }}
                  >
                    {isPassed ? "PASS" : "FAIL"}
                  </span>
                  <span style={styles.scoreStatLabel}>Result</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div style={styles.breakdownSection}>
            <div style={styles.breakdownHeader}>
              <h3 style={styles.breakdownTitle}>Answer Breakdown</h3>
              <Tag
                style={{
                  background: "rgba(56,189,248,0.1)",
                  color: "#38bdf8",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                {breakdown.filter((b) => b.isCorrect).length}/
                {breakdown.length} Correct
              </Tag>
            </div>

            <div style={styles.breakdownList}>
              {breakdown.map((item, i) => (
                <div
                  key={item.questionId}
                  style={{
                    ...styles.breakdownItem,
                    borderColor: item.isCorrect
                      ? "rgba(52,211,153,0.15)"
                      : "rgba(248,113,113,0.15)",
                  }}
                >
                  <div style={styles.breakdownItemTop}>
                    <div style={styles.breakdownQNum}>Q{i + 1}</div>
                    <div style={styles.breakdownQText}>
                      {item.questionText}
                    </div>
                    <div
                      style={{
                        ...styles.breakdownPoints,
                        color: item.isCorrect ? "#34d399" : "#f87171",
                      }}
                    >
                      {item.pointsAwarded}/{item.points}pts
                    </div>
                  </div>

                  <div style={styles.breakdownAnswers}>
                    <div style={styles.breakdownAnswer}>
                      <span style={styles.breakdownAnswerLabel}>
                        Your answer:
                      </span>
                      <span
                        style={{
                          ...styles.breakdownAnswerValue,
                          color: item.isCorrect ? "#34d399" : "#f87171",
                        }}
                      >
                        {item.isCorrect ? (
                          <CheckCircleOutlined
                            style={{ marginRight: 4 }}
                          />
                        ) : (
                          <span style={{ marginRight: 4 }}>✗</span>
                        )}
                        {item.yourAnswer || "Not answered"}
                      </span>
                    </div>
                    {!item.isCorrect && item.correctAnswer && (
                      <div style={styles.breakdownAnswer}>
                        <span style={styles.breakdownAnswerLabel}>
                          Correct answer:
                        </span>
                        <span
                          style={{
                            ...styles.breakdownAnswerValue,
                            color: "#34d399",
                          }}
                        >
                          <CheckCircleOutlined
                            style={{ marginRight: 4 }}
                          />
                          {item.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.resultActions}>
            <Button
              onClick={() => navigate("/student/dashboard")}
              style={styles.outlineBtn}
              icon={<ArrowLeftOutlined />}
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => navigate("/student/tests")}
              style={styles.outlineBtn}
              icon={<EyeOutlined />}
            >
              Browse Tests
            </Button>
            <Button
              onClick={handleRetake}
              style={styles.primaryBtn}
              icon={<ReloadOutlined />}
            >
              Retake Test
            </Button>
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // PHASE: TAKING — MAIN TEST UI
  // ─────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>

      {/* ── TOP BAR */}
      <div style={styles.topBar}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            saveProgress();
            navigate("/student/tests");
          }}
          style={styles.backBtn}
          size="small"
        >
          Save & Exit
        </Button>

        <div style={styles.topBarCenter}>
          <span style={styles.testTitle}>{test?.title || "Test"}</span>
          <Tag
            style={{
              background: "rgba(56,189,248,0.1)",
              color: "#38bdf8",
              border: "none",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Q{currentIndex + 1} of {totalQuestions}
          </Tag>
        </div>

        <div style={styles.topBarRight}>
          {/* ✅ TIMER DISPLAY */}
          {timeLeft !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 16px",
                borderRadius: 20,
                border: `1px solid ${timerColor}60`,
                color: timerColor,
                fontWeight: 800,
                fontSize: 16,
                fontFamily: "'Syne', sans-serif",
                background: `${timerColor}12`,
                transition: "all 0.3s",
                animation: timeLeft < 60 ? "timerPulse 1s infinite" : "none",
                minWidth: 90,
                justifyContent: "center",
              }}
            >
              <ClockCircleOutlined style={{ fontSize: 14 }} />
              <span style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.5px" }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {saving && (
            <span style={styles.savingText}>Saving...</span>
          )}
        </div>
      </div>

      {/* ✅ WARNING BANNER — shows when under 5 minutes */}
      {timeLeft !== null && timeLeft > 0 && timeLeft <= 300 && phase === "taking" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 24px",
            background: timeLeft < 60
              ? "rgba(248,113,113,0.1)"
              : "rgba(245,158,11,0.08)",
            borderBottom: `1px solid ${timeLeft < 60
              ? "rgba(248,113,113,0.25)"
              : "rgba(245,158,11,0.2)"}`,
            color: timeLeft < 60 ? "#f87171" : "#f59e0b",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <WarningOutlined />
          {timeLeft < 60
            ? `⚠️ Less than 1 minute remaining! The test will submit automatically when time runs out.`
            : `⏰ ${Math.ceil(timeLeft / 60)} minute${Math.ceil(timeLeft / 60) !== 1 ? "s" : ""} remaining — please wrap up your answers.`
          }
        </div>
      )}

      {/* ── PROGRESS BAR */}
      <div style={styles.progressWrap}>
        <Progress
          percent={progressPercent}
          showInfo={false}
          strokeColor="linear-gradient(90deg, #38bdf8, #818cf8)"
          trailColor="rgba(255,255,255,0.04)"
          size={["100%", 4]}
        />
        <span style={styles.progressText}>
          {answeredCount}/{totalQuestions} answered
        </span>
      </div>

      <div style={styles.testLayout}>

        {/* ── QUESTION NAVIGATOR */}
        <aside style={styles.questionNav}>
          <p style={styles.questionNavTitle}>Questions</p>
          <div style={styles.questionNavGrid}>
            {questions.map((q, i) => {
              const qId = q.question?.id || q.id || q;
              const answered = !!answers[qId];
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    ...styles.questionNavBtn,
                    background: isCurrent
                      ? "#38bdf8"
                      : answered
                      ? "rgba(52,211,153,0.2)"
                      : "rgba(255,255,255,0.04)",
                    color: isCurrent
                      ? "#0f172a"
                      : answered
                      ? "#34d399"
                      : "#64748b",
                    border: isCurrent
                      ? "none"
                      : answered
                      ? "1px solid rgba(52,211,153,0.3)"
                      : "1px solid rgba(255,255,255,0.06)",
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Timer in sidebar too */}
          {timeLeft !== null && (
            <div style={styles.sidebarTimer}>
              <div style={styles.sidebarTimerLabel}>Time Left</div>
              <div
                style={{
                  ...styles.sidebarTimerValue,
                  color: timerColor,
                }}
              >
                {formatTime(timeLeft)}
              </div>
              {/* ✅ Timer progress bar in sidebar */}
              <Progress
                percent={getTimerPercent()}
                showInfo={false}
                strokeColor={timerColor}
                trailColor="rgba(255,255,255,0.06)"
                size={["100%", 6]}
                style={{ marginTop: 6 }}
              />
            </div>
          )}

          <div style={styles.questionNavLegend}>
            <div style={styles.legendRow}>
              <span
                style={{ ...styles.legendDot, background: "#38bdf8" }}
              />{" "}
              Current
            </div>
            <div style={styles.legendRow}>
              <span
                style={{
                  ...styles.legendDot,
                  background: "rgba(52,211,153,0.5)",
                }}
              />{" "}
              Answered
            </div>
            <div style={styles.legendRow}>
              <span
                style={{
                  ...styles.legendDot,
                  background: "rgba(255,255,255,0.1)",
                }}
              />{" "}
              Unanswered
            </div>
          </div>

          <Button
            block
            onClick={() => saveProgress(true)}
            loading={saving}
            style={styles.saveBtn}
            size="small"
          >
            Save Progress
          </Button>
        </aside>

        {/* ── QUESTION PANEL */}
        <div style={styles.questionPanel}>
          {currentQuestion &&
            (() => {
              const q =
                currentQuestion.question ||
                currentQuestion;
              const qId = q.id;
              const currentAnswer = answers[qId];

              return (
                <div style={styles.questionCard}>
                  {/* Question header */}
                  <div style={styles.questionHeader}>
                    <div style={styles.questionMeta}>
                      <Tag
                        style={{
                          background:
                            "rgba(167,139,250,0.1)",
                          color: "#a78bfa",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {q.type?.replace("_", " ")}
                      </Tag>
                      <span style={styles.questionPoints}>
                        {q.points} pt
                        {q.points !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={styles.questionNumber}>
                      Question {currentIndex + 1}
                    </div>
                  </div>

                  {/* Question text */}
                  <h2 style={styles.questionText}>{q.text}</h2>

                  {/* ── MULTIPLE CHOICE */}
                  {q.type === "multiple_choice" && (
                    <div style={styles.optionsList}>
                      {(q.options || []).map((opt) => {
                        const isSelected =
                          currentAnswer?.selectedOptionId ===
                          opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() =>
                              handleAnswer(
                                qId,
                                opt.id,
                                "multiple_choice"
                              )
                            }
                            style={{
                              ...styles.optionItem,
                              background: isSelected
                                ? "rgba(56,189,248,0.1)"
                                : "rgba(255,255,255,0.02)",
                              border: isSelected
                                ? "1px solid rgba(56,189,248,0.5)"
                                : "1px solid rgba(255,255,255,0.06)",
                              transform: isSelected
                                ? "translateX(4px)"
                                : "none",
                            }}
                          >
                            <div
                              style={{
                                ...styles.optionRadio,
                                borderColor: isSelected
                                  ? "#38bdf8"
                                  : "#475569",
                                background: isSelected
                                  ? "#38bdf8"
                                  : "transparent",
                              }}
                            >
                              {isSelected && (
                                <div
                                  style={styles.optionRadioDot}
                                />
                              )}
                            </div>
                            <span
                              style={{
                                ...styles.optionText,
                                color: isSelected
                                  ? "#f1f5f9"
                                  : "#94a3b8",
                              }}
                            >
                              {opt.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── TRUE / FALSE */}
                  {q.type === "true_false" && (
                    <div style={styles.tfOptions}>
                      {(q.options || []).map((opt) => {
                        const isSelected =
                          currentAnswer?.selectedOptionId ===
                          opt.id;
                        const isTrue =
                          opt.text?.toLowerCase() === "true";
                        return (
                          <div
                            key={opt.id}
                            onClick={() =>
                              handleAnswer(
                                qId,
                                opt.id,
                                "true_false"
                              )
                            }
                            style={{
                              ...styles.tfOption,
                              background: isSelected
                                ? isTrue
                                  ? "rgba(52,211,153,0.15)"
                                  : "rgba(248,113,113,0.15)"
                                : "rgba(255,255,255,0.02)",
                              border: isSelected
                                ? isTrue
                                  ? "2px solid rgba(52,211,153,0.5)"
                                  : "2px solid rgba(248,113,113,0.5)"
                                : "2px solid rgba(255,255,255,0.06)",
                              color: isSelected
                                ? isTrue
                                  ? "#34d399"
                                  : "#f87171"
                                : "#64748b",
                            }}
                          >
                            <span style={styles.tfIcon}>
                              {isTrue ? "✓" : "✗"}
                            </span>
                            <span style={styles.tfText}>
                              {opt.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── SHORT ANSWER */}
                  {q.type === "short_answer" && (
                    <div style={styles.shortAnswerWrap}>
                      <textarea
                        placeholder="Type your answer here..."
                        value={
                          currentAnswer?.answerText || ""
                        }
                        onChange={(e) =>
                          handleAnswer(
                            qId,
                            e.target.value,
                            "short_answer"
                          )
                        }
                        style={styles.shortAnswerInput}
                        rows={5}
                      />
                      <span style={styles.shortAnswerHint}>
                        {currentAnswer?.answerText?.length || 0}{" "}
                        characters
                      </span>
                    </div>
                  )}

                  {/* ── NAVIGATION BUTTONS */}
                  <div style={styles.questionFooter}>
                    <Button
                      icon={<ArrowLeftOutlined />}
                      disabled={currentIndex === 0}
                      onClick={() =>
                        setCurrentIndex((p) => p - 1)
                      }
                      style={styles.navBtn}
                    >
                      Previous
                    </Button>

                    <Button
                      onClick={() =>
                        setCurrentIndex((p) => p + 1)
                      }
                      disabled={
                        currentIndex === totalQuestions - 1
                      }
                      style={styles.navBtn}
                      icon={<ArrowRightOutlined />}
                      iconPosition="end"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              );
            })()}

          {/* ── SUBMIT BUTTON */}
          <Button
            block
            size="large"
            onClick={() => setShowSubmitModal(true)}
            loading={submitting}
            style={styles.submitBtn}
            icon={<SendOutlined />}
          >
            Submit Test ({answeredCount}/{totalQuestions} answered)
          </Button>
        </div>
      </div>

      {/* ── SUBMIT CONFIRMATION MODAL */}
      <Modal
        open={showSubmitModal}
        onCancel={() => setShowSubmitModal(false)}
        footer={null}
        centered
        styles={{
          content: {
            background: "#0d1829",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
          },
          mask: { backdropFilter: "blur(4px)" },
        }}
        title={null}
        closable={false}
      >
        <div style={styles.modalContent}>
          <div style={styles.modalIcon}>📋</div>
          <h3 style={styles.modalTitle}>Submit Test?</h3>
          <p style={styles.modalSubtitle}>
            You have answered{" "}
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>
              {answeredCount}
            </span>{" "}
            out of{" "}
            <span style={{ color: "#f1f5f9", fontWeight: 700 }}>
              {totalQuestions}
            </span>{" "}
            questions.
          </p>

          {/* ✅ Show time remaining in modal */}
          {timeLeft !== null && (
            <div
              style={{
                background: timeLeft < 300
                  ? "rgba(245,158,11,0.08)"
                  : "rgba(52,211,153,0.08)",
                border: `1px solid ${timeLeft < 300
                  ? "rgba(245,158,11,0.2)"
                  : "rgba(52,211,153,0.2)"}`,
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 13,
                color: timeLeft < 300 ? "#f59e0b" : "#34d399",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
              }}
            >
              <ClockCircleOutlined />
              Time remaining: {formatTime(timeLeft)}
            </div>
          )}

          {answeredCount < totalQuestions && (
            <div style={styles.modalWarning}>
              ⚠️ You have {totalQuestions - answeredCount} unanswered
              question
              {totalQuestions - answeredCount !== 1 ? "s" : ""}. They
              will be marked as 0.
            </div>
          )}
          <div style={styles.modalActions}>
            <Button
              onClick={() => setShowSubmitModal(false)}
              style={styles.outlineBtn}
            >
              Keep Reviewing
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              loading={submitting}
              style={styles.primaryBtn}
              icon={<SendOutlined />}
            >
              Submit Now
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        textarea:focus {
          outline: none;
          border-color: rgba(56,189,248,0.5) !important;
        }

        .ant-progress-bg {
          background: linear-gradient(90deg, #38bdf8, #818cf8) !important;
        }

        /* ✅ Pulse animation for urgent timer */
        @keyframes timerPulse {
          0%   { opacity: 1; transform: scale(1); }
          50%  { opacity: 0.75; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#060d18",
    fontFamily: "'DM Sans', sans-serif",
  },
  centered: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#060d18",
    gap: 16,
  },
  loadingText: { color: "#64748b", fontSize: 14, marginTop: 12 },

  // ── AUTO SUBMIT SCREEN
  autoSubmitBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    background: "#0d1829",
    border: "1px solid rgba(248,113,113,0.25)",
    borderRadius: 20,
    padding: "48px 40px",
    maxWidth: 400,
    width: "90%",
    textAlign: "center",
  },
  autoSubmitIcon: { fontSize: 56 },
  autoSubmitTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#f87171",
    margin: 0,
    fontFamily: "'Syne', sans-serif",
  },
  autoSubmitSubtitle: { fontSize: 14, color: "#64748b", margin: 0 },

  // ── TOP BAR
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 60,
    background: "#080f1a",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    gap: 12,
  },
  backBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
    borderRadius: 8,
  },
  topBarCenter: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
    justifyContent: "center",
  },
  testTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#f1f5f9",
    fontFamily: "'Syne', sans-serif",
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 130,
    justifyContent: "flex-end",
  },
  savingText: { fontSize: 11, color: "#475569" },

  // ── PROGRESS
  progressWrap: {
    padding: "8px 24px",
    background: "#080f1a",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  progressText: { fontSize: 11, color: "#475569", whiteSpace: "nowrap" },

  // ── LAYOUT
  testLayout: {
    display: "flex",
    gap: 0,
    minHeight: "calc(100vh - 108px)",
  },

  // ── QUESTION NAVIGATOR
  questionNav: {
    width: 200,
    background: "#080f1a",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    position: "sticky",
    top: 108,
    height: "calc(100vh - 108px)",
    overflowY: "auto",
    flexShrink: 0,
  },
  questionNavTitle: {
    color: "#475569",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: 0,
  },
  questionNavGrid: { display: "flex", flexWrap: "wrap", gap: 6 },
  questionNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // ✅ Timer in sidebar
  sidebarTimer: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "12px 14px",
  },
  sidebarTimerLabel: {
    fontSize: 10,
    color: "#475569",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 4,
  },
  sidebarTimerValue: {
    fontSize: 22,
    fontWeight: 800,
    fontFamily: "'Syne', sans-serif",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },

  questionNavLegend: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: "#475569",
  },
  legendDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  saveBtn: {
    background: "rgba(56,189,248,0.08)",
    border: "1px solid rgba(56,189,248,0.2)",
    color: "#38bdf8",
    borderRadius: 8,
    marginTop: "auto",
  },

  // ── QUESTION PANEL
  questionPanel: {
    flex: 1,
    padding: "28px 32px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    overflowY: "auto",
  },
  questionCard: {
    background: "#0d1829",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: "28px",
    flex: 1,
  },
  questionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  questionMeta: { display: "flex", alignItems: "center", gap: 10 },
  questionPoints: { fontSize: 12, color: "#475569", fontWeight: 600 },
  questionNumber: { fontSize: 12, color: "#334155", fontWeight: 500 },
  questionText: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f1f5f9",
    lineHeight: 1.5,
    margin: "0 0 28px",
    fontFamily: "'Syne', sans-serif",
  },

  // ── OPTIONS
  optionsList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 32,
  },
  optionItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.15s",
  },
  optionRadioDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#0f172a",
  },
  optionText: { fontSize: 15, lineHeight: 1.4, transition: "color 0.15s" },

  // ── TRUE FALSE
  tfOptions: { display: "flex", gap: 16, marginBottom: 32 },
  tfOption: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "24px",
    borderRadius: 16,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  tfIcon: { fontSize: 32, fontWeight: 700 },
  tfText: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
  },

  // ── SHORT ANSWER
  shortAnswerWrap: {
    marginBottom: 32,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  shortAnswerInput: {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "#f1f5f9",
    fontSize: 15,
    padding: "14px 16px",
    resize: "vertical",
    transition: "border-color 0.15s",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.6,
  },
  shortAnswerHint: {
    fontSize: 11,
    color: "#334155",
    alignSelf: "flex-end",
  },

  // ── QUESTION FOOTER
  questionFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  navBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
    borderRadius: 10,
    height: 40,
    padding: "0 20px",
  },

  // ── SUBMIT BUTTON
  submitBtn: {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    border: "none",
    borderRadius: 14,
    fontWeight: 700,
    height: 52,
    fontSize: 15,
    boxShadow: "0 4px 20px rgba(14,165,233,0.3)",
    fontFamily: "'Syne', sans-serif",
  },

  // ── MODAL
  modalContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "8px 0",
  },
  modalIcon: { fontSize: 44 },
  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#f1f5f9",
    margin: 0,
    fontFamily: "'Syne', sans-serif",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    margin: 0,
  },
  modalWarning: {
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 13,
    color: "#f59e0b",
    textAlign: "center",
    width: "100%",
  },
  modalActions: { display: "flex", gap: 10, width: "100%", marginTop: 4 },

  // ── RESULT SCREEN
  resultContainer: {
    maxWidth: 780,
    margin: "0 auto",
    padding: "32px 24px 60px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  resultHero: {
    border: "2px solid",
    borderRadius: 20,
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  resultIconWrap: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 800,
    margin: 0,
    fontFamily: "'Syne', sans-serif",
  },
  resultSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    margin: 0,
  },
  scoreDisplay: {
    display: "flex",
    alignItems: "center",
    gap: 40,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8,
  },
  scoreCircle: {},
  scoreStats: { display: "flex", gap: 32 },
  scoreStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  scoreStatValue: {
    fontSize: 26,
    fontWeight: 800,
    fontFamily: "'Syne', sans-serif",
    lineHeight: 1,
  },
  scoreStatLabel: { fontSize: 11, color: "#475569" },

  // ── BREAKDOWN
  breakdownSection: {
    background: "#0d1829",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: "24px",
  },
  breakdownHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
    fontFamily: "'Syne', sans-serif",
  },
  breakdownList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  breakdownItem: {
    border: "1px solid",
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  breakdownItemTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  breakdownQNum: {
    background: "rgba(255,255,255,0.06)",
    color: "#64748b",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  breakdownQText: {
    flex: 1,
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 1.4,
  },
  breakdownPoints: {
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  breakdownAnswers: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    paddingLeft: 36,
  },
  breakdownAnswer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  breakdownAnswerLabel: {
    fontSize: 11,
    color: "#475569",
    fontWeight: 600,
  },
  breakdownAnswerValue: {
    fontSize: 12,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
  },

  // ── RESULT ACTIONS
  resultActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  // ── SHARED BUTTONS
  outlineBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#94a3b8",
    borderRadius: 10,
    height: 40,
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontWeight: 700,
    height: 40,
    boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
  },
};
