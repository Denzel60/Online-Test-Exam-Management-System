// src/pages/teacher/EditTest.jsx
import { useState, useEffect } from "react";
import {
  Form, Input, InputNumber, DatePicker, Button,
  Avatar, Drawer, message, Tag, Spin, Popconfirm,
  Modal,
} from "antd";
import {
  BookOutlined, PlusOutlined, BarChartOutlined,
  FlagOutlined, SettingOutlined, HomeOutlined,
  LogoutOutlined, MenuOutlined, ArrowLeftOutlined,
  CheckCircleOutlined, TeamOutlined, FileTextOutlined,
  ClockCircleOutlined, SendOutlined, SaveOutlined,
  DeleteOutlined, EditOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import dayjs from "dayjs";

const NAV_ITEMS = [
  { icon: <HomeOutlined />, label: "Dashboard", path: "/teacher/dashboard" },
  { icon: <BookOutlined />, label: "My Tests", path: "/teacher/tests" },
  { icon: <PlusOutlined />, label: "Create Test", path: "/teacher/tests/create" },
  { icon: <BarChartOutlined />, label: "Results", path: "/teacher/results" },
  { icon: <FlagOutlined />, label: "Flagged", path: "/teacher/flagged" },
  { icon: <SettingOutlined />, label: "Settings", path: "/teacher/settings" },
];

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
};

