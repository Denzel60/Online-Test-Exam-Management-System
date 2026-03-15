// src/pages/student/AttemptResult.jsx
import { useState, useEffect } from "react";
import { Button, Progress, Tag, Spin, Avatar, Drawer } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  ReloadOutlined,
  HomeOutlined,
  BookOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuOutlined,
   SettingOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useParams, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { icon: <HomeOutlined />, label: "Dashboard", path: "/student/dashboard" },
  { icon: <BookOutlined />, label: "Available Tests", path: "/student/tests" },
  { icon: <FileTextOutlined />, label: "My Attempts", path: "/student/attempts" },
  { icon: <BarChartOutlined />, label: "My Results", path: "/student/results" },
  { icon: <SettingOutlined />, label: "Settings", path: "/student/settings" },

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

export const AttemptResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => { fetchResult(); }, [attemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(
        `/student/tests/attempts/${attemptId}/result`
      );
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load result");
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

  const SidebarContent = () => (
    <>
      <div style={styles.sidebarLogo}>
        <span>📝</span>
        <span style={styles.logoText}>ExamFlow</span>
      </div>
      <div style={styles.sidebarProfile}>
        <Avatar
          style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", color: "#fff", fontWeight: 700, fontSize: 18 }}
          size={48}
        >
          {user?.name?.[0]?.toUpperCase() || "S"}
        </Avatar>
        <div style={styles.sidebarProfileName}>{user?.name || "Student"}</div>
        <div style={styles.sidebarProfileRole}>Student</div>
      </div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path) && item.path !== "/student/dashboard"
            ? location.pathname.startsWith(item.path)
            : location.pathname === item.path;
          return (
            <div
              key={item.label}
              onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
            >
              <span style={{ fontSize: 15, color: isActive ? "#38bdf8" : "#64748b" }}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <div style={styles.navActiveBar} />}
            </div>
          );
        })}
      </nav>
      <div style={styles.sidebarFooter}>
        <Button icon={<LogoutOutlined />} onClick={handleLogout} style={styles.logoutBtn} size="small" block>
          Sign Out
        </Button>
      </div>
    </>
  );

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.wrapper}>
        {!isMobile && <aside style={{ ...styles.sidebar, width: isTablet ? 200 : 240 }}><SidebarContent /></aside>}
        <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <Spin size="large" />
            <p style={{ color: "#64748b", marginTop: 16 }}>Loading your result...</p>
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // ERROR
  // ─────────────────────────────────────────────
  if (error || !result) {
    return (
      <div style={styles.wrapper}>
        {!isMobile && <aside style={{ ...styles.sidebar, width: isTablet ? 200 : 240 }}><SidebarContent /></aside>}
        <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
            <h3 style={{ color: "#f1f5f9", marginBottom: 8 }}>Could not load result</h3>
            <p style={{ color: "#64748b", marginBottom: 24 }}>{error}</p>
            <Button onClick={() => navigate("/student/results")} style={styles.outlineBtn}>
              Back to Results
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const { score, totalPoints, percentage, isPassed, submittedAt } = result.result;
  const breakdown = result.breakdown || [];
  const correctCount = breakdown.filter((b) => b.isCorrect).length;
  const incorrectCount = breakdown.filter((b) => !b.isCorrect).length;
  const unansweredCount = breakdown.filter((b) => b.yourAnswer === null).length;

  return (
    <div style={styles.wrapper}>
      {/* ── DESKTOP SIDEBAR */}
      {!isMobile && (
        <aside style={{ ...styles.sidebar, width: isTablet ? 200 : 240 }}>
          <SidebarContent />
        </aside>
      )}

      {/* ── MOBILE DRAWER */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        placement="left"
        width={260}
        styles={{ body: { padding: 0, background: "#080f1a" }, header: { display: "none" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px 0" }}>
          <SidebarContent />
        </div>
      </Drawer>

      <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240 }}>

        {/* ── HEADER */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            {isMobile && (
              <Button icon={<MenuOutlined />} onClick={() => setMobileMenuOpen(true)} style={styles.menuBtn} />
            )}
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              style={styles.backBtn}
              size="small"
            >
              {!isMobile && "Back"}
            </Button>
            <div>
              <div style={styles.breadcrumb}>
                <span style={styles.breadcrumbRoot} onClick={() => navigate("/student/results")} className="breadcrumb-link">
                  My Results
                </span>
                <span style={styles.breadcrumbSep}>/</span>
                <span style={styles.breadcrumbCurrent}>Attempt #{attemptId}</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 15 : 18 }}>
                Result Details
              </h1>
            </div>
          </div>
          <div style={styles.headerRight}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => navigate(`/student/tests/${result?.attempt?.testId || ""}`)}
              style={styles.retakeBtn}
              size={isMobile ? "small" : "middle"}
            >
              {isMobile ? "Retake" : "Retake Test"}
            </Button>
          </div>
        </header>

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* ── HERO RESULT CARD */}
          <div style={{
            ...styles.heroCard,
            borderColor: isPassed ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)",
            background: isPassed
              ? "linear-gradient(135deg, #0a1f18 0%, #0d1829 100%)"
              : "linear-gradient(135deg, #1f0a0a 0%, #0d1829 100%)",
          }}>
            {/* Pass/Fail badge */}
            <div style={{ ...styles.heroBadge, background: isPassed ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: isPassed ? "#34d399" : "#f87171", border: `1px solid ${isPassed ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}` }}>
              {isPassed ? <TrophyOutlined style={{ fontSize: 14 }} /> : <CloseCircleOutlined style={{ fontSize: 14 }} />}
              {isPassed ? "Test Passed" : "Test Failed"}
            </div>

            <div style={{ ...styles.heroBody, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start" }}>
              {/* Score Circle */}
              <div style={styles.heroScoreWrap}>
                <Progress
                  type="circle"
                  percent={Number(percentage)}
                  size={isMobile ? 130 : 160}
                  strokeColor={isPassed ? { "0%": "#34d399", "100%": "#10b981" } : { "0%": "#f87171", "100%": "#ef4444" }}
                  trailColor="rgba(255,255,255,0.06)"
                  strokeWidth={8}
                  format={() => (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, color: isPassed ? "#34d399" : "#f87171", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
                        {percentage}%
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Score</div>
                    </div>
                  )}
                />
              </div>

              {/* Stats */}
              <div style={styles.heroStats}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: isMobile ? 10 : 16, width: "100%" }}>
                  {[
                    { label: "Points Earned", value: `${score}/${totalPoints}`, color: "#38bdf8" },
                    { label: "Percentage", value: `${percentage}%`, color: isPassed ? "#34d399" : "#f87171" },
                    { label: "Correct", value: correctCount, color: "#34d399" },
                    { label: "Incorrect", value: incorrectCount, color: "#f87171" },
                    { label: "Unanswered", value: unansweredCount, color: "#f59e0b" },
                    { label: "Submitted", value: submittedAt ? new Date(submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—", color: "#94a3b8" },
                  ].map((stat, i) => (
                    <div key={i} style={styles.heroStat}>
                      <div style={{ ...styles.heroStatValue, color: stat.color }}>{stat.value}</div>
                      <div style={styles.heroStatLabel}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mini Progress Bars */}
            <div style={{ ...styles.miniProgressRow, flexDirection: isMobile ? "column" : "row" }}>
              {[
                { label: "Correct", count: correctCount, total: breakdown.length, color: "#34d399" },
                { label: "Incorrect", count: incorrectCount, total: breakdown.length, color: "#f87171" },
                { label: "Unanswered", count: unansweredCount, total: breakdown.length, color: "#f59e0b" },
              ].map((item) => (
                <div key={item.label} style={styles.miniProgress}>
                  <div style={styles.miniProgressHeader}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: item.color, fontWeight: 700 }}>
                      {item.count}/{item.total}
                    </span>
                  </div>
                  <Progress
                    percent={item.total > 0 ? Math.round((item.count / item.total) * 100) : 0}
                    size="small"
                    showInfo={false}
                    strokeColor={item.color}
                    trailColor="rgba(255,255,255,0.06)"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── BREAKDOWN HEADER */}
          <div style={styles.breakdownHeader}>
            <h3 style={styles.breakdownTitle}>Answer Breakdown</h3>
            <div style={styles.breakdownBadges}>
              <span style={{ ...styles.badge, background: "rgba(52,211,153,0.1)", color: "#34d399" }}>
                <CheckCircleOutlined style={{ fontSize: 11 }} /> {correctCount} Correct
              </span>
              <span style={{ ...styles.badge, background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                <CloseCircleOutlined style={{ fontSize: 11 }} /> {incorrectCount} Incorrect
              </span>
            </div>
          </div>

          {/* ── BREAKDOWN ITEMS */}
          <div style={styles.breakdownList}>
            {breakdown.map((item, i) => {
              const isExpanded = expandedQ === i;
              const isCorrect = item.isCorrect;
              const isUnanswered = item.yourAnswer === null;

              return (
                <div
                  key={item.questionId}
                  style={{
                    ...styles.breakdownItem,
                    borderColor: isCorrect
                      ? "rgba(52,211,153,0.2)"
                      : isUnanswered
                      ? "rgba(245,158,11,0.2)"
                      : "rgba(248,113,113,0.2)",
                    background: isCorrect
                      ? "rgba(52,211,153,0.03)"
                      : isUnanswered
                      ? "rgba(245,158,11,0.03)"
                      : "rgba(248,113,113,0.03)",
                  }}
                >
                  {/* Question Row */}
                  <div
                    style={styles.breakdownItemTop}
                    onClick={() => setExpandedQ(isExpanded ? null : i)}
                  >
                    {/* Status Icon */}
                    <div style={{
                      ...styles.breakdownStatusIcon,
                      background: isCorrect ? "rgba(52,211,153,0.15)" : isUnanswered ? "rgba(245,158,11,0.15)" : "rgba(248,113,113,0.15)",
                      color: isCorrect ? "#34d399" : isUnanswered ? "#f59e0b" : "#f87171",
                    }}>
                      {isCorrect
                        ? <CheckCircleOutlined />
                        : isUnanswered
                        ? "?"
                        : <CloseCircleOutlined />}
                    </div>

                    <div style={styles.breakdownItemContent}>
                      <div style={styles.breakdownItemMeta}>
                        <Tag style={{ background: "rgba(255,255,255,0.06)", color: "#64748b", border: "none", borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>
                          {item.type?.replace("_", " ")}
                        </Tag>
                        <span style={{ fontSize: 11, color: "#475569" }}>Q{i + 1}</span>
                      </div>
                      <p style={styles.breakdownItemQuestion}>{item.questionText}</p>
                    </div>

                    {/* Points + Expand */}
                    <div style={styles.breakdownItemRight}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? "#34d399" : "#f87171", fontFamily: "'Syne', sans-serif" }}>
                        {item.pointsAwarded}/{item.points}
                      </span>
                      <span style={{ color: "#475569", fontSize: 12, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Expanded Answer Details */}
                  {isExpanded && (
                    <div style={styles.breakdownExpanded}>
                      <div style={styles.answerRow}>
                        <div style={styles.answerBox}>
                          <div style={styles.answerBoxLabel}>Your Answer</div>
                          <div style={{
                            ...styles.answerBoxValue,
                            color: isCorrect ? "#34d399" : isUnanswered ? "#f59e0b" : "#f87171",
                            background: isCorrect ? "rgba(52,211,153,0.08)" : isUnanswered ? "rgba(245,158,11,0.08)" : "rgba(248,113,113,0.08)",
                            border: `1px solid ${isCorrect ? "rgba(52,211,153,0.2)" : isUnanswered ? "rgba(245,158,11,0.2)" : "rgba(248,113,113,0.2)"}`,
                          }}>
                            {isUnanswered
                              ? <><span style={{ opacity: 0.5 }}>⚠</span> Not answered</>
                              : isCorrect
                              ? <><CheckCircleOutlined style={{ marginRight: 6 }} />{item.yourAnswer}</>
                              : <><CloseCircleOutlined style={{ marginRight: 6 }} />{item.yourAnswer}</>
                            }
                          </div>
                        </div>

                        {!isCorrect && item.correctAnswer && (
                          <div style={styles.answerBox}>
                            <div style={styles.answerBoxLabel}>Correct Answer</div>
                            <div style={{ ...styles.answerBoxValue, color: "#34d399", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                              <CheckCircleOutlined style={{ marginRight: 6 }} />{item.correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── ACTIONS */}
          <div style={{ ...styles.actionsRow, flexDirection: isMobile ? "column" : "row" }}>
            <Button
              onClick={() => navigate("/student/attempts")}
              style={styles.outlineBtn}
              icon={<FileTextOutlined />}
            >
              My Attempts
            </Button>
            <Button
              onClick={() => navigate("/student/results")}
              style={styles.outlineBtn}
              icon={<BarChartOutlined />}
            >
              All Results
            </Button>
            <Button
              onClick={() => navigate(`/student/tests/${result?.attempt?.testId || ""}`)}
              style={styles.primaryBtn}
              icon={<ReloadOutlined />}
            >
              Retake Test
            </Button>
          </div>

        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .breadcrumb-link { cursor: pointer; }
        .breadcrumb-link:hover { color: #38bdf8 !important; }
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
  sidebarProfileRole: { color: "#38bdf8", fontSize: 11, fontWeight: 600 },
  nav: { flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column", gap: 2 },
  navItem: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 500, transition: "all 0.15s", position: "relative", userSelect: "none" },
  navItemActive: { background: "rgba(56,189,248,0.08)", color: "#38bdf8" },
  navActiveBar: { position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: "#38bdf8", borderRadius: 2 },
  sidebarFooter: { padding: "14px 14px 0", borderTop: "1px solid rgba(255,255,255,0.05)" },
  logoutBtn: { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 8, height: 34 },
  main: { flex: 1, minHeight: "100vh", background: "#060d18" },

  // ── HEADER
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 64, background: "#080f1a", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 50, gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  menuBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 },
  backBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 },
  retakeBtn: { background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", borderRadius: 10, fontWeight: 600 },
  breadcrumb: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 },
  breadcrumbRoot: { fontSize: 11, color: "#475569", fontWeight: 500 },
  breadcrumbSep: { fontSize: 11, color: "#1e293b" },
  breadcrumbCurrent: { fontSize: 11, color: "#64748b" },
  pageTitle: { fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },

  // ── HERO CARD
  heroCard: { borderRadius: 20, border: "1px solid", padding: isMobile => isMobile ? "20px" : "28px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 24 },
  heroBadge: { display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, alignSelf: "flex-start" },
  heroBody: { display: "flex", gap: 32 },
  heroScoreWrap: { flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  heroStats: { flex: 1, display: "flex", alignItems: "center" },
  heroStat: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px" },
  heroStatValue: { fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif", lineHeight: 1, marginBottom: 4 },
  heroStatLabel: { fontSize: 11, color: "#475569" },
  miniProgressRow: { display: "flex", gap: 16, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" },
  miniProgress: { flex: 1 },
  miniProgressHeader: { display: "flex", justifyContent: "space-between", marginBottom: 6 },

  // ── BREAKDOWN
  breakdownHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  breakdownTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  breakdownBadges: { display: "flex", gap: 8 },
  badge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  breakdownList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 },
  breakdownItem: { border: "1px solid", borderRadius: 14, overflow: "hidden", transition: "border-color 0.15s" },
  breakdownItemTop: { display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", cursor: "pointer", userSelect: "none" },
  breakdownStatusIcon: { width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, fontWeight: 700 },
  breakdownItemContent: { flex: 1, minWidth: 0 },
  breakdownItemMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  breakdownItemQuestion: { color: "#94a3b8", fontSize: 14, margin: 0, lineHeight: 1.5 },
  breakdownItemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 },
  breakdownExpanded: { padding: "0 16px 16px 60px" },
  answerRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  answerBox: { flex: 1, minWidth: 200 },
  answerBoxLabel: { fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 },
  answerBoxValue: { borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center" },

  // ── ACTIONS
  actionsRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  outlineBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 10, height: 40 },
  primaryBtn: { background: "linear-gradient(135deg, #0ea5e9, #6366f1)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, height: 40, boxShadow: "0 4px 12px rgba(14,165,233,0.3)" },
};