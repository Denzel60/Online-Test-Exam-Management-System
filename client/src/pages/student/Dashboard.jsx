// src/pages/student/Dashboard.jsx
import { useState, useEffect } from "react";
import { Table, Tag, Button, Avatar, Drawer, Progress } from "antd";
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  LogoutOutlined,
  HomeOutlined,
  FileTextOutlined,
  BarChartOutlined,
  MenuOutlined,
  ArrowRightOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";

const NAV_ITEMS = [
  { icon: <HomeOutlined />, label: "Dashboard", path: "/student/dashboard" },
  { icon: <BookOutlined />, label: "Available Tests", path: "/student/tests" },
  { icon: <FileTextOutlined />, label: "My Attempts", path: "/student/attempts" },
  { icon: <BarChartOutlined />, label: "My Results", path: "/student/results" },
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

export const StudentDashboard = () => {
  const [availableTests, setAvailableTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        axiosInstance.get("/student/tests"),
        axiosInstance.get("/student/tests/attempts"),
      ]);
      setAvailableTests(testsRes.data.tests || []);
      setAttempts(attemptsRes.data.attempts || []);
    } catch (err) {
      console.error("Student dashboard fetch error:", err);
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
  const submittedAttempts = attempts.filter((a) => a.status === "submitted");
  const passedAttempts = submittedAttempts.filter((a) => a.isPassed);
  const inProgressAttempts = attempts.filter((a) => a.status === "in_progress");
  const avgScore = submittedAttempts.length > 0
    ? Math.round(submittedAttempts.reduce((sum, a) => sum + (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0), 0) / submittedAttempts.length)
    : 0;

  const statCards = [
    { label: "Available Tests", value: availableTests.length, icon: <BookOutlined />, color: "#38bdf8", bg: "rgba(56,189,248,0.1)", path: "/student/tests", action: "Browse" },
    { label: "Tests Completed", value: submittedAttempts.length, icon: <CheckCircleOutlined />, color: "#34d399", bg: "rgba(52,211,153,0.1)", path: "/student/results", action: "View" },
    { label: "In Progress", value: inProgressAttempts.length, icon: <ClockCircleOutlined />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", path: "/student/attempts", action: "Resume" },
    { label: "Average Score", value: `${avgScore}%`, icon: <TrophyOutlined />, color: "#a78bfa", bg: "rgba(167,139,250,0.1)", path: "/student/results", action: "Details" },
  ];

  // ── SCORE TREND (last 7 attempts)
  const scoreTrend = submittedAttempts.slice(-7).map((a, i) => ({
    attempt: `#${i + 1}`,
    score: a.totalPoints > 0 ? Math.round((a.score / a.totalPoints) * 100) : 0,
  }));

  // ── RADIAL DATA for pass rate
  const passRate = submittedAttempts.length > 0
    ? Math.round((passedAttempts.length / submittedAttempts.length) * 100)
    : 0;

  const radialData = [{ name: "Pass Rate", value: passRate, fill: "#34d399" }];

  const attemptColumns = [
    {
      title: "Test",
      dataIndex: "testTitle",
      render: (title) => (
        <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>{title}</span>
      ),
    },
    ...(!isMobile ? [{
      title: "Score",
      render: (_, record) => record.status === "submitted" ? (
        <div style={{ minWidth: 80 }}>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            {record.score}/{record.totalPoints}
          </div>
          <Progress
            percent={record.totalPoints > 0 ? Math.round((record.score / record.totalPoints) * 100) : 0}
            size="small"
            showInfo={false}
            strokeColor={record.isPassed ? "#34d399" : "#f87171"}
            trailColor="rgba(255,255,255,0.06)"
          />
        </div>
      ) : <span style={{ color: "#64748b", fontSize: 12 }}>—</span>,
    }] : []),
    {
      title: "Status",
      dataIndex: "status",
      render: (status, record) => (
        <Tag style={{
          background: status === "submitted"
            ? record.isPassed ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"
            : "rgba(245,158,11,0.15)",
          color: status === "submitted"
            ? record.isPassed ? "#34d399" : "#f87171"
            : "#f59e0b",
          border: "none", borderRadius: 6, fontWeight: 600,
          fontSize: 11, textTransform: "uppercase",
        }}>
          {status === "submitted" ? (record.isPassed ? "Passed" : "Failed") : "In Progress"}
        </Tag>
      ),
    },
    {
      title: "",
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => record.status === "submitted"
            ? navigate(`/student/results/${record.id}`)
            : navigate(`/student/tests/${record.testId}`)
          }
          style={{
            background: record.status === "submitted"
              ? "rgba(56,189,248,0.1)" : "rgba(245,158,11,0.1)",
            border: `1px solid ${record.status === "submitted"
              ? "rgba(56,189,248,0.3)" : "rgba(245,158,11,0.3)"}`,
            color: record.status === "submitted" ? "#38bdf8" : "#f59e0b",
            borderRadius: 6, fontSize: 11,
          }}
        >
          {record.status === "submitted" ? "Results" : "Resume"}
        </Button>
      ),
    },
  ];

  const SidebarContent = () => (
    <>
      <div style={styles.sidebarLogo}>
        <span style={styles.logoIcon}>📝</span>
        <span style={styles.logoText}>ExamFlow</span>
      </div>

      {/* Student profile card in sidebar */}
      <div style={styles.sidebarProfile}>
        <Avatar style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", color: "#fff", fontWeight: 700, fontSize: 18 }} size={52}>
          {user?.name?.[0]?.toUpperCase() || "S"}
        </Avatar>
        <div style={styles.sidebarProfileName}>{user?.name || "Student"}</div>
        <div style={styles.sidebarProfileEmail}>{user?.email || ""}</div>
        <div style={styles.sidebarProfileBadge}>
          <StarOutlined style={{ fontSize: 10 }} /> Student
        </div>
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.label}
              onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
            >
              <span style={{ fontSize: 16, display: "flex", alignItems: "center", color: isActive ? "#38bdf8" : "#64748b" }}>
                {item.icon}
              </span>
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

      {/* ── MAIN */}
      <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240 }}>

        {/* ── HEADER */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            {isMobile && (
              <Button
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                style={styles.menuBtn}
              />
            )}
            <div>
              <div style={styles.breadcrumb}>
                <span style={styles.breadcrumbRoot}>ExamFlow</span>
                <span style={styles.breadcrumbSep}>/</span>
                <span style={styles.breadcrumbCurrent}>Dashboard</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 16 : 18 }}>Student Dashboard</h1>
            </div>
          </div>
          <div style={styles.headerRight}>
            {!isMobile && (
              <div style={styles.headerUserInfo}>
                <Avatar style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", color: "#fff", fontWeight: 700 }} size={32}>
                  {user?.name?.[0]?.toUpperCase() || "S"}
                </Avatar>
                <span style={styles.headerUserName}>{user?.name}</span>
              </div>
            )}
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate("/student/tests")}
              style={styles.startTestBtn}
              size={isMobile ? "small" : "middle"}
            >
              {isMobile ? "Take Test" : "Start a Test"}
            </Button>
          </div>
        </header>

        {/* ── CONTENT */}
        <div style={{ ...styles.content, padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* ── WELCOME BANNER */}
          <div style={{ ...styles.welcomeBanner, flexDirection: isMobile ? "column" : "row" }}>
            <div style={styles.welcomeLeft}>
              <div style={styles.welcomeEmoji}>🎓</div>
              <div>
                <h2 style={{ ...styles.welcomeTitle, fontSize: isMobile ? 16 : 20 }}>
                  Hey {user?.name?.split(" ")[0] || "Student"}! Ready to ace your next test?
                </h2>
                <p style={styles.welcomeSub}>
                  You have <span style={{ color: "#38bdf8", fontWeight: 700 }}>{availableTests.length} test{availableTests.length !== 1 ? "s" : ""}</span> available
                  {inProgressAttempts.length > 0 && (
                    <> and <span style={{ color: "#f59e0b", fontWeight: 700 }}>{inProgressAttempts.length} in progress</span></>
                  )}
                </p>
              </div>
            </div>
            {!isMobile && (
              <div style={styles.welcomeStats}>
                <div style={styles.welcomeStat}>
                  <span style={{ ...styles.welcomeStatValue, color: "#34d399" }}>{passRate}%</span>
                  <span style={styles.welcomeStatLabel}>Pass Rate</span>
                </div>
                <div style={styles.welcomeStatDivider} />
                <div style={styles.welcomeStat}>
                  <span style={{ ...styles.welcomeStatValue, color: "#a78bfa" }}>{avgScore}%</span>
                  <span style={styles.welcomeStatLabel}>Avg Score</span>
                </div>
                <div style={styles.welcomeStatDivider} />
                <div style={styles.welcomeStat}>
                  <span style={{ ...styles.welcomeStatValue, color: "#f59e0b" }}>{submittedAttempts.length}</span>
                  <span style={styles.welcomeStatLabel}>Completed</span>
                </div>
              </div>
            )}
          </div>

          {/* ── STAT CARDS */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: isMobile ? 10 : 16,
            marginBottom: isMobile ? 16 : 24,
          }}>
            {statCards.map((card, i) => (
              <div
                key={i}
                style={{ ...styles.statCard, padding: isMobile ? "14px" : "20px", cursor: "pointer" }}
                onClick={() => navigate(card.path)}
              >
                <div style={styles.statCardTop}>
                  <div style={{ ...styles.statIcon, background: card.bg, color: card.color, width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, fontSize: isMobile ? 14 : 17 }}>
                    {card.icon}
                  </div>
                </div>
                <div style={{ ...styles.statValue, color: card.color, fontSize: isMobile ? 26 : 32 }}>{card.value}</div>
                <div style={{ ...styles.statLabel, fontSize: isMobile ? 11 : 12 }}>{card.label}</div>
                <div style={{ ...styles.statAction, color: card.color }}>
                  {card.action} <ArrowRightOutlined style={{ fontSize: 9 }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── CHARTS ROW */}
          <div style={{
            display: "flex",
            flexDirection: isMobile || isTablet ? "column" : "row",
            gap: isMobile ? 12 : 16,
            marginBottom: isMobile ? 16 : 24,
          }}>
            {/* Score Trend */}
            <div style={{ ...styles.chartCard, flex: 1 }}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Score Trend</h3>
                <span style={styles.chartSubtitle}>Last {scoreTrend.length} attempts</span>
              </div>
              {scoreTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={isMobile ? 150 : 190}>
                  <AreaChart data={scoreTrend}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="attempt" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 8, color: "#f1f5f9" }}
                      formatter={(val) => [`${val}%`, "Score"]}
                    />
                    <Area type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2} fill="url(#scoreGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={styles.emptyChart}>
                  <span style={styles.emptyChartIcon}>📊</span>
                  <span style={styles.emptyChartText}>No attempts yet — take a test to see your trend</span>
                </div>
              )}
            </div>

            {/* Pass Rate Radial */}
            <div style={{ ...styles.chartCard, flex: isMobile || isTablet ? 1 : "0 0 260px" }}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Pass Rate</h3>
                <span style={styles.chartSubtitle}>All time</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                <div style={{ position: "relative", width: 160, height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      data={[{ value: passRate, fill: "#34d399" }, { value: 100 - passRate, fill: "rgba(255,255,255,0.04)" }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar dataKey="value" cornerRadius={6} background={false} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={styles.radialCenter}>
                    <span style={styles.radialValue}>{passRate}%</span>
                    <span style={styles.radialLabel}>Pass Rate</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#34d399", fontWeight: 700, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>{passedAttempts.length}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>Passed</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#f87171", fontWeight: 700, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>{submittedAttempts.length - passedAttempts.length}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>Failed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── AVAILABLE TESTS */}
          <div style={{ ...styles.sectionCard, marginBottom: isMobile ? 12 : 16 }}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.chartTitle}>Available Tests</h3>
              <Button size="small" onClick={() => navigate("/student/tests")} style={styles.viewAllBtn} icon={<ArrowRightOutlined />} iconPosition="end">
                View All
              </Button>
            </div>
            {availableTests.length === 0 && !loading ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <span style={styles.emptyText}>No tests available right now. Check back later.</span>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                gap: isMobile ? 10 : 12,
              }}>
                {availableTests.slice(0, isMobile ? 3 : 6).map((test) => {
                  const inProgress = inProgressAttempts.find((a) => a.testId === test.id);
                  return (
                    <div key={test.id} style={styles.testCard}>
                      <div style={styles.testCardTop}>
                        <div style={styles.testIconWrap}>
                          <BookOutlined style={{ color: "#38bdf8", fontSize: 16 }} />
                        </div>
                        {inProgress && (
                          <Tag style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>
                            IN PROGRESS
                          </Tag>
                        )}
                      </div>
                      <h4 style={styles.testCardTitle}>{test.title}</h4>
                      <p style={styles.testCardDesc}>{test.description || "No description provided"}</p>
                      <div style={styles.testCardMeta}>
                        {test.timeLimit && (
                          <span style={styles.testMetaItem}>
                            <ClockCircleOutlined style={{ fontSize: 10 }} /> {test.timeLimit}m
                          </span>
                        )}
                        <span style={styles.testMetaItem}>
                          <TrophyOutlined style={{ fontSize: 10 }} /> {test.maxAttempts} attempt{test.maxAttempts !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <Button
                        block
                        onClick={() => navigate(`/student/tests/${test.id}`)}
                        style={{
                          ...styles.testCardBtn,
                          background: inProgress ? "rgba(245,158,11,0.1)" : "rgba(56,189,248,0.1)",
                          border: `1px solid ${inProgress ? "rgba(245,158,11,0.3)" : "rgba(56,189,248,0.3)"}`,
                          color: inProgress ? "#f59e0b" : "#38bdf8",
                        }}
                        icon={inProgress ? <PlayCircleOutlined /> : <ArrowRightOutlined />}
                      >
                        {inProgress ? "Resume Test" : "Start Test"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RECENT ATTEMPTS TABLE */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.chartTitle}>Recent Attempts</h3>
              <Button size="small" onClick={() => navigate("/student/attempts")} style={styles.viewAllBtn} icon={<ArrowRightOutlined />} iconPosition="end">
                View All
              </Button>
            </div>
            {attempts.length === 0 && !loading ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📝</span>
                <span style={styles.emptyText}>You haven't attempted any tests yet. Start one above!</span>
              </div>
            ) : (
              <Table
                dataSource={attempts.slice(0, 5)}
                columns={attemptColumns}
                pagination={false}
                loading={loading}
                rowKey="id"
                size="small"
                className="dark-table"
                scroll={{ x: isMobile ? 300 : undefined }}
              />
            )}
          </div>

        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .dark-table .ant-table { background: transparent !important; }
        .dark-table .ant-table-thead > tr > th {
          background: rgba(255,255,255,0.03) !important; color: #64748b !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
        }
        .dark-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(255,255,255,0.04) !important;
          background: transparent !important; color: #f1f5f9;
        }
        .dark-table .ant-table-tbody > tr:hover > td { background: rgba(56,189,248,0.04) !important; }
        .dark-table .ant-spin-dot-item { background: #38bdf8 !important; }
        .ant-progress-bg { transition: width 0.6s ease !important; }
      `}</style>
    </div>
  );
};

const styles = {
  wrapper: { display: "flex", minHeight: "100vh", background: "#060d18", fontFamily: "'DM Sans', sans-serif" },

  // ── SIDEBAR
  sidebar: {
    background: "#080f1a", borderRight: "1px solid rgba(255,255,255,0.05)",
    display: "flex", flexDirection: "column", padding: "24px 0",
    position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100, overflowY: "auto",
  },
  sidebarLogo: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 16,
  },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 19, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" },
  sidebarProfile: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "4px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 12, gap: 6,
  },
  sidebarProfileName: { color: "#f1f5f9", fontWeight: 700, fontSize: 14, textAlign: "center" },
  sidebarProfileEmail: { color: "#475569", fontSize: 11, textAlign: "center" },
  sidebarProfileBadge: {
    display: "flex", alignItems: "center", gap: 4,
    background: "rgba(56,189,248,0.1)", color: "#38bdf8",
    border: "1px solid rgba(56,189,248,0.2)", borderRadius: 20,
    padding: "3px 10px", fontSize: 11, fontWeight: 600,
  },
  nav: { flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column", gap: 2 },
  navItem: {
    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
    borderRadius: 10, cursor: "pointer", color: "#64748b", fontSize: 14,
    fontWeight: 500, transition: "all 0.15s", position: "relative", userSelect: "none",
  },
  navItemActive: { background: "rgba(56,189,248,0.08)", color: "#38bdf8" },
  navActiveBar: { position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: "#38bdf8", borderRadius: 2 },
  sidebarFooter: { padding: "14px 14px 0", borderTop: "1px solid rgba(255,255,255,0.05)" },
  logoutBtn: { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 8, height: 34 },

  // ── HEADER
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px", height: 64,
    background: "#080f1a", borderBottom: "1px solid rgba(255,255,255,0.05)",
    position: "sticky", top: 0, zIndex: 50, gap: 12,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  menuBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 },
  breadcrumb: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 },
  breadcrumbRoot: { fontSize: 11, color: "#334155" },
  breadcrumbSep: { fontSize: 11, color: "#1e293b" },
  breadcrumbCurrent: { fontSize: 11, color: "#475569", fontWeight: 500 },
  pageTitle: { fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  headerUserInfo: { display: "flex", alignItems: "center", gap: 8 },
  headerUserName: { fontSize: 13, fontWeight: 600, color: "#94a3b8" },
  startTestBtn: {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    border: "none", borderRadius: 10, fontWeight: 600,
    boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
  },

  // ── CONTENT
  content: {},

  // ── WELCOME BANNER
  welcomeBanner: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #091525 100%)",
    border: "1px solid rgba(56,189,248,0.12)", borderRadius: 18,
    padding: "22px 28px", marginBottom: 20, gap: 16,
  },
  welcomeLeft: { display: "flex", alignItems: "center", gap: 16 },
  welcomeEmoji: { fontSize: 40, flexShrink: 0 },
  welcomeTitle: { fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px", fontFamily: "'Syne', sans-serif" },
  welcomeSub: { fontSize: 13, color: "#64748b", margin: 0 },
  welcomeStats: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  welcomeStat: { display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px" },
  welcomeStatValue: { fontSize: 22, fontWeight: 800, lineHeight: 1, fontFamily: "'Syne', sans-serif" },
  welcomeStatLabel: { fontSize: 11, color: "#475569", marginTop: 3 },
  welcomeStatDivider: { width: 1, height: 36, background: "rgba(255,255,255,0.06)" },

  // ── STAT CARDS
  statCard: {
    background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16, transition: "all 0.2s",
  },
  statCardTop: { marginBottom: 12 },
  statIcon: { borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" },
  statValue: { fontWeight: 800, lineHeight: 1, marginBottom: 4, fontFamily: "'Syne', sans-serif" },
  statLabel: { color: "#64748b", fontWeight: 500, marginBottom: 8 },
  statAction: { fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 },

  // ── CHARTS
  chartCard: {
    background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16, padding: "20px",
  },
  chartHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  chartTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  chartSubtitle: { fontSize: 12, color: "#475569" },
  emptyChart: {
    height: 160, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  emptyChartIcon: { fontSize: 32, opacity: 0.3 },
  emptyChartText: { fontSize: 12, color: "#334155", textAlign: "center", maxWidth: 200 },

  // ── RADIAL CENTER
  radialCenter: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  radialValue: { fontSize: 22, fontWeight: 800, color: "#34d399", fontFamily: "'Syne', sans-serif", lineHeight: 1 },
  radialLabel: { fontSize: 10, color: "#475569", marginTop: 2 },

  // ── SECTION CARD
  sectionCard: {
    background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16, padding: "20px",
  },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  viewAllBtn: { background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", color: "#38bdf8", borderRadius: 8, fontSize: 12 },

  // ── TEST CARDS
  testCard: {
    background: "#0a1525", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 14, padding: "16px", display: "flex",
    flexDirection: "column", gap: 10, transition: "border-color 0.15s",
  },
  testCardTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  testIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    background: "rgba(56,189,248,0.1)", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  testCardTitle: { color: "#f1f5f9", fontWeight: 700, fontSize: 14, margin: 0, fontFamily: "'Syne', sans-serif" },
  testCardDesc: { color: "#475569", fontSize: 12, margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  testCardMeta: { display: "flex", gap: 12 },
  testMetaItem: { display: "flex", alignItems: "center", gap: 4, color: "#475569", fontSize: 11 },
  testCardBtn: { borderRadius: 10, fontWeight: 600, height: 36, fontSize: 13 },

  // ── EMPTY STATE
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "32px 20px", gap: 10,
  },
  emptyIcon: { fontSize: 36, opacity: 0.3 },
  emptyText: { fontSize: 13, color: "#334155", textAlign: "center" },

  main: { flex: 1, minHeight: "100vh", background: "#060d18" },
};