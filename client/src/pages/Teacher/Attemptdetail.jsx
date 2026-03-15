// src/pages/teacher/AttemptDetail.jsx
import { useState, useEffect } from "react";
import {
    Button, Avatar, Drawer, Spin, Tag, Input,
    InputNumber, Modal, message, Popconfirm, Progress,
} from "antd";
import {
    BookOutlined, PlusOutlined, BarChartOutlined,
    FlagOutlined, SettingOutlined, HomeOutlined,
    LogoutOutlined, MenuOutlined, ArrowLeftOutlined,
    TeamOutlined, CheckCircleOutlined, CloseCircleOutlined,
    EditOutlined, SaveOutlined, ReloadOutlined, WarningOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation, useParams } from "react-router-dom";

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

export const AttemptDetail = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const width = useWindowWidth();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const [attemptData, setAttemptData] = useState(null);
    const [breakdown, setBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Grade override
    const [gradeModal, setGradeModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [newPoints, setNewPoints] = useState(0);
    const [newIsCorrect, setNewIsCorrect] = useState(false);
    const [savingGrade, setSavingGrade] = useState(false);

    // Flag / Unflag
    const [flagModal, setFlagModal] = useState(false);
    const [flagReason, setFlagReason] = useState("");
    const [flagging, setFlagging] = useState(false);
    const [unflagging, setUnflagging] = useState(false);

    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => { fetchAttemptDetail(); }, [attemptId]);

    const fetchAttemptDetail = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.get(`/oversight/attempts/${attemptId}`);
            setAttemptData(data.attempt);
            setBreakdown(data.breakdown || []);
        } catch (err) {
            console.error("Fetch attempt detail error:", err);
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

    const openGradeModal = (item) => {
        setSelectedQuestion(item);
        setNewPoints(item.pointsAwarded ?? 0);
        setNewIsCorrect(item.isCorrect ?? false);
        setGradeModal(true);
    };

    const handleOverrideGrade = async () => {
        setSavingGrade(true);
        try {
            await axiosInstance.patch(
                `/oversight/attempts/${attemptId}/questions/${selectedQuestion.questionId}/grade`,
                { pointsAwarded: newPoints, isCorrect: newIsCorrect }
            );
            messageApi.success({
                content: "Grade updated successfully!",
                duration: 3,
                style: { background: "#0d1829", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 10, color: "#34d399" },
            });
            setGradeModal(false);
            fetchAttemptDetail();
        } catch (err) {
            messageApi.error({
                content: err.response?.data?.message || "Failed to update grade",
                duration: 4,
                style: { background: "#0d1829", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, color: "#f87171" },
            });
        } finally {
            setSavingGrade(false);
        }
    };

    const handleFlag = async () => {
        if (!flagReason.trim()) { messageApi.error("Please provide a reason"); return; }
        setFlagging(true);
        try {
            await axiosInstance.patch(`/oversight/attempts/${attemptId}/flag`, { flagReason });
            messageApi.success({ content: "Attempt flagged", duration: 3, style: { background: "#0d1829", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 10, color: "#34d399" } });
            setFlagModal(false);
            setFlagReason("");
            fetchAttemptDetail();
        } catch (err) {
            messageApi.error({ content: err.response?.data?.message || "Failed to flag", duration: 4, style: { background: "#0d1829", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, color: "#f87171" } });
        } finally {
            setFlagging(false);
        }
    };

    const handleUnflag = async () => {
        setUnflagging(true);
        try {
            await axiosInstance.patch(`/oversight/attempts/${attemptId}/unflag`);
            messageApi.success({ content: "Attempt unflagged", duration: 3, style: { background: "#0d1829", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 10, color: "#34d399" } });
            fetchAttemptDetail();
        } catch (err) {
            messageApi.error({ content: err.response?.data?.message || "Failed to unflag", duration: 4, style: { background: "#0d1829", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, color: "#f87171" } });
        } finally {
            setUnflagging(false);
        }
    };

    const pct = attemptData?.totalPoints > 0
        ? Math.round((attemptData.score / attemptData.totalPoints) * 100) : 0;
    const correctCount = breakdown.filter((b) => b.isCorrect).length;
    const shortAnswerItems = breakdown.filter((b) => b.type === "short_answer");

    const SidebarContent = () => (
        <>
            <div style={styles.sidebarLogo}><span>📝</span><span style={styles.logoText}>ExamFlow</span></div>
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
            <div style={{ display: "flex", minHeight: "100vh", background: "#060d18", justifyContent: "center", alignItems: "center" }}>
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

                {/* Header */}
                <header style={styles.header}>
                    <div style={styles.headerLeft}>
                        {isMobile && <Button icon={<MenuOutlined />} onClick={() => setMobileMenuOpen(true)} style={styles.menuBtn} />}
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={styles.backBtn} size="small">
                            {!isMobile && "Back"}
                        </Button>
                        <div>
                            <div style={styles.breadcrumb}>
                                <span style={{ ...styles.breadcrumbRoot, cursor: "pointer" }} onClick={() => navigate("/teacher/results")}>Results</span>
                                <span style={styles.breadcrumbSep}>/</span>
                                <span style={styles.breadcrumbCurrent}>Attempt #{attemptId}</span>
                            </div>
                            <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 15 : 18 }}>Attempt Detail</h1>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button icon={<ReloadOutlined />} onClick={fetchAttemptDetail} style={styles.refreshBtn} size={isMobile ? "small" : "middle"}>
                            {!isMobile && "Refresh"}
                        </Button>
                        {attemptData?.isFlagged ? (
                            <Popconfirm title="Unflag this attempt?" onConfirm={handleUnflag} okText="Unflag" cancelText="Cancel">
                                <Button icon={<CheckCircleOutlined />} loading={unflagging} style={styles.unflagBtn} size={isMobile ? "small" : "middle"}>
                                    {!isMobile && "Unflag"}
                                </Button>
                            </Popconfirm>
                        ) : (
                            <Button icon={<FlagOutlined />} onClick={() => setFlagModal(true)} style={styles.flagBtn} size={isMobile ? "small" : "middle"}>
                                {!isMobile && "Flag Attempt"}
                            </Button>
                        )}
                    </div>
                </header>

                <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

                    {/* Flagged Banner */}
                    {attemptData?.isFlagged && (
                        <div style={styles.flaggedBanner}>
                            <WarningOutlined style={{ color: "#f87171", fontSize: 18, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#f87171", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>🚩 This attempt has been flagged</div>
                                <div style={{ color: "#64748b", fontSize: 13 }}>Reason: {attemptData.flagReason || "No reason provided"}</div>
                            </div>
                            <Popconfirm title="Unflag this attempt?" onConfirm={handleUnflag} okText="Unflag" cancelText="Cancel">
                                <Button size="small" loading={unflagging} style={styles.unflagBtn}>Unflag</Button>
                            </Popconfirm>
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 20, alignItems: "flex-start" }}>

                        {/* Left — Student & Score */}
                        <div style={{ width: isMobile ? "100%" : 280, flexShrink: 0 }}>
                            <div style={{ ...styles.card, marginBottom: 16 }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "8px 0 16px" }}>
                                    <Avatar style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", color: "#fff", fontWeight: 700, fontSize: 24 }} size={72}>
                                        {attemptData?.studentName?.[0]?.toUpperCase() || "S"}
                                    </Avatar>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16, fontFamily: "'Syne', sans-serif" }}>{attemptData?.studentName || "Student"}</div>
                                        <div style={{ color: "#475569", fontSize: 12, marginTop: 2 }}>{attemptData?.studentEmail}</div>
                                    </div>
                                    <Tag style={{
                                        background: attemptData?.status !== "submitted" ? "rgba(245,158,11,0.15)" : attemptData?.isPassed ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                                        color: attemptData?.status !== "submitted" ? "#f59e0b" : attemptData?.isPassed ? "#34d399" : "#f87171",
                                        border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12,
                                    }}>
                                        {attemptData?.status !== "submitted" ? "IN PROGRESS" : attemptData?.isPassed ? "PASSED" : "FAILED"}
                                    </Tag>
                                </div>

                                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                                    <Progress type="circle" percent={pct} size={120}
                                        strokeColor={attemptData?.isPassed ? { "0%": "#34d399", "100%": "#10b981" } : { "0%": "#f87171", "100%": "#ef4444" }}
                                        trailColor="rgba(255,255,255,0.06)"
                                        format={(p) => (
                                            <div style={{ textAlign: "center" }}>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: attemptData?.isPassed ? "#34d399" : "#f87171", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{p}%</div>
                                                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>Score</div>
                                            </div>
                                        )}
                                    />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                                    {[
                                        { label: "Points", value: `${attemptData?.score ?? 0} / ${attemptData?.totalPoints ?? 0}`, color: "#38bdf8" },
                                        { label: "Correct", value: `${correctCount} / ${breakdown.length}`, color: "#34d399" },
                                        { label: "Submitted", value: attemptData?.submittedAt ? new Date(attemptData.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—", color: "#94a3b8" },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: 12, color: "#475569" }}>{item.label}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {shortAnswerItems.length > 0 && (
                                <div style={styles.overrideNote}>
                                    <EditOutlined style={{ color: "#f59e0b", fontSize: 14, flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <div style={{ color: "#f59e0b", fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Grade Override Available</div>
                                        <div style={{ color: "#64748b", fontSize: 12 }}>
                                            {shortAnswerItems.length} short answer question{shortAnswerItems.length !== 1 ? "s" : ""} can be manually graded. Click the ✎ icon.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right — Breakdown */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <h3 style={styles.cardTitle}>Answer Breakdown</h3>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Tag style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", border: "none", borderRadius: 6, fontWeight: 600 }}>
                                            <CheckCircleOutlined style={{ marginRight: 4 }} />{correctCount} Correct
                                        </Tag>
                                        <Tag style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "none", borderRadius: 6, fontWeight: 600 }}>
                                            <CloseCircleOutlined style={{ marginRight: 4 }} />{breakdown.length - correctCount} Wrong
                                        </Tag>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {breakdown.map((item, i) => (
                                        <div key={item.questionId} style={{ background: item.isCorrect ? "rgba(52,211,153,0.03)" : "rgba(248,113,113,0.03)", border: `1px solid ${item.isCorrect ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}`, borderRadius: 14, padding: "14px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: item.isCorrect ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: item.isCorrect ? "#34d399" : "#f87171", fontSize: 14, flexShrink: 0 }}>
                                                    {item.isCorrect ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                                                        <Tag style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "none", borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>
                                                            {item.type?.replace("_", " ")}
                                                        </Tag>
                                                        <span style={{ fontSize: 11, color: "#475569" }}>Q{i + 1}</span>
                                                        <span style={{ fontSize: 11, color: item.isCorrect ? "#34d399" : "#f87171", fontWeight: 700 }}>
                                                            {item.pointsAwarded}/{item.points} pts
                                                        </span>
                                                    </div>
                                                    <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>{item.questionText}</p>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                            <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, minWidth: 100 }}>Student's answer:</span>
                                                            <span style={{ fontSize: 12, color: item.isCorrect ? "#34d399" : "#f87171", fontWeight: 600 }}>
                                                                {item.isCorrect ? "✓" : "✗"} {item.yourAnswer || "Not answered"}
                                                            </span>
                                                        </div>
                                                        {!item.isCorrect && item.correctAnswer && (
                                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                                <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, minWidth: 100 }}>Correct answer:</span>
                                                                <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>✓ {item.correctAnswer}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {item.type === "short_answer" && (
                                                    <Button size="small" icon={<EditOutlined />} onClick={() => openGradeModal(item)}
                                                        style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", borderRadius: 8, flexShrink: 0 }}>
                                                        {!isMobile && "Override"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Grade Override Modal */}
            <Modal open={gradeModal} onCancel={() => setGradeModal(false)} footer={null} centered width={isMobile ? "95%" : 480}
                styles={{ content: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20 }, header: { background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.06)" }, mask: { backdropFilter: "blur(4px)" } }}
                title={<span style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Override Grade</span>}
            >
                {selectedQuestion && (
                    <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px" }}>
                            <p style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>Question</p>
                            <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>{selectedQuestion.questionText}</p>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px" }}>
                            <p style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>Student's Answer</p>
                            <p style={{ color: "#f1f5f9", fontSize: 14, margin: 0, fontWeight: 500 }}>{selectedQuestion.yourAnswer || "Not answered"}</p>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>Points Awarded (max: {selectedQuestion.points})</p>
                                <InputNumber value={newPoints} onChange={setNewPoints} min={0} max={selectedQuestion.points}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "#f1f5f9", borderRadius: 10, height: 44 }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>Mark as</p>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => setNewIsCorrect(true)} style={{ flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", border: newIsCorrect ? "2px solid rgba(52,211,153,0.5)" : "2px solid rgba(255,255,255,0.08)", background: newIsCorrect ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.02)", color: newIsCorrect ? "#34d399" : "#64748b", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>✓ Correct</button>
                                    <button onClick={() => setNewIsCorrect(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", border: !newIsCorrect ? "2px solid rgba(248,113,113,0.5)" : "2px solid rgba(255,255,255,0.08)", background: !newIsCorrect ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.02)", color: !newIsCorrect ? "#f87171" : "#64748b", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>✗ Incorrect</button>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <Button onClick={() => setGradeModal(false)} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 10, height: 42 }}>Cancel</Button>
                            <Button onClick={handleOverrideGrade} loading={savingGrade} icon={<SaveOutlined />}
                                style={{ flex: 1, background: "linear-gradient(135deg, #f59e0b, #f97316)", border: "none", color: "#0f172a", borderRadius: 10, fontWeight: 700, height: 42, boxShadow: "0 4px 14px rgba(245,158,11,0.3)" }}>
                                Save Grade
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Flag Modal */}
            <Modal open={flagModal} onCancel={() => { setFlagModal(false); setFlagReason(""); }} footer={null} centered width={isMobile ? "95%" : 440}
                styles={{ content: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20 }, header: { background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.06)" }, mask: { backdropFilter: "blur(4px)" } }}
                title={<span style={{ color: "#f87171", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>🚩 Flag Attempt</span>}
            >
                <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
                    <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Flagging marks this attempt for review. Provide a reason to help with investigation.</p>
                    <div>
                        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>Reason for flagging *</p>
                        <Input.TextArea value={flagReason} onChange={(e) => setFlagReason(e.target.value)}
                            placeholder="e.g. Submitted unusually fast, possible cheating..." rows={3}
                            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "#f1f5f9", borderRadius: 10 }} />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <Button onClick={() => { setFlagModal(false); setFlagReason(""); }} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 10, height: 42 }}>Cancel</Button>
                        <Button onClick={handleFlag} loading={flagging} icon={<FlagOutlined />}
                            style={{ flex: 1, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 10, fontWeight: 700, height: 42 }}>
                            Flag Attempt
                        </Button>
                    </div>
                </div>
            </Modal>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .ant-input-affix-wrapper, .ant-input-number { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.08) !important; color: #f1f5f9 !important; border-radius: 10px !important; }
        .ant-input, .ant-input-number-input { background: transparent !important; color: #f1f5f9 !important; }
        .ant-input::placeholder { color: #475569 !important; }
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
    refreshBtn: { background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", color: "#38bdf8", borderRadius: 10, fontWeight: 600 },
    flagBtn: { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: 10, fontWeight: 600 },
    unflagBtn: { background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399", borderRadius: 10, fontWeight: 600 },
    breadcrumb: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 },
    breadcrumbRoot: { fontSize: 11, color: "#475569", fontWeight: 500 },
    breadcrumbSep: { fontSize: 11, color: "#1e293b" },
    breadcrumbCurrent: { fontSize: 11, color: "#64748b" },
    pageTitle: { fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
    flaggedBanner: { display: "flex", alignItems: "flex-start", gap: 14, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 14, padding: "14px 18px", marginBottom: 20 },
    card: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px", overflow: "hidden" },
    cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 },
    cardTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
    overrideNote: { display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 12, padding: "12px 14px" },
};