export const EditTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const [form] = Form.useForm();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addQuestionModal, setAddQuestionModal] = useState(false);
  const [removingQuestion, setRemovingQuestion] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  // New question state
  const [newQuestion, setNewQuestion] = useState({
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

  useEffect(() => { fetchTest(); }, [testId]);

  const fetchTest = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/tests/${testId}`);
      const t = data.test;
      const qs = data.questions || [];

      setTest(t);
      setQuestions(qs);

      // Populate form with existing values
      form.setFieldsValue({
        title: t.title,
        description: t.description,
        timeLimit: t.timeLimit,
        maxAttempts: t.maxAttempts,
        passMarkPercent: t.passMarkPercent ?? 50,
        startDate: t.startDate ? dayjs(t.startDate) : null,
        endDate: t.endDate ? dayjs(t.endDate) : null,
      });
    } catch (err) {
      messageApi.error("Failed to load test");
      console.error("Fetch test error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ── SAVE TEST DETAILS
  const handleSave = async (values) => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/tests/${testId}`, {
        title: values.title,
        description: values.description,
        timeLimit: values.timeLimit,
        maxAttempts: values.maxAttempts,
        passMarkPercent: values.passMarkPercent,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      });

      // ✅ Success notification
      messageApi.success({
        content: "Test updated successfully!",
        duration: 3,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(52,211,153,0.3)",
          borderRadius: 10,
          color: "#34d399",
        },
      });

      fetchTest();
    } catch (err) {
      messageApi.error({
        content: err.response?.data?.message || "Failed to update test",
        duration: 4,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 10,
          color: "#f87171",
        },
      });
    } finally {
      setSaving(false);
    }
  };

  // ── PUBLISH TEST
  const handlePublish = async () => {
    if (questions.length === 0) {
      messageApi.error("Add at least one question before publishing");
      return;
    }
    setPublishing(true);
    try {
      await axiosInstance.patch(`/tests/${testId}/publish`);
      messageApi.success({
        content: "Test published successfully!",
        duration: 3,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(52,211,153,0.3)",
          borderRadius: 10,
          color: "#34d399",
        },
      });
      fetchTest();
    } catch (err) {
      messageApi.error({
        content: err.response?.data?.message || "Failed to publish test",
        duration: 4,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 10,
          color: "#f87171",
        },
      });
    } finally {
      setPublishing(false);
    }
  };

  // ── ADD QUESTION
  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim()) {
      messageApi.error("Question text is required");
      return;
    }
    if (
      (newQuestion.type === "multiple_choice" || newQuestion.type === "true_false") &&
      !newQuestion.options.some((o) => o.isCorrect)
    ) {
      messageApi.error("At least one correct answer is required");
      return;
    }

    try {
      const payload = {
        type: newQuestion.type,
        text: newQuestion.text,
        points: newQuestion.points,
        options:
          newQuestion.type === "short_answer"
            ? []
            : newQuestion.options.filter((o) => o.text.trim()),
      };

      const { data } = await axiosInstance.post("/tests/questions", payload);
      const questionId = data.question.id;

      // Link to this test
      await axiosInstance.post(`/tests/${testId}/questions`, {
        questionIds: [{ questionId, order: questions.length + 1 }],
      });

      messageApi.success({
        content: "Question added successfully!",
        duration: 3,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(52,211,153,0.3)",
          borderRadius: 10,
          color: "#34d399",
        },
      });

      setAddQuestionModal(false);
      resetNewQuestion();
      fetchTest();
    } catch (err) {
      messageApi.error({
        content: err.response?.data?.message || "Failed to add question",
        duration: 4,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 10,
          color: "#f87171",
        },
      });
    }
  };

  // ── REMOVE QUESTION FROM TEST
  const handleRemoveQuestion = async (questionId) => {
    setRemovingQuestion(questionId);
    try {
      await axiosInstance.delete(`/tests/${testId}/questions/${questionId}`);
      messageApi.success({
        content: "Question removed from test",
        duration: 3,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(52,211,153,0.3)",
          borderRadius: 10,
          color: "#34d399",
        },
      });
      fetchTest();
    } catch (err) {
      messageApi.error({
        content: err.response?.data?.message || "Failed to remove question",
        duration: 4,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 10,
          color: "#f87171",
        },
      });
    } finally {
      setRemovingQuestion(null);
    }
  };

  const resetNewQuestion = () => {
    setNewQuestion({
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
  };

  const updateOption = (index, field, value) => {
    setNewQuestion((prev) => {
      const opts = [...prev.options];
      if (field === "isCorrect" && prev.type === "true_false") {
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

  if (loading) {
    return (
      <div style={{ ...styles.wrapper, justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {contextHolder}

      {!isMobile && <aside style={{ ...styles.sidebar, width: isTablet ? 200 : 240 }}><SidebarContent /></aside>}
      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} placement="left" width={260}
        styles={{ body: { padding: 0, background: "#080f1a" }, header: { display: "none" } }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px 0" }}><SidebarContent /></div>
      </Drawer>

      <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240 }}>

        {/* ── HEADER */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            {isMobile && <Button icon={<MenuOutlined />} onClick={() => setMobileMenuOpen(true)} style={styles.menuBtn} />}
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/teacher/tests")} style={styles.backBtn} size="small">
              {!isMobile && "My Tests"}
            </Button>
            <div>
              <div style={styles.breadcrumb}>
                <span style={{ ...styles.breadcrumbRoot, cursor: "pointer" }} onClick={() => navigate("/teacher/tests")}>
                  My Tests
                </span>
                <span style={styles.breadcrumbSep}>/</span>
                <span style={styles.breadcrumbCurrent}>Edit Test</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 15 : 18 }}>
                {test?.title || "Edit Test"}
              </h1>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {test?.status === "draft" && (
              <Button
                icon={<SendOutlined />}
                onClick={handlePublish}
                loading={publishing}
                style={styles.publishBtn}
                size={isMobile ? "small" : "middle"}
              >
                {!isMobile && "Publish"}
              </Button>
            )}
            <Tag style={{
              background: test?.status === "published" ? "rgba(52,211,153,0.15)" : "rgba(245,158,11,0.15)",
              color: test?.status === "published" ? "#34d399" : "#f59e0b",
              border: "none", borderRadius: 6, fontWeight: 700,
              fontSize: 11, textTransform: "uppercase",
              display: "flex", alignItems: "center", padding: "0 10px",
            }}>
              {test?.status}
            </Tag>
          </div>
        </header>

        <div style={{ padding: isMobile ? "16px" : "28px 32px 40px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 20, alignItems: "flex-start" }}>

            {/* ── LEFT — TEST DETAILS FORM */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.cardTitle}>Test Details</h3>
                    <p style={styles.cardSub}>Update the settings for this test</p>
                  </div>
                  <EditOutlined style={{ color: "#f59e0b", fontSize: 18 }} />
                </div>

                <Form form={form} layout="vertical" onFinish={handleSave} size="large">
                  <Form.Item name="title" label={<span style={styles.formLabel}>Test Title *</span>}
                    rules={[{ required: true, message: "Title is required" }]}>
                    <Input placeholder="Test title" style={styles.input} />
                  </Form.Item>

                  <Form.Item name="description" label={<span style={styles.formLabel}>Description</span>}>
                    <Input.TextArea placeholder="Describe what this test covers..." rows={3}
                      style={{ ...styles.input, height: "auto" }} />
                  </Form.Item>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                    <Form.Item name="timeLimit" label={<span style={styles.formLabel}>Time Limit (min)</span>}>
                      <InputNumber placeholder="e.g. 60" min={1} style={{ ...styles.input, width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="maxAttempts" label={<span style={styles.formLabel}>Max Attempts</span>}>
                      <InputNumber placeholder="e.g. 1" min={1} style={{ ...styles.input, width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="passMarkPercent" label={<span style={styles.formLabel}>Pass Mark (%)</span>}>
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
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={saving}
                      icon={<SaveOutlined />}
                      style={styles.saveBtn}
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => navigate("/teacher/tests")}
                      style={styles.cancelBtn}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </div>
            </div>

            {/* ── RIGHT — QUESTIONS */}
            <div style={{ width: isMobile ? "100%" : 340, flexShrink: 0 }}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.cardTitle}>Questions</h3>
                    <p style={styles.cardSub}>{questions.length} question{questions.length !== 1 ? "s" : ""}</p>
                  </div>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => setAddQuestionModal(true)}
                    style={styles.addQuestionBtn}
                    size="small"
                  >
                    Add
                  </Button>
                </div>

                {questions.length === 0 ? (
                  <div style={styles.emptyQuestions}>
                    <span style={{ fontSize: 32, opacity: 0.3 }}>📋</span>
                    <p style={{ color: "#475569", fontSize: 13, margin: 0, textAlign: "center" }}>
                      No questions yet — add your first one
                    </p>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => setAddQuestionModal(true)}
                      style={styles.saveBtn}
                      size="small"
                    >
                      Add Question
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {questions.map((q, i) => {
                      const question = q.question || q;
                      const qId = question.id;
                      return (
                        <div key={qId} style={styles.questionRow}>
                          <div style={styles.questionRowNum}>{i + 1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {question.text}
                            </div>
                            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                              <Tag style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "none", borderRadius: 4, fontSize: 10, padding: "0 6px", textTransform: "uppercase" }}>
                                {question.type?.replace("_", " ")}
                              </Tag>
                              <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 600 }}>
                                {question.points} pt{question.points !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <Popconfirm
                            title="Remove this question?"
                            description="It will be unlinked from this test."
                            onConfirm={() => handleRemoveQuestion(qId)}
                            okText="Remove"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              size="small"
                              icon={<DeleteOutlined />}
                              loading={removingQuestion === qId}
                              style={{ background: "rgba(248,113,113,0.1)", border: "none", color: "#f87171", borderRadius: 6 }}
                            />
                          </Popconfirm>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Total Points */}
                {questions.length > 0 && (
                  <div style={styles.totalPoints}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>Total Points</span>
                    <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 16, fontFamily: "'Syne', sans-serif" }}>
                      {questions.reduce((s, q) => s + ((q.question || q).points || 0), 0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Publish CTA */}
              {test?.status === "draft" && questions.length > 0 && (
                <div style={styles.publishCta}>
                  <div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                      Ready to publish?
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>
                      {questions.length} question{questions.length !== 1 ? "s" : ""} added
                    </div>
                  </div>
                  <Button
                    icon={<SendOutlined />}
                    onClick={handlePublish}
                    loading={publishing}
                    style={styles.publishBtn}
                    block
                  >
                    Publish Test
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── ADD QUESTION MODAL */}
      <Modal
        open={addQuestionModal}
        onCancel={() => { setAddQuestionModal(false); resetNewQuestion(); }}
        footer={null}
        centered
        width={isMobile ? "95%" : 600}
        styles={{
          content: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20 },
          header: { background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.06)" },
          mask: { backdropFilter: "blur(4px)" },
        }}
        title={<span style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Add Question</span>}
      >
        <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Question Type */}
          <div>
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
                    setNewQuestion((p) => ({ ...p, type: type.value, options: opts }));
                  }}
                  style={{
                    padding: "7px 14px", borderRadius: 20, cursor: "pointer",
                    background: newQuestion.type === type.value ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                    border: newQuestion.type === type.value ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    color: newQuestion.type === type.value ? "#f59e0b" : "#64748b",
                    fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label style={styles.formLabel}>Question Text *</label>
            <Input.TextArea
              value={newQuestion.text}
              onChange={(e) => setNewQuestion((p) => ({ ...p, text: e.target.value }))}
              placeholder="Type your question here..."
              rows={3}
              style={{ ...styles.input, marginTop: 8, height: "auto" }}
            />
          </div>

          {/* Points */}
          <div>
            <label style={styles.formLabel}>Points</label>
            <InputNumber
              value={newQuestion.points}
              onChange={(val) => setNewQuestion((p) => ({ ...p, points: val }))}
              min={1}
              style={{ ...styles.input, marginTop: 8, width: 100 }}
            />
          </div>

          {/* MC Options */}
          {newQuestion.type === "multiple_choice" && (
            <div>
              <label style={styles.formLabel}>Answer Options (✓ = correct)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {newQuestion.options.map((opt, i) => (
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
                      {opt.isCorrect && <span style={{ color: "#0f172a", fontSize: 11, fontWeight: 700 }}>✓</span>}
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

          {/* T/F Options */}
          {newQuestion.type === "true_false" && (
            <div>
              <label style={styles.formLabel}>Correct Answer</label>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {newQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => updateOption(i, "isCorrect", true)}
                    style={{
                      flex: 1, padding: "14px", borderRadius: 12, cursor: "pointer",
                      background: opt.isCorrect ? (opt.text === "True" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)") : "rgba(255,255,255,0.03)",
                      border: `2px solid ${opt.isCorrect ? (opt.text === "True" ? "rgba(52,211,153,0.5)" : "rgba(248,113,113,0.5)") : "rgba(255,255,255,0.08)"}`,
                      color: opt.isCorrect ? (opt.text === "True" ? "#34d399" : "#f87171") : "#64748b",
                      fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    {opt.text === "True" ? "✓ True" : "✗ False"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Short Answer hint */}
          {newQuestion.type === "short_answer" && (
            <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 12, padding: "12px 16px" }}>
              <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                💡 Students will type their answer. Graded by exact text match.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Button onClick={() => { setAddQuestionModal(false); resetNewQuestion(); }} style={styles.cancelBtn}>
              Cancel
            </Button>
            <Button onClick={handleAddQuestion} style={styles.saveBtn} icon={<PlusOutlined />}>
              Add Question
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .ant-input, .ant-input-affix-wrapper, .ant-input-number, .ant-picker {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #f1f5f9 !important; border-radius: 10px !important;
        }
        .ant-input:focus, .ant-input-affix-wrapper-focused, .ant-input-number:focus, .ant-picker-focused {
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
        .ant-modal-close { color: #64748b !important; }
        .ant-popover-inner { background: #1e293b !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; }
        .ant-popover-title { color: #f1f5f9 !important; }
        .ant-popover-inner-content { color: #94a3b8 !important; }
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
  breadcrumbRoot: { fontSize: 11, color: "#475569", fontWeight: 500 },
  breadcrumbSep: { fontSize: 11, color: "#1e293b" },
  breadcrumbCurrent: { fontSize: 11, color: "#64748b" },
  pageTitle: { fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  publishBtn: { background: "linear-gradient(135deg, #34d399, #059669)", border: "none", color: "#fff", borderRadius: 10, fontWeight: 700, boxShadow: "0 4px 12px rgba(52,211,153,0.3)" },
  card: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "24px" },
  cardHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px", fontFamily: "'Syne', sans-serif" },
  cardSub: { fontSize: 12, color: "#475569", margin: 0 },
  formLabel: { fontSize: 13, color: "#94a3b8", fontWeight: 500 },
  input: { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "#f1f5f9", borderRadius: 10, height: 44 },
  saveBtn: { background: "linear-gradient(135deg, #f59e0b, #f97316)", border: "none", color: "#0f172a", borderRadius: 10, fontWeight: 700, height: 42, paddingInline: 20, boxShadow: "0 4px 14px rgba(245,158,11,0.3)" },
  cancelBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 10, height: 42, paddingInline: 20 },
  addQuestionBtn: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", borderRadius: 8, fontWeight: 600 },
  questionRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 },
  questionRowNum: { width: 24, height: 24, borderRadius: 6, background: "rgba(245,158,11,0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  totalPoints: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" },
  publishCta: { background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 16, padding: "16px 18px", marginTop: 16, display: "flex", flexDirection: "column", gap: 12 },
  emptyQuestions: { display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px", gap: 12 },
};