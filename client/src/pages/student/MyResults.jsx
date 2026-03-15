// src/pages/student/MyResults.jsx
import { useState, useEffect } from "react";
import { Tag, Button, Avatar, Drawer, Progress, Spin, Empty } from "antd";
import {
  BarChartOutlined,
  HomeOutlined,
  BookOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  EyeOutlined,
  ReloadOutlined,
   SettingOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

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

export const MyResults = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchResults(); }, []);

  const fetchResults = async () => {
    try {
      const { data } = await axiosInstance.get("/student/tests/attempts");
      const submitted = (data.attempts || []).filter((a) => a.status === "submitted");
      setAttempts(submitted);
    } catch (err) {
      console.error("Fetch results error:", err);
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

  // ── COMPUTED STATS
  const passed = attempts.filter((a) => a.isPassed);
  const failed = attempts.filter((a) => !a.isPassed);
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0), 0) / attempts.length)
    : 0;
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => a.totalPoints > 0 ? Math.round((a.score / a.totalPoints) * 100) : 0))
    : 0;
  const passRate = attempts.length > 0 ? Math.round((passed.length / attempts.length) * 100) : 0;

  // ── CHART DATA
  const scoreTrend = attempts.slice(-10).map((a, i) => ({
    label: `#${i + 1}`,
    score: a.totalPoints > 0 ? Math.round((a.score / a.totalPoints) * 100) : 0,
    passed: a.isPassed,
  }));

  const testBarData = Object.values(
    attempts.reduce((acc, a) => {
      const key = a.testTitle || `Test ${a.testId}`;
      if (!acc[key]) acc[key] = { name: key.length > 12 ? key.slice(0, 12) + "…" : key, scores: [], best: 0 };
      const pct = a.totalPoints > 0 ? Math.round((a.score / a.totalPoints) * 100) : 0;
      acc[key].scores.push(pct);
      acc[key].best = Math.max(acc[key].best, pct);
      return acc;
    }, {})
  );

  const SidebarContent = () => (
    <>
      <div style={styles.sidebarLogo}>
        <span>📝</span>
        <span style={styles.logoText}>ExamFlow</span>
      </div>
      <div style={styles.sidebarProfile}>
        <Avatar style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", color: "#fff", fontWeight: 700, fontSize: 18 }} size={48}>
          {user?.name?.[0]?.toUpperCase() || "S"}
        </Avatar>
        <div style={styles.sidebarProfileName}>{user?.name || "Student"}</div>
        <div style={styles.sidebarProfileRole}>Student</div>
      </div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div key={item.label} onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}>
              <span style={{ fontSize: 15, color: isActive ? "#38bdf8" : "#64748b" }}>{item.icon}</span>
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
      {!isMobile && (
        <aside style={{ ...styles.sidebar, width: isTablet ? 200 : 240 }}>
          <SidebarContent />
        </aside>
      )}

      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} placement="left" width={260}
        styles={{ body: { padding: 0, background: "#080f1a" }, header: { display: "none" } }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px 0" }}>
          <SidebarContent />
        </div>
      </Drawer>

      <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240 }}>

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            {isMobile && (
              <Button icon={<MenuOutlined />} onClick={() => setMobileMenuOpen(true)} style={styles.menuBtn} />
            )}
            <div>
              <div style={styles.breadcrumb}>
                <span style={styles.breadcrumbRoot}>ExamFlow</span>
                <span style={styles.breadcrumbSep}>/</span>
                <span style={styles.breadcrumbCurrent}>My Results</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 16 : 20 }}>My Results</h1>
            </div>
          </div>
          <Button onClick={() => navigate("/student/tests")} style={styles.primaryBtn} icon={<ArrowRightOutlined />} iconPosition="end">
            {isMobile ? "Tests" : "Browse Tests"}
          </Button>
        </header>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

            {/* ── STAT CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 16 : 24 }}>
              {[
                { label: "Tests Taken", value: attempts.length, icon: <FileTextOutlined />, color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
                { label: "Pass Rate", value: `${passRate}%`, icon: <TrophyOutlined />, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
                { label: "Avg Score", value: `${avgScore}%`, icon: <BarChartOutlined />, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
                { label: "Best Score", value: `${bestScore}%`, icon: <CheckCircleOutlined />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
              ].map((card, i) => (
                <div key={i} style={{ ...styles.statCard, padding: isMobile ? "14px" : "18px 20px" }}>
                  <div style={{ ...styles.statIcon, background: card.bg, color: card.color, width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, fontSize: isMobile ? 14 : 17 }}>
                    {card.icon}
                  </div>
                  <div style={{ ...styles.statValue, color: card.color, fontSize: isMobile ? 24 : 30 }}>{card.value}</div>
                  <div style={{ ...styles.statLabel, fontSize: isMobile ? 11 : 12 }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* ── PASS / FAIL SUMMARY BANNER */}
            {attempts.length > 0 && (
              <div style={styles.summaryBanner}>
                <div style={styles.summaryItem}>
                  <CheckCircleOutlined style={{ color: "#34d399", fontSize: 20 }} />
                  <div>
                    <div style={{ color: "#34d399", fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>{passed.length}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>Passed</div>
                  </div>
                </div>
                <div style={styles.summaryDivider} />
                <div style={styles.summaryItem}>
                  <CloseCircleOutlined style={{ color: "#f87171", fontSize: 20 }} />
                  <div>
                    <div style={{ color: "#f87171", fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>{failed.length}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>Failed</div>
                  </div>
                </div>
                <div style={styles.summaryDivider} />
                <div style={{ flex: 1, padding: "0 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Overall Pass Rate</span>
                    <span style={{ fontSize: 12, color: passRate >= 50 ? "#34d399" : "#f87171", fontWeight: 700 }}>{passRate}%</span>
                  </div>
                  <Progress
                    percent={passRate}
                    showInfo={false}
                    strokeColor={passRate >= 50 ? "#34d399" : "#f87171"}
                    trailColor="rgba(255,255,255,0.06)"
                    size={["100%", 6]}
                  />
                </div>
              </div>
            )}

            {attempts.length === 0 ? (
              <div style={styles.emptyWrap}>
                <Empty
                  description={<span style={{ color: "#475569" }}>No results yet — take a test to see your results here</span>}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <Button onClick={() => navigate("/student/tests")} style={styles.primaryBtn} icon={<ArrowRightOutlined />} iconPosition="end">
                  Browse Available Tests
                </Button>
              </div>
            ) : (
              <>
                {/* ── CHARTS */}
                <div style={{ display: "flex", flexDirection: isMobile || isTablet ? "column" : "row", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 16 : 24 }}>
                  {/* Score Trend */}
                  <div style={{ ...styles.chartCard, flex: 1 }}>
                    <div style={styles.chartHeader}>
                      <h3 style={styles.chartTitle}>Score Trend</h3>
                      <span style={styles.chartSub}>Last {scoreTrend.length} results</span>
                    </div>
                    <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
                      <AreaChart data={scoreTrend}>
                        <defs>
                          <linearGradient id="scoreGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#1e293b", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 8, color: "#f1f5f9" }}
                          formatter={(val) => [`${val}%`, "Score"]}
                        />
                        <Area type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2} fill="url(#scoreGrad2)"
                          dot={(props) => {
                            const { cx, cy, payload } = props;
                            return <circle key={cx} cx={cx} cy={cy} r={4} fill={payload.passed ? "#34d399" : "#f87171"} stroke="none" />;
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                      <div style={styles.chartLegendItem}><span style={{ ...styles.chartLegendDot, background: "#34d399" }} />Passed</div>
                      <div style={styles.chartLegendItem}><span style={{ ...styles.chartLegendDot, background: "#f87171" }} />Failed</div>
                    </div>
                  </div>

                  {/* Best Scores per Test */}
                  {testBarData.length > 0 && (
                    <div style={{ ...styles.chartCard, flex: isMobile || isTablet ? 1 : "0 0 300px" }}>
                      <div style={styles.chartHeader}>
                        <h3 style={styles.chartTitle}>Best per Test</h3>
                        <span style={styles.chartSub}>Highest score</span>
                      </div>
                      <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
                        <BarChart data={testBarData} barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: "#1e293b", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 8, color: "#f1f5f9" }}
                            formatter={(val) => [`${val}%`, "Best Score"]}
                          />
                          <Bar dataKey="best" radius={[6, 6, 0, 0]}>
                            {testBarData.map((entry, index) => (
                              <Cell key={index} fill={entry.best >= 50 ? "#34d399" : "#f87171"} fillOpacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* ── RESULTS LIST */}
                <div style={styles.resultsList}>
                  <div style={styles.resultsListHeader}>
                    <h3 style={styles.chartTitle}>All Results</h3>
                    <span style={{ fontSize: 12, color: "#475569" }}>{attempts.length} completed test{attempts.length !== 1 ? "s" : ""}</span>
                  </div>

                  {attempts.map((attempt) => {
                    const pct = attempt.totalPoints > 0 ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0;
                    return (
                      <div key={attempt.id} style={styles.resultRow}>
                        <div style={{ ...styles.resultRowLeft, flex: isMobile ? "unset" : 1 }}>
                          <div style={{ ...styles.resultScoreBadge, background: attempt.isPassed ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: attempt.isPassed ? "#34d399" : "#f87171", border: `1px solid ${attempt.isPassed ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}` }}>
                            {pct}%
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={styles.resultTestTitle}>{attempt.testTitle}</div>
                            <div style={styles.resultMeta}>
                              {attempt.score}/{attempt.totalPoints} pts ·{" "}
                              {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                            </div>
                            {!isMobile && (
                              <Progress
                                percent={pct}
                                size="small"
                                showInfo={false}
                                strokeColor={attempt.isPassed ? "#34d399" : "#f87171"}
                                trailColor="rgba(255,255,255,0.05)"
                                style={{ marginTop: 6, maxWidth: 300 }}
                              />
                            )}
                          </div>
                        </div>

                        <div style={styles.resultRowRight}>
                          <Tag style={{
                            background: attempt.isPassed ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                            color: attempt.isPassed ? "#34d399" : "#f87171",
                            border: "none", borderRadius: 6, fontWeight: 600, fontSize: 11,
                          }}>
                            {attempt.isPassed ? "PASSED" : "FAILED"}
                          </Tag>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Button size="small" icon={<EyeOutlined />}
                              onClick={() => navigate(`/student/results/${attempt.id}`)}
                              style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", color: "#38bdf8", borderRadius: 6, fontSize: 11 }}>
                              {!isMobile && "View"}
                            </Button>
                            <Button size="small" icon={<ReloadOutlined />}
                              onClick={() => navigate(`/student/tests/${attempt.testId}`)}
                              style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", borderRadius: 6, fontSize: 11 }}>
                              {!isMobile && "Retake"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
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
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 64, background: "#080f1a", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 50, gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  menuBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 },
  breadcrumb: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 },
  breadcrumbRoot: { fontSize: 11, color: "#334155" },
  breadcrumbSep: { fontSize: 11, color: "#1e293b" },
  breadcrumbCurrent: { fontSize: 11, color: "#475569", fontWeight: 500 },
  pageTitle: { fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px" },
  primaryBtn: { background: "linear-gradient(135deg, #0ea5e9, #6366f1)", border: "none", borderRadius: 10, fontWeight: 600, boxShadow: "0 4px 12px rgba(14,165,233,0.25)", color: "#fff" },
  statCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 },
  statIcon: { borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  statValue: { fontWeight: 800, lineHeight: 1, marginBottom: 4, fontFamily: "'Syne', sans-serif" },
  statLabel: { color: "#64748b", fontWeight: 500 },
  summaryBanner: { display: "flex", alignItems: "center", background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 28px", marginBottom: 24, gap: 8, flexWrap: "wrap" },
  summaryItem: { display: "flex", alignItems: "center", gap: 12, padding: "0 20px" },
  summaryDivider: { width: 1, height: 40, background: "rgba(255,255,255,0.06)" },
  chartCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px" },
  chartHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  chartTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  chartSub: { fontSize: 12, color: "#475569" },
  chartLegendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" },
  chartLegendDot: { width: 8, height: 8, borderRadius: "50%" },
  resultsList: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" },
  resultsListHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  resultRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 16, flexWrap: "wrap", transition: "background 0.15s" },
  resultRowLeft: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
  resultScoreBadge: { width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0, fontFamily: "'Syne', sans-serif" },
  resultTestTitle: { color: "#f1f5f9", fontWeight: 600, fontSize: 14, marginBottom: 2 },
  resultMeta: { color: "#475569", fontSize: 12 },
  resultRowRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  emptyWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 20px" },
};