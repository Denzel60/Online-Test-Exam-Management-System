// src/pages/teacher/Flagged.jsx
import { useState, useEffect } from "react";
import {
  Table, Tag, Button, Avatar, Drawer, Empty,
  Spin, Modal, Input, message,
} from "antd";
import {
  FlagOutlined, BookOutlined, PlusOutlined,
  BarChartOutlined, SettingOutlined, HomeOutlined,
  LogoutOutlined, MenuOutlined, TeamOutlined,
  EyeOutlined, CheckCircleOutlined, WarningOutlined, TrophyOutlined
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
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
};

export const TeacherFlagged = () => {
  const [tests, setTests] = useState([]);
  const [flaggedAttempts, setFlaggedAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagging, setFlagging] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchFlaggedAttempts(); }, []);

  const fetchFlaggedAttempts = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/tests");
      const myTests = (data.tests || []).filter((t) => t.createdBy === user.id);
      setTests(myTests);

      // Fetch attempts for each published test
      const allFlagged = [];
      for (const test of myTests.filter((t) => t.status === "published")) {
        try {
          const res = await axiosInstance.get(`/oversight/tests/${test.id}/attempts`);
          const flagged = (res.data.attempts || []).filter((a) => a.isFlagged);
          flagged.forEach((a) => allFlagged.push({ ...a, testTitle: test.title, testId: test.id }));
        } catch (_) {}
      }
      setFlaggedAttempts(allFlagged);
    } catch (err) {
      console.error("Fetch flagged error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagAttempt = async () => {
    if (!flagReason.trim()) {
      messageApi.error("Please provide a reason for flagging");
      return;
    }
    setFlagging(true);
    try {
      await axiosInstance.patch(`/oversight/attempts/${selectedAttempt.attemptId}/flag`, {
        flagReason,
      });
      messageApi.success("Attempt flagged successfully");
      setFlagModalOpen(false);
      setFlagReason("");
      fetchFlaggedAttempts();
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Failed to flag attempt");
    } finally {
      setFlagging(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const columns = [
    {
      title: "Student",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar style={{ background: "linear-gradient(135deg, #f87171, #ef4444)", color: "#fff", fontWeight: 700, flexShrink: 0 }} size={32}>
            {record.studentName?.[0]?.toUpperCase() || "S"}
          </Avatar>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>{record.studentName}</div>
            {!isMobile && <div style={{ color: "#475569", fontSize: 11 }}>{record.studentEmail}</div>}
          </div>
        </div>
      ),
    },
    {
      title: "Test",
      dataIndex: "testTitle",
      render: (title) => <span style={{ color: "#94a3b8", fontSize: 13 }}>{title}</span>,
    },
    {
      title: "Flag Reason",
      dataIndex: "flagReason",
      render: (reason) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <WarningOutlined style={{ color: "#f87171", fontSize: 12 }} />
          <span style={{ color: "#f87171", fontSize: 12, fontWeight: 500 }}>{reason || "No reason given"}</span>
        </div>
      ),
    },
    ...(!isMobile ? [{
      title: "Score",
      render: (_, record) => {
        const pct = record.totalPoints > 0 ? Math.round((record.score / record.totalPoints) * 100) : 0;
        return <span style={{ color: record.isPassed ? "#34d399" : "#f87171", fontWeight: 700, fontSize: 13 }}>{pct}%</span>;
      },
    }, {
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
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 6, fontSize: 11 }}>
          {!isMobile && "Review"}
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
      {contextHolder}
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
                <span style={styles.breadcrumbCurrent}>Flagged</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 16 : 20 }}>Flagged Attempts</h1>
            </div>
          </div>
          <Tag style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 20, fontWeight: 700, fontSize: 13, padding: "4px 14px" }}>
            <FlagOutlined style={{ marginRight: 6 }} />{flaggedAttempts.length} Flagged
          </Tag>
        </header>

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* Info Banner */}
          <div style={styles.infoBanner}>
            <WarningOutlined style={{ color: "#f87171", fontSize: 20, flexShrink: 0 }} />
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                What are flagged attempts?
              </div>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                Flagged attempts are marked for suspicious activity such as unusually fast submissions, repeated attempts, or other anomalies. Review each one and take appropriate action.
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: isMobile ? 10 : 14, marginBottom: 20 }}>
            {[
              { label: "Total Flagged", value: flaggedAttempts.length, color: "#f87171", bg: "rgba(248,113,113,0.1)", icon: <FlagOutlined /> },
              { label: "Tests Affected", value: [...new Set(flaggedAttempts.map((a) => a.testId))].length, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: <BookOutlined /> },
              { label: "Students Flagged", value: [...new Set(flaggedAttempts.map((a) => a.studentId))].length, color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: <TeamOutlined /> },
            ].map((card, i) => (
              <div key={i} style={{ ...styles.statCard, padding: "16px 18px" }}>
                <div style={{ ...styles.statIcon, background: card.bg, color: card.color }}>{card.icon}</div>
                <div style={{ ...styles.statValue, color: card.color }}>{card.value}</div>
                <div style={styles.statLabel}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.cardTitle}>Flagged Attempts</h3>
                <p style={{ fontSize: 12, color: "#475569", margin: "3px 0 0" }}>
                  {flaggedAttempts.length} attempt{flaggedAttempts.length !== 1 ? "s" : ""} require attention
                </p>
              </div>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spin size="large" /></div>
            ) : flaggedAttempts.length === 0 ? (
              <Empty
                description={
                  <div style={{ textAlign: "center" }}>
                    <CheckCircleOutlined style={{ fontSize: 32, color: "#34d399", marginBottom: 12 }} />
                    <p style={{ color: "#475569", margin: 0 }}>No flagged attempts — all clear!</p>
                  </div>
                }
                image={null}
              />
            ) : (
              <Table
                dataSource={flaggedAttempts}
                columns={columns}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                rowKey="attemptId"
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
        .dark-table .ant-table-thead > tr > th { background: rgba(255,255,255,0.03) !important; color: #64748b !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .dark-table .ant-table-tbody > tr > td { border-bottom: 1px solid rgba(255,255,255,0.04) !important; background: transparent !important; color: #f1f5f9; padding: 14px 16px; }
        .dark-table .ant-table-tbody > tr:hover > td { background: rgba(248,113,113,0.04) !important; }
        .dark-table .ant-spin-dot-item { background: #f87171 !important; }
        .dark-table .ant-pagination-item-active { border-color: #f87171 !important; }
        .dark-table .ant-pagination-item-active a { color: #f87171 !important; }
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
  infoBanner: { display: "flex", alignItems: "flex-start", gap: 14, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 },
  statCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 },
  statIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 4, fontFamily: "'Syne', sans-serif" },
  statLabel: { fontSize: 12, color: "#64748b" },
  card: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px", overflow: "hidden" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
};