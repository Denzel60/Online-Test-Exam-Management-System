// src/pages/admin/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { Table, Tag, Button, Avatar, Drawer } from "antd";
import {
  CheckCircleOutlined, LogoutOutlined, SettingOutlined,
  RiseOutlined, TeamOutlined, BookOutlined, FlagOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { AdminHeader } from "../../components/AdminHeader";

const attemptTrend = [
  { day: "Mon", attempts: 12 }, { day: "Tue", attempts: 28 },
  { day: "Wed", attempts: 19 }, { day: "Thu", attempts: 35 },
  { day: "Fri", attempts: 41 }, { day: "Sat", attempts: 17 },
  { day: "Sun", attempts: 9 },
];
const passFailData = [
  { name: "Passed", value: 68 },
  { name: "Failed", value: 32 },
];
const COLORS = ["#f59e0b", "#1e3a5f"];
const NAV_ITEMS = [
  { icon: <RiseOutlined />, label: "Dashboard", path: "/admin/dashboard" },
  { icon: <TeamOutlined />, label: "Users", path: "/admin/users" },
  { icon: <BookOutlined />, label: "All Tests", path: "/admin/tests" },
  { icon: <FlagOutlined />, label: "Flagged", path: "/admin/flagged" },
  { icon: <SettingOutlined />, label: "Settings", path: "/admin/settings" },
];

const useWindowWidth = () => {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
};

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalTests: 0, totalAttempts: 0, flaggedAttempts: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();

  // ── BREAKPOINTS
  const isXs = width < 480;       // phones
  const isSm = width < 640;       // small phones
  const isMobile = width < 768;   // all mobile
  const isTablet = width < 1024;  // tablet

  const sidebarWidth = isTablet ? 200 : 240;

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, testsRes] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/tests"),
      ]);
      const users = usersRes.data.users || [];
      const tests = testsRes.data.tests || [];
      setStats({
        totalUsers: users.length,
        totalTests: tests.length,
        totalAttempts: 161,
        flaggedAttempts: 4,
      });
      setRecentUsers(users.slice(0, 5));
      setRecentTests(tests.slice(0, 5));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
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

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: <TeamOutlined />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", delta: "+12% this week", path: "/admin/users" },
    { label: "Total Tests", value: stats.totalTests, icon: <BookOutlined />, color: "#38bdf8", bg: "rgba(56,189,248,0.1)", delta: "+3 this week", path: "/admin/tests" },
    { label: "Attempts", value: stats.totalAttempts, icon: <CheckCircleOutlined />, color: "#34d399", bg: "rgba(52,211,153,0.1)", delta: "+28 today", path: null },
    { label: "Flagged", value: stats.flaggedAttempts, icon: <FlagOutlined />, color: "#f87171", bg: "rgba(248,113,113,0.1)", delta: "Needs review", path: "/admin/flagged" },
  ];

  // ── Strip columns on small screens
  const userColumns = [
    {
      title: "User", dataIndex: "name",
      render: (name, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar
            style={{ background: "#f59e0b", color: "#0f172a", fontWeight: 700, flexShrink: 0 }}
            size={isXs ? 26 : 30}
          >
            {name?.[0]?.toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: isXs ? 11 : 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </div>
            {!isMobile && (
              <div style={{ color: "#64748b", fontSize: 11 }}>{record.email}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Role", dataIndex: "role",
      render: (role) => (
        <Tag style={{
          background: role === "admin" ? "rgba(245,158,11,0.15)" : role === "teacher" ? "rgba(56,189,248,0.15)" : "rgba(52,211,153,0.15)",
          color: role === "admin" ? "#f59e0b" : role === "teacher" ? "#38bdf8" : "#34d399",
          border: "none", borderRadius: 6, fontWeight: 600,
          fontSize: isXs ? 9 : 11, textTransform: "uppercase", padding: isXs ? "0 4px" : undefined,
        }}>{role}</Tag>
      ),
    },
    ...(!isMobile ? [{
      title: "",
      render: () => (
        <Button size="small" onClick={() => navigate("/admin/users")}
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: 6, fontSize: 11 }}>
          View
        </Button>
      ),
    }] : []),
  ];

  const testColumns = [
    {
      title: "Title", dataIndex: "title",
      render: (title) => (
        <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: isXs ? 11 : 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: isXs ? 100 : isMobile ? 140 : "none" }}>
          {title}
        </span>
      ),
    },
    {
      title: "Status", dataIndex: "status",
      render: (status) => (
        <Tag style={{
          background: status === "published" ? "rgba(52,211,153,0.15)" : "rgba(100,116,139,0.15)",
          color: status === "published" ? "#34d399" : "#94a3b8",
          border: "none", borderRadius: 6, fontWeight: 600,
          fontSize: isXs ? 9 : 11, textTransform: "uppercase", padding: isXs ? "0 4px" : undefined,
        }}>{isXs ? (status === "published" ? "Live" : status) : status}</Tag>
      ),
    },
    ...(!isMobile ? [{
      title: "Time", dataIndex: "timeLimit",
      render: (t) => <span style={{ color: "#64748b", fontSize: 12 }}>{t ? `${t}m` : "—"}</span>,
    }] : []),
  ];

  const SidebarContent = () => (
    <>
      <div style={S.sidebarLogo}>
        <span style={{ fontSize: 22 }}>📝</span>
        <span style={S.logoText}>ExamFlow</span>
      </div>
      <nav style={S.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.label}
              onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              style={{ ...S.navItem, ...(isActive ? S.navItemActive : {}) }}
            >
              <span style={{ fontSize: 16, display: "flex", alignItems: "center", color: isActive ? "#f59e0b" : "#64748b" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && <div style={S.navActiveBar} />}
            </div>
          );
        })}
      </nav>
      <div style={S.sidebarFooter}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar style={{ background: "#f59e0b", color: "#0f172a", fontWeight: 700, flexShrink: 0 }} size={34}>
            {user?.name?.[0]?.toUpperCase() || "A"}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "Admin"}
            </div>
            <div style={{ color: "#475569", fontSize: 11 }}>Administrator</div>
          </div>
        </div>
        <Button icon={<LogoutOutlined />} onClick={handleLogout} style={S.logoutBtn} size="small" block>
          Sign Out
        </Button>
      </div>
    </>
  );

  // ── RESPONSIVE VALUES
  const contentPadding = isXs ? "12px" : isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px";
  const statCols = isXs ? "repeat(2, 1fr)" : isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)";
  const quickCols = isXs ? "repeat(2, 1fr)" : isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)";
  const gap = isXs ? 8 : isMobile ? 12 : 16;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080f1a", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── DESKTOP SIDEBAR */}
      {!isMobile && (
        <aside style={{ ...S.sidebar, width: sidebarWidth }}>
          <SidebarContent />
        </aside>
      )}

      {/* ── MOBILE DRAWER */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        placement="left"
        width={240}
        styles={{ body: { padding: 0, background: "#0d1829" }, header: { display: "none" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px 0" }}>
          <SidebarContent />
        </div>
      </Drawer>

      {/* ── MAIN */}
      <main style={{ marginLeft: isMobile ? 0 : sidebarWidth, flex: 1, minHeight: "100vh", background: "#080f1a", minWidth: 0 }}>

        <AdminHeader
          title="Dashboard"
          subtitle="Welcome back"
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        <div style={{ padding: contentPadding }}>

          {/* ── WELCOME BANNER */}
          <div style={{
            display: "flex",
            flexDirection: isXs ? "column" : isMobile ? "column" : "row",
            alignItems: isXs || isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1a2744 0%, #0d1829 100%)",
            border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: isXs ? 12 : 16,
            padding: isXs ? "14px 16px" : isMobile ? "16px 18px" : "20px 28px",
            marginBottom: gap,
            gap: isXs ? 10 : 16,
          }}>
            <div>
              <h2 style={{ fontSize: isXs ? 15 : isMobile ? 17 : 20, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px", fontFamily: "'Syne', sans-serif" }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
                {user?.name?.split(" ")[0] || "Admin"} 👋
              </h2>
              <p style={{ fontSize: isXs ? 11 : 13, color: "#475569", margin: 0 }}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: isXs ? "short" : "long",
                  year: "numeric", month: isXs ? "short" : "long", day: "numeric",
                })}
              </p>
            </div>
            <Button
              onClick={() => navigate("/admin/users")}
              style={{
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#f59e0b", borderRadius: 10, fontWeight: 600,
                height: isXs ? 34 : 38,
                width: isXs || isMobile ? "100%" : "auto",
                fontSize: isXs ? 12 : 14,
              }}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
            >
              Manage Users
            </Button>
          </div>

          {/* ── STAT CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: statCols, gap, marginBottom: gap }}>
            {statCards.map((card, i) => (
              <div
                key={i}
                onClick={() => card.path && navigate(card.path)}
                style={{
                  background: "#0d1829",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: isXs ? 12 : 16,
                  padding: isXs ? "12px" : isMobile ? "14px" : "20px",
                  cursor: card.path ? "pointer" : "default",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isXs ? 8 : 14 }}>
                  <div style={{
                    width: isXs ? 30 : 38,
                    height: isXs ? 30 : 38,
                    borderRadius: isXs ? 8 : 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: card.bg, color: card.color,
                    fontSize: isXs ? 13 : 17,
                  }}>
                    {card.icon}
                  </div>
                  {!isXs && <span style={{ fontSize: 10, color: "#475569", fontWeight: 500, textAlign: "right", maxWidth: 80 }}>{card.delta}</span>}
                </div>
                <div style={{ fontSize: isXs ? 22 : isMobile ? 26 : 34, fontWeight: 800, color: card.color, lineHeight: 1, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>
                  {card.value}
                </div>
                <div style={{ fontSize: isXs ? 10 : 12, color: "#64748b", fontWeight: 500 }}>
                  {card.label}
                </div>
                {card.path && !isXs && (
                  <div style={{ fontSize: 10, fontWeight: 600, color: card.color, display: "flex", alignItems: "center", gap: 3, marginTop: 6 }}>
                    View all <ArrowRightOutlined style={{ fontSize: 9 }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── CHARTS */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : isTablet ? "column" : "row", gap, marginBottom: gap }}>

            {/* Area Chart */}
            <div style={{ flex: 1, background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: isXs ? 12 : 16, padding: isXs ? "14px 12px" : "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: isXs ? 13 : 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" }}>
                  Attempt Activity
                </h3>
                <span style={{ fontSize: 11, color: "#475569" }}>This week</span>
              </div>
              <ResponsiveContainer width="100%" height={isXs ? 130 : isMobile ? 160 : 200}>
                <AreaChart data={attemptTrend} margin={{ left: -20, right: 4 }}>
                  <defs>
                    <linearGradient id="attemptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: isXs ? 9 : 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: isXs ? 9 : 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: "#f1f5f9", fontSize: 12 }} />
                  <Area type="monotone" dataKey="attempts" stroke="#f59e0b" strokeWidth={2} fill="url(#attemptGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div style={{ flex: isMobile ? 1 : "0 0 260px", background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: isXs ? 12 : 16, padding: isXs ? "14px 12px" : "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: isXs ? 13 : 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" }}>
                  Pass / Fail
                </h3>
                <span style={{ fontSize: 11, color: "#475569" }}>All time</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ResponsiveContainer width="55%" height={isXs ? 110 : 140}>
                  <PieChart>
                    <Pie data={passFailData} cx="50%" cy="50%" innerRadius={isXs ? 30 : 38} outerRadius={isXs ? 48 : 60} paddingAngle={4} dataKey="value">
                      {passFailData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: "#f1f5f9", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                  {passFailData.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: isXs ? 11 : 12, color: "#94a3b8" }}>{item.name}</span>
                      <span style={{ fontSize: isXs ? 12 : 13, fontWeight: 700, color: "#f1f5f9" }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── QUICK NAV */}
          <div style={{ display: "grid", gridTemplateColumns: quickCols, gap, marginBottom: gap }}>
            {[
              { icon: "👥", label: "Users", desc: "Manage all users", path: "/admin/users", color: "#f59e0b" },
              { icon: "📋", label: "All Tests", desc: "Browse all tests", path: "/admin/tests", color: "#38bdf8" },
              { icon: "🚩", label: "Flagged", desc: "Review suspicious activity", path: "/admin/flagged", color: "#f87171" },
              { icon: "⚙️", label: "Settings", desc: "System preferences", path: "/admin/settings", color: "#a78bfa" },
            ].map((item) => (
              <div
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  flexDirection: isXs ? "column" : "row",
                  alignItems: isXs ? "flex-start" : "center",
                  gap: isXs ? 6 : 12,
                  background: "#0d1829",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: isXs ? 12 : 14,
                  padding: isXs ? "12px" : isMobile ? "14px" : "16px 18px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: isXs ? 18 : 22 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isXs ? 11 : 13, fontWeight: 700, color: item.color, marginBottom: 2 }}>{item.label}</div>
                  {!isXs && <div style={{ fontSize: 11, color: "#475569" }}>{item.desc}</div>}
                </div>
                {!isXs && <ArrowRightOutlined style={{ color: "#475569", fontSize: 11, flexShrink: 0 }} />}
              </div>
            ))}
          </div>

          {/* ── TABLES */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : isTablet ? "column" : "row", gap }}>
            {[
              { title: "Recent Users", data: recentUsers, columns: userColumns, path: "/admin/users" },
              { title: "Recent Tests", data: recentTests, columns: testColumns, path: "/admin/tests" },
            ].map((table) => (
              <div key={table.title} style={{
                flex: 1, background: "#0d1829",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: isXs ? 12 : 16,
                padding: isXs ? "14px 12px" : "20px",
                overflow: "hidden", minWidth: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontSize: isXs ? 13 : 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" }}>
                    {table.title}
                  </h3>
                  <Button
                    size="small"
                    onClick={() => navigate(table.path)}
                    style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", borderRadius: 8, fontSize: isXs ? 10 : 12 }}
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                  >
                    {isXs ? "All" : "View All"}
                  </Button>
                </div>
                <Table
                  dataSource={table.data}
                  columns={table.columns}
                  pagination={false}
                  loading={loading}
                  rowKey="id"
                  size="small"
                  className="dark-table"
                  scroll={{ x: isXs ? 180 : isMobile ? 220 : undefined }}
                />
              </div>
            ))}
          </div>

        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { overflow-x: hidden; }

        .dark-table .ant-table { background: transparent !important; }
        .dark-table .ant-table-thead > tr > th {
          background: rgba(255,255,255,0.03) !important;
          color: #64748b !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
          font-size: 10px; text-transform: uppercase;
          letter-spacing: 0.5px; font-weight: 600;
          padding: 8px 8px !important;
          white-space: nowrap;
        }
        .dark-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(255,255,255,0.04) !important;
          background: transparent !important;
          color: #f1f5f9;
          padding: 8px 8px !important;
        }
        .dark-table .ant-table-tbody > tr:hover > td {
          background: rgba(245,158,11,0.04) !important;
        }
        .dark-table .ant-spin-dot-item { background: #f59e0b !important; }
        .dark-table .ant-table-cell {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }
        .dark-table .ant-table-placeholder > td {
          background: transparent !important;
        }
        .dark-table .ant-empty-description { color: #475569 !important; }
      `}</style>
    </div>
  );
};

const S = {
  sidebar: {
    background: "#0d1829",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex", flexDirection: "column", padding: "24px 0",
    position: "fixed", top: 0, left: 0, height: "100vh",
    zIndex: 100, overflowY: "auto",
  },
  sidebarLogo: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0 20px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 12,
  },
  logoText: {
    fontSize: 19, fontWeight: 800, color: "#f1f5f9",
    fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px",
  },
  nav: { flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 },
  navItem: {
    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
    borderRadius: 10, cursor: "pointer", color: "#64748b", fontSize: 14,
    fontWeight: 500, transition: "all 0.15s", position: "relative", userSelect: "none",
  },
  navItemActive: { background: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  navActiveBar: {
    position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
    width: 3, height: 20, background: "#f59e0b", borderRadius: 2,
  },
  sidebarFooter: {
    padding: "14px 14px 0",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex", flexDirection: "column", gap: 10,
  },
  logoutBtn: {
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    color: "#f87171", borderRadius: 8, height: 34,
  },
};