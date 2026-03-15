// src/pages/teacher/CreateTest.jsx
import { useState } from "react";
import {
  Form, Input, InputNumber, DatePicker, Button,
  Avatar, Drawer, Steps, message, Tag, Select,
  Divider,
} from "antd";
import {
  BookOutlined, PlusOutlined, BarChartOutlined,
  FlagOutlined, SettingOutlined, HomeOutlined,
  LogoutOutlined, MenuOutlined, ArrowRightOutlined,
  ArrowLeftOutlined, CheckCircleOutlined, TeamOutlined,
  FileTextOutlined, ClockCircleOutlined, TrophyOutlined,
  SendOutlined, SaveOutlined, DeleteOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
    { icon: <HomeOutlined />, label: "Dashboard", path: "/teacher/dashboard" },
    { icon: <BookOutlined />, label: "My Tests", path: "/teacher/tests" },
    { icon: <PlusOutlined />, label: "Create Test", path: "/teacher/tests/create" },
    { icon: <BarChartOutlined />, label: "Results", path: "/teacher/results" },
    { icon: <TrophyOutlined />, label: "Leaderboard", path: "/teacher/leaderboard" },
    { icon: <FlagOutlined />, label: "Flagged", path: "/teacher/flagged" },
    { icon: <SettingOutlined />, label: "Settings", path: "/teacher/settings" },
];

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useState(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
};

