// src/pages/student/AvailableTests.jsx
import { useState, useEffect } from "react";
import {
  Input, Tag, Button, Avatar, Drawer, Select,
  Spin, Empty, Badge,
} from "antd";
import {
  BookOutlined, ClockCircleOutlined, TrophyOutlined,
  PlayCircleOutlined, LogoutOutlined, HomeOutlined,
  FileTextOutlined, BarChartOutlined, MenuOutlined,
  ArrowRightOutlined, SearchOutlined, FilterOutlined,
  StarOutlined, CheckCircleOutlined, ReloadOutlined, SettingOutlined,
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

export const AvailableTests = () => {
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        axiosInstance.get("/student/tests"),
        axiosInstance.get("/student/tests/attempts"),
      ]);
      setTests(testsRes.data.tests || []);
      setAttempts(attemptsRes.data.attempts || []);
    } catch (err) {
      console.error("Fetch error:", err);
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

  // ── HELPERS
  const getTestAttempts = (testId) =>
    attempts.filter((a) => a.testId === testId);

  const getInProgressAttempt = (testId) =>
    attempts.find((a) => a.testId === testId && a.status === "in_progress");

  const getSubmittedAttempts = (testId) =>
    attempts.filter((a) => a.testId === testId && a.status === "submitted");

  const getBestScore = (testId) => {
    const submitted = getSubmittedAttempts(testId);
    if (submitted.length === 0) return null;
    const best = submitted.reduce((a, b) =>
      (a.score / a.totalPoints) > (b.score / b.totalPoints) ? a : b
    );
    return best.totalPoints > 0
      ? Math.round((best.score / best.totalPoints) * 100)
      : 0;
  };

  const isMaxAttemptsReached = (test) => {
    const submitted = getSubmittedAttempts(test.id);
    return test.maxAttempts && submitted.length >= test.maxAttempts;
  };

  const isExpired = (test) => {
    if (!test.endDate) return false;
    return new Date(test.endDate) < new Date();
  };

  const isNotStarted = (test) => {
    if (!test.startDate) return false;
    return new Date(test.startDate) > new Date();
  };

  const getTestStatus = (test) => {
    if (isExpired(test)) return "expired";
    if (isNotStarted(test)) return "upcoming";
    if (isMaxAttemptsReached(test)) return "completed";
    if (getInProgressAttempt(test.id)) return "in_progress";
    if (getSubmittedAttempts(test.id).length > 0) return "attempted";
    return "available";
  };

  // ── FILTERED TESTS
  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.title.toLowerCase().includes(search.toLowerCase()) ||
      (test.description || "").toLowerCase().includes(search.toLowerCase());

    const status = getTestStatus(test);
    if (filter === "available") return matchesSearch && (status === "available" || status === "attempted");
    if (filter === "in_progress") return matchesSearch && status === "in_progress";
    if (filter === "completed") return matchesSearch && status === "completed";
    return matchesSearch;
  });

  // ── COUNTS for filter tabs
  const counts = {
    all: tests.length,
    available: tests.filter((t) => ["available", "attempted"].includes(getTestStatus(t))).length,
    in_progress: tests.filter((t) => getTestStatus(t) === "in_progress").length,
    completed: tests.filter((t) => getTestStatus(t) === "completed").length,
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const formatTimeLeft = (endDate) => {
    if (!endDate) return null;
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d left`;
    return `${hours}h left`;
  };

  const SidebarContent = () => (
    <>
      <div style={styles.sidebarLogo}>
        <span style={styles.logoIcon}>📝</span>
        <span style={styles.logoText}>ExamFlow</span>
      </div>
      <div style={styles.sidebarProfile}>
        <Avatar
          style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", color: "#fff", fontWeight: 700, fontSize: 18 }}
          size={52}
        >
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

  const TestCard = ({ test }) => {
    const status = getTestStatus(test);
    const inProgress = getInProgressAttempt(test.id);
    const submitted = getSubmittedAttempts(test.id);
    const bestScore = getBestScore(test.id);
    const timeLeft = formatTimeLeft(test.endDate);
    const maxReached = isMaxAttemptsReached(test);
    const expired = isExpired(test);
    const upcoming = isNotStarted(test);

    const statusConfig = {
      available: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)", label: "Available", border: "rgba(56,189,248,0.15)" },
      attempted: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", label: "Attempted", border: "rgba(167,139,250,0.15)" },
      in_progress: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "In Progress", border: "rgba(245,158,11,0.2)" },
      completed: { color: "#34d399", bg: "rgba(52,211,153,0.1)", label: "Completed", border: "rgba(52,211,153,0.15)" },
      expired: { color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Expired", border: "rgba(100,116,139,0.15)" },
      upcoming: { color: "#818cf8", bg: "rgba(129,140,248,0.1)", label: "Upcoming", border: "rgba(129,140,248,0.15)" },
    };

    const cfg = statusConfig[status] || statusConfig.available;

    return (
      <div style={{
        ...styles.testCard,
        borderColor: cfg.border,
        opacity: expired ? 0.6 : 1,
      }}>
        {/* Card Top */}
        <div style={styles.testCardTop}>
          <div style={{ ...styles.testIconWrap, background: cfg.bg }}>
            <BookOutlined style={{ color: cfg.color, fontSize: 18 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {timeLeft && !expired && (
              <span style={{ ...styles.timeLeftBadge, color: parseInt(timeLeft) <= 1 ? "#f87171" : "#64748b" }}>
                <ClockCircleOutlined style={{ fontSize: 10 }} /> {timeLeft}
              </span>
            )}
            <Tag style={{
              background: cfg.bg, color: cfg.color,
              border: `1px solid ${cfg.border}`,
              borderRadius: 20, fontWeight: 700, fontSize: 10,
              textTransform: "uppercase", letterSpacing: "0.5px",
              margin: 0,
            }}>
              {cfg.label}
            </Tag>
          </div>
        </div>

        {/* Title & Description */}
        <h4 style={styles.testCardTitle}>{test.title}</h4>
        <p style={styles.testCardDesc}>
          {test.description || "No description provided"}
        </p>

        {/* Meta */}
        <div style={styles.testMeta}>
          {test.timeLimit && (
            <div style={styles.metaItem}>
              <ClockCircleOutlined style={{ color: "#475569", fontSize: 12 }} />
              <span>{test.timeLimit} min</span>
            </div>
          )}
          <div style={styles.metaItem}>
            <TrophyOutlined style={{ color: "#475569", fontSize: 12 }} />
            <span>{test.maxAttempts || "∞"} attempt{test.maxAttempts !== 1 ? "s" : ""}</span>
          </div>
          {submitted.length > 0 && (
            <div style={styles.metaItem}>
              <CheckCircleOutlined style={{ color: "#475569", fontSize: 12 }} />
              <span>{submitted.length} done</span>
            </div>
          )}
          {test.startDate && (
            <div style={styles.metaItem}>
              <PlayCircleOutlined style={{ color: "#475569", fontSize: 12 }} />
              <span>Opens {formatDate(test.startDate)}</span>
            </div>
          )}
        </div>

        {/* Best Score Bar */}
        {bestScore !== null && (
          <div style={styles.scoreBar}>
            <div style={styles.scoreBarTop}>
              <span style={styles.scoreBarLabel}>Best Score</span>
              <span style={{ ...styles.scoreBarValue, color: bestScore >= 50 ? "#34d399" : "#f87171" }}>
                {bestScore}%
              </span>
            </div>
            <div style={styles.scoreBarTrack}>
              <div style={{
                ...styles.scoreBarFill,
                width: `${bestScore}%`,
                background: bestScore >= 50
                  ? "linear-gradient(90deg, #34d399, #059669)"
                  : "linear-gradient(90deg, #f87171, #dc2626)",
              }} />
            </div>
          </div>
        )}

        {/* Attempts used */}
        {test.maxAttempts && (
          <div style={styles.attemptsUsed}>
            {Array.from({ length: test.maxAttempts }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.attemptDot,
                  background: i < submitted.length ? "#38bdf8" : "rgba(255,255,255,0.08)",
                }}
              />
            ))}
            <span style={styles.attemptsUsedText}>
              {submitted.length}/{test.maxAttempts} used
            </span>
          </div>
        )}

        {/* CTA Button */}
        <Button
          block
          onClick={() => !expired && !upcoming && !maxReached && navigate(`/student/tests/${test.id}`)}
          disabled={expired || upcoming || maxReached}
          style={{
            ...styles.ctaBtn,
            background: expired || upcoming || maxReached
              ? "rgba(255,255,255,0.04)"
              : inProgress
              ? "rgba(245,158,11,0.12)"
              : "rgba(56,189,248,0.12)",
            border: `1px solid ${expired || upcoming || maxReached
              ? "rgba(255,255,255,0.06)"
              : inProgress
              ? "rgba(245,158,11,0.3)"
              : "rgba(56,189,248,0.3)"}`,
            color: expired || upcoming || maxReached
              ? "#334155"
              : inProgress ? "#f59e0b" : "#38bdf8",
            cursor: expired || upcoming || maxReached ? "not-allowed" : "pointer",
          }}
          icon={
            expired ? null :
            upcoming ? <ClockCircleOutlined /> :
            maxReached ? <CheckCircleOutlined /> :
            inProgress ? <PlayCircleOutlined /> :
            <ArrowRightOutlined />
          }
        >
          {expired ? "Test Expired" :
           upcoming ? `Opens ${formatDate(test.startDate)}` :
           maxReached ? "Max Attempts Reached" :
           inProgress ? "Resume Test" :
           submitted.length > 0 ? "Retake Test" : "Start Test"}
        </Button>
      </div>
    );
  };

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
                <span style={styles.breadcrumbCurrent}>Available Tests</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 16 : 18 }}>
                Available Tests
              </h1>
            </div>
          </div>
          <div style={styles.headerRight}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              style={styles.refreshBtn}
              loading={loading}
            >
              {!isMobile && "Refresh"}
            </Button>
          </div>
        </header>

        {/* ── CONTENT */}
        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* ── SEARCH & FILTER BAR */}
          <div style={{
            ...styles.filterBar,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 10 : 12,
            marginBottom: 20,
          }}>
            <Input
              prefix={<SearchOutlined style={{ color: "#475569" }} />}
              placeholder="Search tests by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
              allowClear
            />
            {!isMobile && (
              <Select
                value={filter}
                onChange={setFilter}
                style={{ width: 160 }}
                options={[
                  { value: "all", label: `All Tests (${counts.all})` },
                  { value: "available", label: `Available (${counts.available})` },
                  { value: "in_progress", label: `In Progress (${counts.in_progress})` },
                  { value: "completed", label: `Completed (${counts.completed})` },
                ]}
              />
            )}
          </div>

          {/* ── FILTER TABS */}
          <div style={{ ...styles.filterTabs, marginBottom: 24, overflowX: "auto" }}>
            {[
              { key: "all", label: "All", count: counts.all },
              { key: "available", label: "Available", count: counts.available },
              { key: "in_progress", label: "In Progress", count: counts.in_progress },
              { key: "completed", label: "Completed", count: counts.completed },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  ...styles.filterTab,
                  ...(filter === tab.key ? styles.filterTabActive : {}),
                }}
              >
                {tab.label}
                <span style={{
                  ...styles.filterTabCount,
                  background: filter === tab.key ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.06)",
                  color: filter === tab.key ? "#38bdf8" : "#475569",
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── RESULTS COUNT */}
          {!loading && (
            <div style={styles.resultsCount}>
              <FilterOutlined style={{ fontSize: 12, color: "#475569" }} />
              <span>
                Showing <strong style={{ color: "#f1f5f9" }}>{filteredTests.length}</strong> of{" "}
                <strong style={{ color: "#f1f5f9" }}>{tests.length}</strong> tests
              </span>
            </div>
          )}

          {/* ── TEST GRID */}
          {loading ? (
            <div style={styles.loadingState}>
              <Spin size="large" />
              <span style={styles.loadingText}>Loading available tests...</span>
            </div>
          ) : filteredTests.length === 0 ? (
            <div style={styles.emptyState}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "#334155", fontSize: 14 }}>
                    {search
                      ? `No tests found for "${search}"`
                      : "No tests available in this category"}
                  </span>
                }
              >
                {search && (
                  <Button onClick={() => setSearch("")} style={styles.clearBtn}>
                    Clear Search
                  </Button>
                )}
              </Empty>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                ? "repeat(2, 1fr)"
                : "repeat(3, 1fr)",
              gap: isMobile ? 12 : 16,
            }}>
              {filteredTests.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>
          )}

        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .ant-input { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.08) !important; color: #f1f5f9 !important; }
        .ant-input::placeholder { color: #475569 !important; }
        .ant-input-affix-wrapper { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.08) !important; border-radius: 10px !important; }
        .ant-input-affix-wrapper:hover, .ant-input-affix-wrapper:focus-within { border-color: rgba(56,189,248,0.4) !important; }
        .ant-select-selector { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.08) !important; color: #94a3b8 !important; border-radius: 10px !important; }
        .ant-select-arrow { color: #475569 !important; }
        .ant-empty-description { color: #475569 !important; }

        .test-card-hover:hover {
          border-color: rgba(56,189,248,0.3) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
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
  sidebarLogo: { display: "flex", alignItems: "center", gap: 10, padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 19, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" },
  sidebarProfile: { display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 12, gap: 6 },
  sidebarProfileName: { color: "#f1f5f9", fontWeight: 700, fontSize: 14, textAlign: "center" },
  sidebarProfileEmail: { color: "#475569", fontSize: 11, textAlign: "center" },
  sidebarProfileBadge: { display: "flex", alignItems: "center", gap: 4, background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 },
  nav: { flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column", gap: 2 },
  navItem: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 500, transition: "all 0.15s", position: "relative", userSelect: "none" },
  navItemActive: { background: "rgba(56,189,248,0.08)", color: "#38bdf8" },
  navActiveBar: { position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: "#38bdf8", borderRadius: 2 },
  sidebarFooter: { padding: "14px 14px 0", borderTop: "1px solid rgba(255,255,255,0.05)" },
  logoutBtn: { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 8, height: 34 },

  // ── HEADER
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 64, background: "#080f1a", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 50, gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  menuBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 },
  breadcrumb: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 },
  breadcrumbRoot: { fontSize: 11, color: "#334155" },
  breadcrumbSep: { fontSize: 11, color: "#1e293b" },
  breadcrumbCurrent: { fontSize: 11, color: "#475569", fontWeight: 500 },
  pageTitle: { fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px" },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  refreshBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", borderRadius: 8 },

  // ── FILTER BAR
  filterBar: { display: "flex", alignItems: "center" },
  searchInput: { flex: 1, height: 42 },

  // ── FILTER TABS
  filterTabs: { display: "flex", gap: 6, paddingBottom: 4 },
  filterTab: {
    display: "flex", alignItems: "center", gap: 7,
    padding: "7px 14px", borderRadius: 10,
    background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
    color: "#64748b", fontSize: 13, fontWeight: 500,
    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  filterTabActive: {
    background: "rgba(56,189,248,0.08)",
    border: "1px solid rgba(56,189,248,0.25)",
    color: "#38bdf8",
  },
  filterTabCount: { fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "1px 7px" },

  // ── RESULTS COUNT
  resultsCount: { display: "flex", alignItems: "center", gap: 6, color: "#475569", fontSize: 12, marginBottom: 16 },

  // ── TEST CARD
  testCard: {
    background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16, padding: "20px", display: "flex",
    flexDirection: "column", gap: 12, transition: "all 0.2s",
    cursor: "default",
  },
  testCardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  testIconWrap: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  timeLeftBadge: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 },
  testCardTitle: { color: "#f1f5f9", fontWeight: 700, fontSize: 15, margin: 0, fontFamily: "'Syne', sans-serif", lineHeight: 1.3 },
  testCardDesc: { color: "#475569", fontSize: 12, margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },

  // ── META
  testMeta: { display: "flex", flexWrap: "wrap", gap: 10 },
  metaItem: { display: "flex", alignItems: "center", gap: 5, color: "#475569", fontSize: 12 },

  // ── SCORE BAR
  scoreBar: { background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px" },
  scoreBarTop: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  scoreBarLabel: { fontSize: 11, color: "#475569" },
  scoreBarValue: { fontSize: 12, fontWeight: 700 },
  scoreBarTrack: { height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 4, transition: "width 0.6s ease" },

  // ── ATTEMPTS DOTS
  attemptsUsed: { display: "flex", alignItems: "center", gap: 6 },
  attemptDot: { width: 8, height: 8, borderRadius: "50%", transition: "background 0.2s" },
  attemptsUsedText: { fontSize: 11, color: "#475569", marginLeft: 2 },

  // ── CTA BUTTON
  ctaBtn: { borderRadius: 10, fontWeight: 600, height: 40, fontSize: 13, marginTop: 4 },

  // ── STATES
  loadingState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 16 },
  loadingText: { color: "#475569", fontSize: 14 },
  emptyState: { padding: "60px 20px", display: "flex", justifyContent: "center" },
  clearBtn: { background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", borderRadius: 8 },

  main: { flex: 1, minHeight: "100vh", background: "#060d18" },
};