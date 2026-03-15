// src/pages/teacher/Results.jsx
import { useState, useEffect } from "react";
import {
  Table, Tag, Button, Avatar, Drawer, Select, Progress, Empty, Spin,
} from "antd";
import {
  BarChartOutlined, BookOutlined, PlusOutlined,
  FlagOutlined, SettingOutlined, HomeOutlined,
  LogoutOutlined, MenuOutlined, ArrowRightOutlined,
  TeamOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, DownloadOutlined, TrophyOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
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

export const TeacherResults = () => {
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchTests(); }, []);
  useEffect(() => { if (selectedTestId) fetchAttempts(selectedTestId); }, [selectedTestId]);

  const fetchTests = async () => {
    try {
      const { data } = await axiosInstance.get("/tests");
      const mine = (data.tests || []).filter((t) => t.createdBy === user.id && t.status === "published");
      setTests(mine);
      if (mine.length > 0) setSelectedTestId(mine[0].id);
    } catch (err) {
      console.error("Fetch tests error:", err);
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchAttempts = async (testId) => {
    setLoadingAttempts(true);
    try {
      const { data } = await axiosInstance.get(`/oversight/tests/${testId}/attempts`);
      setAttempts(data.attempts || []);
    } catch (err) {
      console.error("Fetch attempts error:", err);
      setAttempts([]);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axiosInstance.get(`/oversight/tests/${selectedTestId}/export`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `results-test-${selectedTestId}.csv`;
      a.click();
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const submitted = attempts.filter((a) => a.status === "submitted");
  const passed = submitted.filter((a) => a.isPassed);
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((s, a) => s + (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0), 0) / submitted.length)
    : 0;
  const passRate = submitted.length > 0 ? Math.round((passed.length / submitted.length) * 100) : 0;

  const scoreDistribution = [
    { range: "0-20%", count: submitted.filter((a) => { const p = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0; return p <= 20; }).length },
    { range: "21-40%", count: submitted.filter((a) => { const p = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0; return p > 20 && p <= 40; }).length },
    { range: "41-60%", count: submitted.filter((a) => { const p = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0; return p > 40 && p <= 60; }).length },
    { range: "61-80%", count: submitted.filter((a) => { const p = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0; return p > 60 && p <= 80; }).length },
    { range: "81-100%", count: submitted.filter((a) => { const p = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0; return p > 80; }).length },
  ];

  const columns = [
    {
      title: "Student",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", color: "#fff", fontWeight: 700, flexShrink: 0 }} size={32}>
            {record.studentName?.[0]?.toUpperCase() || "S"}
          </Avatar>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>{record.studentName}</div>
            {!isMobile && <div style={{ color: "#475569", fontSize: 11 }}>{record.studentEmail}</div>}
          </div>
        </div>
      ),
    },
    ...(!isMobile ? [{
      title: "Score",
      render: (_, record) => {
        const pct = record.totalPoints > 0 ? Math.round((record.score / record.totalPoints) * 100) : 0;
        return (
          <div style={{ minWidth: 100 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>{record.score}/{record.totalPoints}</span>
              <span style={{ color: "#64748b", fontSize: 12 }}>{pct}%</span>
            </div>
            <Progress percent={pct} size="small" showInfo={false}
              strokeColor={record.isPassed ? "#34d399" : "#f87171"}
              trailColor="rgba(255,255,255,0.06)" />
          </div>
        );
      },
    }] : []),
    {
      title: "Result",
      render: (_, record) => (
        <Tag style={{
          background: record.status !== "submitted" ? "rgba(245,158,11,0.15)" : record.isPassed ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
          color: record.status !== "submitted" ? "#f59e0b" : record.isPassed ? "#34d399" : "#f87171",
          border: "none", borderRadius: 6, fontWeight: 600, fontSize: 11,
        }}>
          {record.status !== "submitted" ? "In Progress" : record.isPassed ? "Passed" : "Failed"}
        </Tag>
      ),
    },
    ...(!isMobile ? [{
      title: "Submitted",
      render: (_, record) => (
        <span style={{ color: "#475569", fontSize: 12 }}>
          {record.submittedAt ? new Date(record.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
        </span>
      ),
    }] : []),
    {
      title: "",
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />}
          onClick={() => navigate(`/oversight/attempts/${record.attemptId}`)}
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: 6, fontSize: 11 }}>
          {!isMobile && "View"}
        </Button>
      ),
    },
  ];

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
      {!isMobile && <aside style={{ ...styles.sidebar, width: isTablet ? 200 : 240 }}><SidebarContent /></aside>}
      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} placement="left" width={260}
        styles={{ body: { padding: 0, background: "#080f1a" }, header: { display: "none" } }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px 0" }}><SidebarContent /></div>
      </Drawer>

      <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240 }}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            {isMobile && <Button icon={<MenuOutlined />} onClick={() => setMobileMenuOpen(true)} style={styles.menuBtn} />}
            <div>
              <div style={styles.breadcrumb}>
                <span style={styles.breadcrumbRoot}>ExamFlow</span>
                <span style={styles.breadcrumbSep}>/</span>
                <span style={styles.breadcrumbCurrent}>Results</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 16 : 20 }}>Student Results</h1>
            </div>
          </div>
          {selectedTestId && (
            <Button icon={<DownloadOutlined />} onClick={handleExport} style={styles.exportBtn} size={isMobile ? "small" : "middle"}>
              {!isMobile && "Export CSV"}
            </Button>
          )}
        </header>

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* Test Selector */}
          <div style={styles.testSelectorCard}>
            <div>
              <p style={{ color: "#f1f5f9", fontWeight: 600, margin: "0 0 4px" }}>Select a Test</p>
              <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>Choose a published test to view its results</p>
            </div>
            <Select
              value={selectedTestId}
              onChange={setSelectedTestId}
              style={{ width: isMobile ? "100%" : 320, height: 42 }}
              loading={loadingTests}
              placeholder="Select a test"
              options={tests.map((t) => ({ value: t.id, label: t.title }))}
            />
          </div>

          {loadingTests ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spin size="large" /></div>
          ) : tests.length === 0 ? (
            <div style={{ ...styles.card, padding: 60, display: "flex", justifyContent: "center" }}>
              <Empty description={
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#475569", margin: "0 0 12px" }}>No published tests yet</p>
                  <Button onClick={() => navigate("/teacher/tests/create")} style={styles.primaryBtn} icon={<PlusOutlined />}>
                    Create a Test
                  </Button>
                </div>
              } image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: 20 }}>
                {[
                  { label: "Total Attempts", value: submitted.length, icon: <TeamOutlined />, color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
                  { label: "Pass Rate", value: `${passRate}%`, icon: <TrophyOutlined />, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
                  { label: "Avg Score", value: `${avgScore}%`, icon: <BarChartOutlined />, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
                  { label: "Passed", value: passed.length, icon: <CheckCircleOutlined />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
                ].map((card, i) => (
                  <div key={i} style={{ ...styles.statCard, padding: isMobile ? "14px" : "18px 20px" }}>
                    <div style={{ ...styles.statIcon, background: card.bg, color: card.color }}>{card.icon}</div>
                    <div style={{ ...styles.statValue, color: card.color, fontSize: isMobile ? 24 : 28 }}>{card.value}</div>
                    <div style={styles.statLabel}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Score Distribution Chart */}
              {submitted.length > 0 && (
                <div style={{ ...styles.card, marginBottom: 20 }}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Score Distribution</h3>
                    <span style={styles.cardSub}>{submitted.length} submissions</span>
                  </div>
                  <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
                    <BarChart data={scoreDistribution} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: "#f1f5f9" }}
                        formatter={(val) => [val, "Students"]} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={index} fill={index >= 3 ? "#34d399" : index === 2 ? "#f59e0b" : "#f87171"} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Attempts Table */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.cardTitle}>Student Attempts</h3>
                    <p style={{ fontSize: 12, color: "#475569", margin: "3px 0 0" }}>
                      {attempts.length} total attempt{attempts.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {loadingAttempts ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spin /></div>
                ) : attempts.length === 0 ? (
                  <Empty description={<span style={{ color: "#475569" }}>No attempts yet for this test</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    dataSource={attempts}
                    columns={columns}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    rowKey="attemptId"
                    size="small"
                    className="dark-table"
                    scroll={{ x: isMobile ? 400 : undefined }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .dark-table .ant-table { background: transparent !important; }
        .dark-table .ant-table-thead > tr > th { background: rgba(255,255,255,0.03) !important; color: #64748b !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .dark-table .ant-table-tbody > tr > td { border-bottom: 1px solid rgba(255,255,255,0.04) !important; background: transparent !important; color: #f1f5f9; padding: 14px 16px; }
        .dark-table .ant-table-tbody > tr:hover > td { background: rgba(245,158,11,0.04) !important; }
        .dark-table .ant-spin-dot-item { background: #f59e0b !important; }
        .dark-table .ant-pagination-item-active { border-color: #f59e0b !important; }
        .dark-table .ant-pagination-item-active a { color: #f59e0b !important; }
        .ant-select-selector { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.08) !important; color: #94a3b8 !important; border-radius: 10px !important; }
        .ant-select-arrow { color: #475569 !important; }
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
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  menuBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 },
  breadcrumb: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 },
  breadcrumbRoot: { fontSize: 11, color: "#334155" },
  breadcrumbSep: { fontSize: 11, color: "#1e293b" },
  breadcrumbCurrent: { fontSize: 11, color: "#475569", fontWeight: 500 },
  pageTitle: { fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  exportBtn: { background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399", borderRadius: 10, fontWeight: 600 },
  primaryBtn: { background: "linear-gradient(135deg, #f59e0b, #f97316)", border: "none", color: "#0f172a", borderRadius: 10, fontWeight: 700, height: 40 },
  testSelectorCard: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 20px", marginBottom: 20, gap: 16, flexWrap: "wrap" },
  statCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 },
  statIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12 },
  statValue: { fontWeight: 800, lineHeight: 1, marginBottom: 4, fontFamily: "'Syne', sans-serif" },
  statLabel: { fontSize: 12, color: "#64748b" },
  card: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px", overflow: "hidden" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  cardSub: { fontSize: 12, color: "#475569" },
};