export const CreateTest = () => {
  const [step, setStep] = useState(0);
  const [testForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createdTestId, setCreatedTestId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    type: "multiple_choice",
    text: "",
    points: 1,
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  });
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ── STEP 1: Save Test Details
  const handleSaveDetails = async (values) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        timeLimit: values.timeLimit,
        maxAttempts: values.maxAttempts,
        passMarkPercent: values.passMarkPercent,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      };
      const { data } = await axiosInstance.post("/tests", payload);
      setCreatedTestId(data.test.id);
      messageApi.success("Test details saved!");
      setStep(1);
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Failed to save test");
    } finally {
      setSaving(false);
    }
  };

  // ── STEP 2: Add Question
  const handleAddQuestion = async () => {
    if (!currentQuestion.text.trim()) {
      messageApi.error("Question text is required");
      return;
    }
    if (
      (currentQuestion.type === "multiple_choice" || currentQuestion.type === "true_false") &&
      !currentQuestion.options.some((o) => o.isCorrect)
    ) {
      messageApi.error("At least one correct answer is required");
      return;
    }
    if (
      currentQuestion.type === "multiple_choice" &&
      currentQuestion.options.filter((o) => o.text.trim()).length < 2
    ) {
      messageApi.error("At least 2 options are required");
      return;
    }

    try {
      const payload = {
        type: currentQuestion.type,
        text: currentQuestion.text,
        points: currentQuestion.points,
        options:
          currentQuestion.type === "short_answer"
            ? []
            : currentQuestion.options.filter((o) => o.text.trim()),
      };
      const { data } = await axiosInstance.post("/tests/questions", payload);
      const questionId = data.question.id;

      // Link question to test
      await axiosInstance.post(`/tests/${createdTestId}/questions`, {
        questionIds: [{ questionId, order: questions.length + 1 }],
      });

      setQuestions((prev) => [...prev, { ...currentQuestion, id: questionId }]);
      messageApi.success("Question added!");

      // Reset for next question
      setCurrentQuestion({
        type: "multiple_choice",
        text: "",
        points: 1,
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      });
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Failed to add question");
    }
  };

  const handleRemoveQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // ── STEP 3: Publish
  const handlePublish = async () => {
    if (questions.length === 0) {
      messageApi.error("Add at least one question before publishing");
      return;
    }
    setPublishing(true);
    try {
      await axiosInstance.patch(`/tests/${createdTestId}/publish`);
      messageApi.success("Test published successfully!");
      setTimeout(() => navigate("/teacher/tests"), 1500);
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Failed to publish test");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    messageApi.success("Test saved as draft");
    navigate("/teacher/tests");
  };

  const updateOption = (index, field, value) => {
    setCurrentQuestion((prev) => {
      const opts = [...prev.options];
      if (field === "isCorrect" && prev.type === "multiple_choice") {
        // Allow multiple correct for MC or single — toggle
        opts[index] = { ...opts[index], isCorrect: value };
      } else if (field === "isCorrect" && prev.type === "true_false") {
        // Only one can be correct for T/F
        opts.forEach((o, i) => (opts[i] = { ...o, isCorrect: i === index ? value : false }));
      } else {
        opts[index] = { ...opts[index], [field]: value };
      }
      return { ...prev, options: opts };
    });
  };

  const SidebarContent = () => (
    <>
      <div style={styles.sidebarLogo}>
        <span>📝</span>
        <span style={styles.logoText}>ExamFlow</span>
      </div>
      <div style={styles.sidebarProfile}>
        <Avatar style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff", fontWeight: 700, fontSize: 18 }} size={52}>
          {user?.name?.[0]?.toUpperCase() || "T"}
        </Avatar>
        <div style={styles.sidebarProfileName}>{user?.name || "Teacher"}</div>
        <div style={styles.sidebarProfileBadge}><TeamOutlined style={{ fontSize: 10 }} /> Teacher</div>
      </div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div key={item.label} onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}>
              <span style={{ fontSize: 15, color: isActive ? "#f59e0b" : "#64748b" }}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <div style={styles.navActiveBar} />}
            </div>
          );
        })}
      </nav>
      <div style={styles.sidebarFooter}>
        <Button icon={<LogoutOutlined />} onClick={handleLogout} style={styles.logoutBtn} size="small" block>Sign Out</Button>
      </div>
    </>
  );

  return (
    <div style={styles.wrapper}>
      {contextHolder}
      {!isMobile && <aside style={{ ...styles.sidebar, width: isTablet ? 200 : 240 }}><SidebarContent /></aside>}
      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} placement="left" width={260}
        styles={{ body: { padding: 0, background: "#080f1a" }, header: { display: "none" } }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px 0" }}><SidebarContent /></div>
      </Drawer>

      <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240 }}>

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            {isMobile && <Button icon={<MenuOutlined />} onClick={() => setMobileMenuOpen(true)} style={styles.menuBtn} />}
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/teacher/tests")} style={styles.backBtn} size="small">
              {!isMobile && "My Tests"}
            </Button>
            <div>
              <div style={styles.breadcrumb}>
                <span style={styles.breadcrumbRoot}>My Tests</span>
                <span style={styles.breadcrumbSep}>/</span>
                <span style={styles.breadcrumbCurrent}>Create Test</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 15 : 18 }}>Create New Test</h1>
            </div>
          </div>
        </header>

        <div style={{ padding: isMobile ? "16px" : "28px 32px 40px", maxWidth: 860, margin: "0 auto" }}>

          {/* Steps */}
          <Steps
            current={step}
            style={{ marginBottom: 32 }}
            items={[
              { title: <span style={{ color: step >= 0 ? "#f59e0b" : "#475569", fontSize: 13 }}>Test Details</span>, icon: <FileTextOutlined style={{ color: step >= 0 ? "#f59e0b" : "#475569" }} /> },
              { title: <span style={{ color: step >= 1 ? "#f59e0b" : "#475569", fontSize: 13 }}>Add Questions</span>, icon: <BookOutlined style={{ color: step >= 1 ? "#f59e0b" : "#475569" }} /> },
              { title: <span style={{ color: step >= 2 ? "#f59e0b" : "#475569", fontSize: 13 }}>Publish</span>, icon: <SendOutlined style={{ color: step >= 2 ? "#f59e0b" : "#475569" }} /> },
            ]}
          />

          {/* ── STEP 0: TEST DETAILS */}
          {step === 0 && (
            <div style={styles.stepCard}>
              <h3 style={styles.stepTitle}>Test Details</h3>
              <p style={styles.stepSubtitle}>Fill in the basic information for your test</p>

              <Form form={testForm} layout="vertical" onFinish={handleSaveDetails} size="large">
                <Form.Item name="title" label={<span style={styles.formLabel}>Test Title *</span>}
                  rules={[{ required: true, message: "Title is required" }]}>
                  <Input placeholder="e.g. Midterm Exam 2024" style={styles.input} />
                </Form.Item>

                <Form.Item name="description" label={<span style={styles.formLabel}>Description</span>}>
                  <Input.TextArea placeholder="Briefly describe what this test covers..." rows={3} style={{ ...styles.input, height: "auto" }} />
                </Form.Item>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                  <Form.Item name="timeLimit" label={<span style={styles.formLabel}>Time Limit (minutes)</span>}>
                    <InputNumber placeholder="e.g. 60" min={1} style={{ ...styles.input, width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="maxAttempts" label={<span style={styles.formLabel}>Max Attempts</span>}
                    initialValue={1}>
                    <InputNumber placeholder="e.g. 1" min={1} style={{ ...styles.input, width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="passMarkPercent" label={<span style={styles.formLabel}>Pass Mark (%)</span>}
                    initialValue={50}>
                    <InputNumber placeholder="e.g. 50" min={1} max={100} style={{ ...styles.input, width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="startDate" label={<span style={styles.formLabel}>Start Date</span>}>
                    <DatePicker showTime style={{ ...styles.input, width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="endDate" label={<span style={styles.formLabel}>End Date</span>}>
                    <DatePicker showTime style={{ ...styles.input, width: "100%" }} />
                  </Form.Item>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <Button type="primary" htmlType="submit" loading={saving} style={styles.primaryBtn} icon={<ArrowRightOutlined />} iconPosition="end">
                    Save & Continue
                  </Button>
                </div>
              </Form>
            </div>
          )}

          {/* ── STEP 1: ADD QUESTIONS */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Questions Added */}
              {questions.length > 0 && (
                <div style={styles.stepCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ ...styles.stepTitle, margin: 0 }}>
                      Added Questions
                      <Tag style={{ marginLeft: 10, background: "rgba(52,211,153,0.15)", color: "#34d399", border: "none", borderRadius: 6, fontSize: 11 }}>
                        {questions.length}
                      </Tag>
                    </h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {questions.map((q, i) => (
                      <div key={i} style={styles.questionRow}>
                        <div style={styles.questionRowNum}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.text}</div>
                          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
                            {q.type.replace("_", " ")} · {q.points} pt{q.points !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <Tag style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "none", borderRadius: 6, fontSize: 10, textTransform: "uppercase" }}>
                          {q.type.replace("_", " ")}
                        </Tag>
                        <Button size="small" icon={<DeleteOutlined />}
                          onClick={() => handleRemoveQuestion(i)}
                          style={{ background: "rgba(248,113,113,0.1)", border: "none", color: "#f87171", borderRadius: 6 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Question */}
              <div style={styles.stepCard}>
                <h3 style={styles.stepTitle}>Add a Question</h3>

                {/* Question Type */}
                <div style={{ marginBottom: 16 }}>
                  <label style={styles.formLabel}>Question Type</label>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {[
                      { value: "multiple_choice", label: "Multiple Choice" },
                      { value: "true_false", label: "True / False" },
                      { value: "short_answer", label: "Short Answer" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          const opts = type.value === "true_false"
                            ? [{ text: "True", isCorrect: false }, { text: "False", isCorrect: false }]
                            : type.value === "multiple_choice"
                            ? [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }]
                            : [];
                          setCurrentQuestion((p) => ({ ...p, type: type.value, options: opts }));
                        }}
                        style={{
                          padding: "8px 16px", borderRadius: 20, cursor: "pointer",
                          background: currentQuestion.type === type.value ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                          border: currentQuestion.type === type.value ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          color: currentQuestion.type === type.value ? "#f59e0b" : "#64748b",
                          fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Text */}
                <div style={{ marginBottom: 16 }}>
                  <label style={styles.formLabel}>Question Text *</label>
                  <Input.TextArea
                    value={currentQuestion.text}
                    onChange={(e) => setCurrentQuestion((p) => ({ ...p, text: e.target.value }))}
                    placeholder="Type your question here..."
                    rows={3}
                    style={{ ...styles.input, marginTop: 8, height: "auto" }}
                  />
                </div>

                {/* Points */}
                <div style={{ marginBottom: 20 }}>
                  <label style={styles.formLabel}>Points</label>
                  <InputNumber
                    value={currentQuestion.points}
                    onChange={(val) => setCurrentQuestion((p) => ({ ...p, points: val }))}
                    min={1} style={{ ...styles.input, marginTop: 8, width: 100 }}
                  />
                </div>

                {/* Options for MC */}
                {currentQuestion.type === "multiple_choice" && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={styles.formLabel}>Answer Options (check the correct one)</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      {currentQuestion.options.map((opt, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            onClick={() => updateOption(i, "isCorrect", !opt.isCorrect)}
                            style={{
                              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                              border: `2px solid ${opt.isCorrect ? "#34d399" : "#334155"}`,
                              background: opt.isCorrect ? "#34d399" : "transparent",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            {opt.isCorrect && <span style={{ color: "#0f172a", fontSize: 12, fontWeight: 700 }}>✓</span>}
                          </button>
                          <Input
                            value={opt.text}
                            onChange={(e) => updateOption(i, "text", e.target.value)}
                            placeholder={`Option ${i + 1}`}
                            style={styles.input}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options for T/F */}
                {currentQuestion.type === "true_false" && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={styles.formLabel}>Select the correct answer</label>
                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      {currentQuestion.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => updateOption(i, "isCorrect", true)}
                          style={{
                            flex: 1, padding: "14px", borderRadius: 12, cursor: "pointer",
                            background: opt.isCorrect ? (opt.text === "True" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)") : "rgba(255,255,255,0.03)",
                            border: `2px solid ${opt.isCorrect ? (opt.text === "True" ? "rgba(52,211,153,0.5)" : "rgba(248,113,113,0.5)") : "rgba(255,255,255,0.08)"}`,
                            color: opt.isCorrect ? (opt.text === "True" ? "#34d399" : "#f87171") : "#64748b",
                            fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif",
                          }}
                        >
                          {opt.text === "True" ? "✓ True" : "✗ False"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Short Answer hint */}
                {currentQuestion.type === "short_answer" && (
                  <div style={{ marginBottom: 20, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 12, padding: "12px 16px" }}>
                    <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                      💡 Short answer questions are auto-graded by exact text match. Students will type their answer in a text box.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleAddQuestion}
                  style={styles.primaryBtn}
                  icon={<PlusOutlined />}
                >
                  Add Question
                </Button>
              </div>

              {/* Step Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <Button onClick={() => setStep(0)} icon={<ArrowLeftOutlined />} style={styles.outlineBtn}>
                  Back
                </Button>
                <div style={{ display: "flex", gap: 10 }}>
                  <Button onClick={handleSaveDraft} style={styles.outlineBtn} icon={<SaveOutlined />}>
                    Save Draft
                  </Button>
                  <Button
                    onClick={() => {
                      if (questions.length === 0) { messageApi.error("Add at least one question"); return; }
                      setStep(2);
                    }}
                    style={styles.primaryBtn}
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: PUBLISH */}
          {step === 2 && (
            <div style={styles.stepCard}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0 28px", gap: 12 }}>
                <div style={{ fontSize: 56 }}>🎉</div>
                <h2 style={{ ...styles.stepTitle, fontSize: 22, textAlign: "center" }}>Ready to Publish?</h2>
                <p style={{ color: "#64748b", fontSize: 14, textAlign: "center", maxWidth: 400, margin: 0 }}>
                  Review your test summary below before publishing. Once published, students will be able to see and attempt it.
                </p>
              </div>

              {/* Summary */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
                {[
                  { label: "Questions", value: questions.length, icon: "📋", color: "#38bdf8" },
                  { label: "Total Points", value: questions.reduce((s, q) => s + (q.points || 0), 0), icon: "⭐", color: "#f59e0b" },
                  { label: "Question Types", value: [...new Set(questions.map((q) => q.type))].length, icon: "🔢", color: "#a78bfa" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: item.color, fontFamily: "'Syne', sans-serif" }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Question list preview */}
              <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "16px", marginBottom: 24 }}>
                <p style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                  Questions Preview
                </p>
                {questions.map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < questions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ color: "#475569", fontSize: 12, fontWeight: 700, minWidth: 20 }}>Q{i + 1}</span>
                    <span style={{ flex: 1, color: "#94a3b8", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.text}</span>
                    <Tag style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "none", borderRadius: 4, fontSize: 10 }}>
                      {q.type.replace("_", " ")}
                    </Tag>
                    <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>{q.points}pt</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button onClick={() => setStep(1)} icon={<ArrowLeftOutlined />} style={styles.outlineBtn}>
                  Back to Questions
                </Button>
                <Button onClick={handleSaveDraft} icon={<SaveOutlined />} style={styles.outlineBtn}>
                  Save as Draft
                </Button>
                <Button
                  onClick={handlePublish}
                  loading={publishing}
                  style={styles.publishBtn}
                  icon={<SendOutlined />}
                >
                  Publish Test
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .ant-steps-item-title { font-family: 'DM Sans', sans-serif !important; }
        .ant-steps-item-finish .ant-steps-item-icon { border-color: #f59e0b !important; background: rgba(245,158,11,0.1) !important; }
        .ant-steps-item-finish .ant-steps-item-icon .ant-steps-icon { color: #f59e0b !important; }
        .ant-steps-item-process .ant-steps-item-icon { background: #f59e0b !important; border-color: #f59e0b !important; }
        .ant-steps-item-tail::after { background: rgba(255,255,255,0.08) !important; }
        .ant-input, .ant-input-affix-wrapper, .ant-input-number, .ant-picker {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #f1f5f9 !important; border-radius: 10px !important;
        }
        .ant-input:focus, .ant-input-affix-wrapper:focus, .ant-input-affix-wrapper-focused,
        .ant-input-number:focus, .ant-picker-focused {
          border-color: rgba(245,158,11,0.5) !important;
          box-shadow: 0 0 0 2px rgba(245,158,11,0.1) !important;
        }
        .ant-input::placeholder, .ant-input-number-input::placeholder { color: #475569 !important; }
        .ant-input-number-input { color: #f1f5f9 !important; background: transparent !important; }
        .ant-picker-input input { color: #f1f5f9 !important; }
        .ant-picker-input input::placeholder { color: #475569 !important; }
        .ant-form-item-label > label { color: #94a3b8 !important; }
        .ant-input-textarea textarea { background: transparent !important; color: #f1f5f9 !important; }
        .ant-input-textarea textarea::placeholder { color: #475569 !important; }
      `}</style>
    </div>
  );
};

const styles = {
  wrapper: { display: "flex", minHeight: "100vh", background: "#060d18", fontFamily: "'DM Sans', sans-serif" },
  sidebar: { background: "#080f1a", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100, overflowY: "auto" },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 10, padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 16, fontSize: 22 },
  logoText: { fontSize: 19, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" },
  sidebarProfile: { display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 12, gap: 6 },
  sidebarProfileName: { color: "#f1f5f9", fontWeight: 700, fontSize: 13, textAlign: "center" },
  sidebarProfileBadge: { display: "flex", alignItems: "center", gap: 4, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 },
  nav: { flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column", gap: 2 },
  navItem: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 500, transition: "all 0.15s", position: "relative", userSelect: "none" },
  navItemActive: { background: "rgba(245,158,11,0.08)", color: "#f59e0b" },
  navActiveBar: { position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: "#f59e0b", borderRadius: 2 },
  sidebarFooter: { padding: "14px 14px 0", borderTop: "1px solid rgba(255,255,255,0.05)" },
  logoutBtn: { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 8, height: 34 },
  main: { flex: 1, minHeight: "100vh", background: "#060d18" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 64, background: "#080f1a", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 50, gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  menuBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 },
  backBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 },
  breadcrumb: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 },
  breadcrumbRoot: { fontSize: 11, color: "#475569" },
  breadcrumbSep: { fontSize: 11, color: "#1e293b" },
  breadcrumbCurrent: { fontSize: 11, color: "#64748b", fontWeight: 500 },
  pageTitle: { fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  stepCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "28px" },
  stepTitle: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px", fontFamily: "'Syne', sans-serif" },
  stepSubtitle: { fontSize: 13, color: "#475569", margin: "0 0 24px" },
  formLabel: { fontSize: 13, color: "#94a3b8", fontWeight: 500 },
  input: { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "#f1f5f9", borderRadius: 10, height: 44 },
  primaryBtn: { background: "linear-gradient(135deg, #f59e0b, #f97316)", border: "none", color: "#0f172a", borderRadius: 10, fontWeight: 700, height: 44, paddingInline: 24, boxShadow: "0 4px 14px rgba(245,158,11,0.3)" },
  outlineBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 10, height: 44, paddingInline: 20 },
  publishBtn: { background: "linear-gradient(135deg, #34d399, #059669)", border: "none", color: "#fff", borderRadius: 10, fontWeight: 700, height: 44, paddingInline: 24, boxShadow: "0 4px 14px rgba(52,211,153,0.3)" },
  questionRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 },
  questionRowNum: { width: 24, height: 24, borderRadius: 6, background: "rgba(245,158,11,0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
};