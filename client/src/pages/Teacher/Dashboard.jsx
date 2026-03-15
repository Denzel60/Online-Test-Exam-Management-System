// src/pages/teacher/Dashboard.jsx
import { useState, useEffect } from "react";
import { Table, Tag, Button, Avatar, Drawer, Progress } from "antd";
import {
  BookOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  HomeOutlined,
  FileTextOutlined,
  BarChartOutlined,
  MenuOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  TeamOutlined,
  EditOutlined,
  EyeOutlined,
  FlagOutlined,
  SettingOutlined,
  TrophyOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

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
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
};

export const TeacherDashboard = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalTests: 0,
    publishedTests: 0,
    draftTests: 0,
    totalAttempts: 0,
    flaggedAttempts: 0,
    avgPassRate: 0,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data } = await axiosInstance.get("/tests");
      const allTests = data.tests || [];

      // Filter only this teacher's tests
      const myTests = allTests.filter((t) => t.createdBy === user.id);

      const published = myTests.filter((t) => t.status === "published");
      const drafts = myTests.filter((t) => t.status === "draft");

      setTests(myTests);
      setStats({
        totalTests: myTests.length,
        publishedTests: published.length,
        draftTests: drafts.length,
        totalAttempts: 0,
        flaggedAttempts: 0,
        avgPassRate: 0,
      });
    } catch (err) {
      console.error("Teacher dashboard fetch error:", err);
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

  // ── MOCK CHART DATA (replace with real data from oversight APIs)
  const attemptTrend = [
    { day: "Mon", attempts: 8 },
    { day: "Tue", attempts: 14 },
    { day: "Wed", attempts: 11 },
    { day: "Thu", attempts: 22 },
    { day: "Fri", attempts: 18 },
    { day: "Sat", attempts: 6 },
    { day: "Sun", attempts: 4 },
  ];

  const testPerformance = tests.slice(0, 5).map((t, i) => ({
    name: t.title?.length > 12 ? t.title.slice(0, 12) + "…" : t.title,
    passRate: Math.floor(Math.random() * 40) + 50,
  }));

  const statCards = [
    { label: "My Tests", value: stats.totalTests, icon: <BookOutlined />, color: "#38bdf8", bg: "rgba(56,189,248,0.1)", path: "/teacher/tests", action: "View All" },
    { label: "Published", value: stats.publishedTests, icon: <CheckCircleOutlined />, color: "#34d399", bg: "rgba(52,211,153,0.1)", path: "/teacher/tests", action: "Manage" },
    { label: "Drafts", value: stats.draftTests, icon: <EditOutlined />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", path: "/teacher/tests", action: "Continue" },
    { label: "Flagged", value: stats.flaggedAttempts, icon: <FlagOutlined />, color: "#f87171", bg: "rgba(248,113,113,0.1)", path: "/teacher/flagged", action: "Review" },
  ];

  const testColumns = [
    {
      title: "Test",
      dataIndex: "title",
      render: (title, record) => (
        <div>
          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{title}</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
            {record.timeLimit ? `${record.timeLimit} min` : "No limit"} ·{" "}
            Max {record.maxAttempts} attempt{record.maxAttempts !== 1 ? "s" : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag style={{
          background: status === "published"
            ? "rgba(52,211,153,0.15)"
            : status === "draft"
            ? "rgba(245,158,11,0.15)"
            : "rgba(100,116,139,0.15)",
          color: status === "published" ? "#34d399" : status === "draft" ? "#f59e0b" : "#94a3b8",
          border: "none", borderRadius: 6, fontWeight: 600,
          fontSize: 11, textTransform: "uppercase",
        }}>
          {status}
        </Tag>
      ),
    },
    ...(!isMobile ? [{
      title: "Pass Mark",
      dataIndex: "passMarkPercent",
      render: (p) => (
        <span style={{ color: "#64748b", fontSize: 12 }}>{p ?? 50}%</span>
      ),
    }] : []),
    {
      title: "",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => navigate(`/teacher/tests/${record.id}`)}
            style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", borderRadius: 6, fontSize: 11 }}>
            {!isMobile && "View"}
          </Button>
          {record.status === "draft" && (
            <Button size="small" icon={<CheckCircleOutlined />}
              onClick={() => navigate(`/teacher/tests/${record.id}`)}
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", borderRadius: 6, fontSize: 11 }}>
              {!isMobile && "Publish"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const SidebarContent = () => (
    <>
      <div style={styles.sidebarLogo}>
        <span>📝</span>
        <span style={styles.logoText}>ExamFlow</span>
      </div>

      {/* Teacher Profile */}
      <div style={styles.sidebarProfile}>
        <Avatar
          style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff", fontWeight: 700, fontSize: 18 }}
          size={52}
        >
          {user?.name?.[0]?.toUpperCase() || "T"}
        </Avatar>
        <div style={styles.sidebarProfileName}>{user?.name || "Teacher"}</div>
        <div style={styles.sidebarProfileEmail}>{user?.email || ""}</div>
        <div style={styles.sidebarProfileBadge}>
          <TeamOutlined style={{ fontSize: 10 }} /> Teacher
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
              <span style={{ fontSize: 15, display: "flex", alignItems: "center", color: isActive ? "#f59e0b" : "#64748b" }}>
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
              <Button icon={<MenuOutlined />} onClick={() => setMobileMenuOpen(true)} style={styles.menuBtn} />
            )}
            <div>
              <div style={styles.breadcrumb}>
                <span style={styles.breadcrumbRoot}>ExamFlow</span>
                <span style={styles.breadcrumbSep}>/</span>
                <span style={styles.breadcrumbCurrent}>Dashboard</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 16 : 20 }}>
                Teacher Dashboard
              </h1>
            </div>
          </div>
          <div style={styles.headerRight}>
            {!isMobile && (
              <div style={styles.headerUserInfo}>
                <Avatar
                  style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff", fontWeight: 700 }}
                  size={32}
                >
                  {user?.name?.[0]?.toUpperCase() || "T"}
                </Avatar>
                <span style={styles.headerUserName}>{user?.name}</span>
              </div>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/teacher/tests/create")}
              style={styles.createBtn}
              size={isMobile ? "small" : "middle"}
            >
              {isMobile ? "Create" : "Create Test"}
            </Button>
          </div>
        </header>

        {/* ── CONTENT */}
        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* ── WELCOME BANNER */}
          <div style={{ ...styles.welcomeBanner, flexDirection: isMobile ? "column" : "row" }}>
            <div style={styles.welcomeLeft}>
              <div style={styles.welcomeEmoji}>👩‍🏫</div>
              <div>
                <h2 style={{ ...styles.welcomeTitle, fontSize: isMobile ? 16 : 20 }}>
                  Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
                  {user?.name?.split(" ")[0] || "Teacher"} 👋
                </h2>
                <p style={styles.welcomeSub}>
                  You have{" "}
                  <span style={{ color: "#34d399", fontWeight: 700 }}>{stats.publishedTests} published</span>{" "}
                  and{" "}
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>{stats.draftTests} draft</span>{" "}
                  test{stats.totalTests !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {!isMobile && (
              <div style={styles.welcomeActions}>
                <Button
                  onClick={() => navigate("/teacher/tests/create")}
                  style={styles.welcomeBtn}
                  icon={<PlusOutlined />}
                >
                  New Test
                </Button>
                <Button
                  onClick={() => navigate("/teacher/results")}
                  style={styles.welcomeBtnOutline}
                  icon={<BarChartOutlined />}
                >
                  View Results
                </Button>
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
                <div style={{ ...styles.statValue, color: card.color, fontSize: isMobile ? 26 : 32 }}>
                  {card.value}
                </div>
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
            {/* Attempt Activity */}
            <div style={{ ...styles.chartCard, flex: 1 }}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Student Attempt Activity</h3>
                <span style={styles.chartSub}>This week</span>
              </div>
              <ResponsiveContainer width="100%" height={isMobile ? 150 : 190}>
                <AreaChart data={attemptTrend}>
                  <defs>
                    <linearGradient id="teacherGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: "#f1f5f9" }} />
                  <Area type="monotone" dataKey="attempts" stroke="#f59e0b" strokeWidth={2} fill="url(#teacherGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Test Pass Rates */}
            {testPerformance.length > 0 && (
              <div style={{ ...styles.chartCard, flex: isMobile || isTablet ? 1 : "0 0 300px" }}>
                <div style={styles.chartHeader}>
                  <h3 style={styles.chartTitle}>Pass Rates</h3>
                  <span style={styles.chartSub}>Per test</span>
                </div>
                <ResponsiveContainer width="100%" height={isMobile ? 150 : 190}>
                  <BarChart data={testPerformance} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: "#f1f5f9" }}
                      formatter={(val) => [`${val}%`, "Pass Rate"]}
                    />
                    <Bar dataKey="passRate" radius={[6, 6, 0, 0]}>
                      {testPerformance.map((entry, index) => (
                        <Cell key={index} fill={entry.passRate >= 60 ? "#34d399" : "#f87171"} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── QUICK ACTIONS */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: isMobile ? 10 : 12,
            marginBottom: isMobile ? 16 : 24,
          }}>
            {[
              { icon: "📝", label: "Create Test", desc: "Build a new test", path: "/teacher/tests/create", color: "#f59e0b" },
              { icon: "📋", label: "My Tests", desc: "Manage your tests", path: "/teacher/tests", color: "#38bdf8" },
              { icon: "📊", label: "View Results", desc: "Student performance", path: "/teacher/results", color: "#34d399" },
              { icon: "🚩", label: "Flagged", desc: "Review suspicious attempts", path: "/teacher/flagged", color: "#f87171" },
            ].map((item) => (
              <div
                key={item.label}
                style={{ ...styles.quickNavCard, padding: isMobile ? "12px 14px" : "16px 18px", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 8 : 14 }}
                onClick={() => navigate(item.path)}
              >
                <span style={{ fontSize: isMobile ? 20 : 22, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: item.color, marginBottom: 2 }}>
                    {item.label}
                  </div>
                  {!isMobile && <div style={{ fontSize: 11, color: "#475569" }}>{item.desc}</div>}
                </div>
                {!isMobile && <ArrowRightOutlined style={{ color: "#475569", fontSize: 12 }} />}
              </div>
            ))}
          </div>

          {/* ── MY TESTS TABLE */}
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <div>
                <h3 style={styles.chartTitle}>My Tests</h3>
                <p style={{ fontSize: 12, color: "#475569", margin: "2px 0 0" }}>
                  {stats.totalTests} test{stats.totalTests !== 1 ? "s" : ""} created
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/teacher/tests/create")}
                  style={styles.createSmallBtn}
                >
                  {!isMobile && "New Test"}
                </Button>
                <Button
                  size="small"
                  onClick={() => navigate("/teacher/tests")}
                  style={styles.viewAllBtn}
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                >
                  View All
                </Button>
              </div>
            </div>

            {tests.length === 0 && !loading ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: 36, opacity: 0.3 }}>📋</span>
                <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>
                  No tests yet —{" "}
                  <span
                    style={{ color: "#f59e0b", cursor: "pointer", fontWeight: 600 }}
                    onClick={() => navigate("/teacher/tests/create")}
                  >
                    create your first test
                  </span>
                </p>
              </div>
            ) : (
              <Table
                dataSource={tests.slice(0, 5)}
                columns={testColumns}
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
          background: transparent !important; color: #f1f5f9; padding: 14px 16px;
        }
        .dark-table .ant-table-tbody > tr:hover > td { background: rgba(245,158,11,0.04) !important; }
        .dark-table .ant-spin-dot-item { background: #f59e0b !important; }
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
  sidebarProfileName: { color: "#f1f5f9", fontWeight: 700, fontSize: 14, textAlign: "center" },
  sidebarProfileEmail: { color: "#475569", fontSize: 11, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", paddingInline: 8 },
  sidebarProfileBadge: { display: "flex", alignItems: "center", gap: 4, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 },
  nav: { flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column", gap: 2 },
  navItem: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 500, transition: "all 0.15s", position: "relative", userSelect: "none" },
  navItemActive: { background: "rgba(245,158,11,0.08)", color: "#f59e0b" },
  navActiveBar: { position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: "#f59e0b", borderRadius: 2 },
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
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  headerUserInfo: { display: "flex", alignItems: "center", gap: 8 },
  headerUserName: { fontSize: 13, fontWeight: 600, color: "#94a3b8" },
  createBtn: { background: "linear-gradient(135deg, #f59e0b, #f97316)", border: "none", borderRadius: 10, fontWeight: 600, boxShadow: "0 4px 12px rgba(245,158,11,0.3)", color: "#0f172a" },
  welcomeBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #1a1500 0%, #0d1829 100%)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 18, padding: "22px 28px", marginBottom: 20, gap: 16 },
  welcomeLeft: { display: "flex", alignItems: "center", gap: 16 },
  welcomeEmoji: { fontSize: 40, flexShrink: 0 },
  welcomeTitle: { fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px", fontFamily: "'Syne', sans-serif" },
  welcomeSub: { fontSize: 13, color: "#64748b", margin: 0 },
  welcomeActions: { display: "flex", gap: 10, flexShrink: 0 },
  welcomeBtn: { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: 10, fontWeight: 600, height: 38 },
  welcomeBtnOutline: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 10, fontWeight: 600, height: 38 },
  statCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, transition: "all 0.2s" },
  statCardTop: { marginBottom: 12 },
  statIcon: { borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" },
  statValue: { fontWeight: 800, lineHeight: 1, marginBottom: 4, fontFamily: "'Syne', sans-serif" },
  statLabel: { color: "#64748b", fontWeight: 500, marginBottom: 8 },
  statAction: { fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 },
  chartCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px" },
  chartHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  chartTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  chartSub: { fontSize: 12, color: "#475569" },
  quickNavCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, cursor: "pointer", transition: "all 0.15s", display: "flex" },
  tableCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px", overflow: "hidden" },
  tableHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  createSmallBtn: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", borderRadius: 8, fontWeight: 600 },
  viewAllBtn: { background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", color: "#38bdf8", borderRadius: 8, fontSize: 12 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", gap: 12 },
};