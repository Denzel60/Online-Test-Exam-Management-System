// src/pages/student/MyAttempts.jsx
import { useState, useEffect } from "react";
import { Table, Tag, Button, Avatar, Drawer, Progress, Empty } from "antd";
import {
  FileTextOutlined,
  HomeOutlined,
  BookOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined, SettingOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";

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

export const MyAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchAttempts(); }, []);

  const fetchAttempts = async () => {
    try {
      const { data } = await axiosInstance.get("/student/tests/attempts");
      setAttempts(data.attempts || []);
    } catch (err) {
      console.error("Fetch attempts error:", err);
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

  const filteredAttempts = attempts.filter((a) => {
    if (filter === "all") return true;
    if (filter === "submitted") return a.status === "submitted";
    if (filter === "in_progress") return a.status === "in_progress";
    if (filter === "passed") return a.status === "submitted" && a.isPassed;
    if (filter === "failed") return a.status === "submitted" && !a.isPassed;
    return true;
  });

  const stats = {
    total: attempts.length,
    submitted: attempts.filter((a) => a.status === "submitted").length,
    inProgress: attempts.filter((a) => a.status === "in_progress").length,
    passed: attempts.filter((a) => a.status === "submitted" && a.isPassed).length,
    failed: attempts.filter((a) => a.status === "submitted" && !a.isPassed).length,
  };

  const columns = [
    {
      title: "Test",
      dataIndex: "testTitle",
      render: (title, record) => (
        <div>
          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{title}</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
            Attempt #{record.id} · Started {new Date(record.startedAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    ...(!isMobile ? [{
      title: "Score",
      render: (_, record) => record.status === "submitted" ? (
        <div style={{ minWidth: 100 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>
              {record.score}/{record.totalPoints}
            </span>
            <span style={{ color: "#64748b", fontSize: 12 }}>
              {record.totalPoints > 0 ? Math.round((record.score / record.totalPoints) * 100) : 0}%
            </span>
          </div>
          <Progress
            percent={record.totalPoints > 0 ? Math.round((record.score / record.totalPoints) * 100) : 0}
            size="small"
            showInfo={false}
            strokeColor={record.isPassed ? "#34d399" : "#f87171"}
            trailColor="rgba(255,255,255,0.06)"
          />
        </div>
      ) : <span style={{ color: "#475569", fontSize: 12 }}>Not submitted</span>,
    }] : []),
    {
      title: "Status",
      render: (_, record) => (
        <Tag style={{
          background: record.status === "in_progress"
            ? "rgba(245,158,11,0.15)"
            : record.isPassed
            ? "rgba(52,211,153,0.15)"
            : "rgba(248,113,113,0.15)",
          color: record.status === "in_progress"
            ? "#f59e0b"
            : record.isPassed ? "#34d399" : "#f87171",
          border: "none", borderRadius: 6,
          fontWeight: 600, fontSize: 11, textTransform: "uppercase",
        }}>
          {record.status === "in_progress" ? "In Progress" : record.isPassed ? "Passed" : "Failed"}
        </Tag>
      ),
    },
    ...(!isMobile ? [{
      title: "Submitted",
      render: (_, record) => (
        <span style={{ color: "#475569", fontSize: 12 }}>
          {record.submittedAt
            ? new Date(record.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "—"}
        </span>
      ),
    }] : []),
    {
      title: "",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 6 }}>
          {record.status === "in_progress" ? (
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/student/tests/${record.testId}`)}
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: 6, fontSize: 11 }}
            >
              Resume
            </Button>
          ) : (
            <>
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/student/results/${record.id}`)}
                
                style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", borderRadius: 6, fontSize: 11 }}
              >
                {isMobile ? "" : "Results"}
              </Button>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => navigate(`/student/tests/${record.testId}`)}
                style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", borderRadius: 6, fontSize: 11 }}
              >
                {isMobile ? "" : "Retake"}
              </Button>
            </>
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
              <Button icon={<MenuOutlined />} onClick={() => setMobileMenuOpen(true)}
                style={styles.menuBtn} />
            )}
            <div>
              <div style={styles.breadcrumb}>
                <span style={styles.breadcrumbRoot}>ExamFlow</span>
                <span style={styles.breadcrumbSep}>/</span>
                <span style={styles.breadcrumbCurrent}>My Attempts</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 16 : 20 }}>My Attempts</h1>
            </div>
          </div>
          <Button
            onClick={() => navigate("/student/tests")}
            style={styles.primaryBtn}
            icon={<PlayCircleOutlined />}
            size={isMobile ? "small" : "middle"}
          >
            {isMobile ? "Take Test" : "Take a Test"}
          </Button>
        </header>

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* Stat Pills */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { key: "all", label: "All", value: stats.total, color: "#94a3b8" },
              { key: "in_progress", label: "In Progress", value: stats.inProgress, color: "#f59e0b" },
              { key: "passed", label: "Passed", value: stats.passed, color: "#34d399" },
              { key: "failed", label: "Failed", value: stats.failed, color: "#f87171" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 20, cursor: "pointer",
                  background: filter === f.key ? `${f.color}20` : "rgba(255,255,255,0.03)",
                  border: filter === f.key ? `1px solid ${f.color}60` : "1px solid rgba(255,255,255,0.06)",
                  color: filter === f.key ? f.color : "#64748b",
                  fontWeight: 600, fontSize: 13, transition: "all 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {f.label}
                <span style={{
                  background: filter === f.key ? `${f.color}30` : "rgba(255,255,255,0.06)",
                  color: filter === f.key ? f.color : "#475569",
                  borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                }}>
                  {f.value}
                </span>
              </button>
            ))}
          </div>

          {/* Summary Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: isMobile ? 10 : 14, marginBottom: 24,
          }}>
            {[
              { label: "Total Attempts", value: stats.total, icon: <FileTextOutlined />, color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
              { label: "In Progress", value: stats.inProgress, icon: <ClockCircleOutlined />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
              { label: "Passed", value: stats.passed, icon: <CheckCircleOutlined />, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
              { label: "Failed", value: stats.failed, icon: <CloseCircleOutlined />, color: "#f87171", bg: "rgba(248,113,113,0.1)" },
            ].map((card, i) => (
              <div key={i} style={styles.statCard}>
                <div style={{ ...styles.statIcon, background: card.bg, color: card.color }}>{card.icon}</div>
                <div style={{ ...styles.statValue, color: card.color }}>{card.value}</div>
                <div style={styles.statLabel}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>
                {filter === "all" ? "All Attempts" : filter === "in_progress" ? "In Progress" : filter === "passed" ? "Passed Tests" : "Failed Tests"}
                <span style={styles.tableTitleCount}>({filteredAttempts.length})</span>
              </h3>
            </div>
            {filteredAttempts.length === 0 && !loading ? (
              <Empty
                description={<span style={{ color: "#475569" }}>No attempts found</span>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                dataSource={filteredAttempts}
                columns={columns}
                pagination={{ pageSize: 10, showSizeChanger: false, style: { color: "#64748b" } }}
                loading={loading}
                rowKey="id"
                size="small"
                className="dark-table"
                scroll={{ x: isMobile ? 400 : undefined }}
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
        .dark-table .ant-table-tbody > tr:hover > td { background: rgba(56,189,248,0.03) !important; }
        .dark-table .ant-spin-dot-item { background: #38bdf8 !important; }
        .dark-table .ant-pagination-item a { color: #64748b !important; }
        .dark-table .ant-pagination-item-active { border-color: #38bdf8 !important; }
        .dark-table .ant-pagination-item-active a { color: #38bdf8 !important; }
        .dark-table .ant-pagination-prev button, .dark-table .ant-pagination-next button { color: #64748b !important; }
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
  statCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px" },
  statIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 4, fontFamily: "'Syne', sans-serif" },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: 500 },
  tableCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px", overflow: "hidden" },
  tableHeader: { marginBottom: 16 },
  tableTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  tableTitleCount: { fontSize: 13, color: "#475569", marginLeft: 8, fontWeight: 400 },
};