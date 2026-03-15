// src/pages/teacher/Leaderboard.jsx
import { useState, useEffect } from "react";
import { Select, Button, Avatar, Drawer, Spin, Empty, Tag } from "antd";
import {
    TrophyOutlined, BookOutlined, PlusOutlined,
    BarChartOutlined, FlagOutlined, SettingOutlined,
    HomeOutlined, LogoutOutlined, MenuOutlined,
    TeamOutlined, ReloadOutlined, DownloadOutlined, CrownOutlined,
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

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#cd7f32", "#38bdf8", "#a78bfa"];
const RANK_ICONS = ["🥇", "🥈", "🥉"];

const useWindowWidth = () => {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handle = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
    }, []);
    return width;
};

export const Leaderboard = () => {
    const [tests, setTests] = useState([]);
    const [selectedTestId, setSelectedTestId] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [testTitle, setTestTitle] = useState("");
    const [loadingTests, setLoadingTests] = useState(true);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const width = useWindowWidth();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    useEffect(() => { fetchTests(); }, []);
    useEffect(() => { if (selectedTestId) fetchLeaderboard(selectedTestId); }, [selectedTestId]);

    const fetchTests = async () => {
        try {
            const { data } = await axiosInstance.get("/tests");
            const mine = (data.tests || []).filter(
                (t) => t.createdBy === user.id && t.status === "published"
            );
            setTests(mine);
            if (mine.length > 0) setSelectedTestId(mine[0].id);
        } catch (err) {
            console.error("Fetch tests error:", err);
        } finally {
            setLoadingTests(false);
        }
    };

    const fetchLeaderboard = async (testId) => {
        setLoadingLeaderboard(true);
        try {
            const { data } = await axiosInstance.get(`/oversight/tests/${testId}/leaderboard`);
            setLeaderboard(data.leaderboard || []);
            setTestTitle(data.testTitle || "");
        } catch (err) {
            console.error("Fetch leaderboard error:", err);
            setLeaderboard([]);
        } finally {
            setLoadingLeaderboard(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await axiosInstance.get(
                `/oversight/tests/${selectedTestId}/export`,
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `leaderboard-test-${selectedTestId}.csv`;
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

    const chartData = leaderboard.slice(0, 10).map((entry) => ({
        name: entry.studentName?.split(" ")[0] || "Student",
        score: Number(entry.percentage),
    }));

    const passed = leaderboard.filter((e) => e.isPassed);
    const avgScore = leaderboard.length > 0
        ? Math.round(leaderboard.reduce((s, e) => s + Number(e.percentage), 0) / leaderboard.length)
        : 0;
    const topScore = leaderboard.length > 0
        ? Math.max(...leaderboard.map((e) => Number(e.percentage)))
        : 0;

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
                                <span style={styles.breadcrumbCurrent}>Leaderboard</span>
                            </div>
                            <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 16 : 20 }}>Leaderboard</h1>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button icon={<ReloadOutlined />} onClick={() => fetchLeaderboard(selectedTestId)}
                            style={styles.refreshBtn} size={isMobile ? "small" : "middle"}>
                            {!isMobile && "Refresh"}
                        </Button>
                        {selectedTestId && leaderboard.length > 0 && (
                            <Button icon={<DownloadOutlined />} onClick={handleExport}
                                style={styles.exportBtn} size={isMobile ? "small" : "middle"}>
                                {!isMobile && "Export CSV"}
                            </Button>
                        )}
                    </div>
                </header>

                <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

                    {/* Test Selector */}
                    <div style={styles.selectorCard}>
                        <div>
                            <p style={{ color: "#f1f5f9", fontWeight: 600, margin: "0 0 4px" }}>Select a Test</p>
                            <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>View rankings for your published tests</p>
                        </div>
                        <Select value={selectedTestId} onChange={setSelectedTestId}
                            style={{ width: isMobile ? "100%" : 320, height: 42 }}
                            loading={loadingTests} placeholder="Select a test"
                            options={tests.map((t) => ({ value: t.id, label: t.title }))} />
                    </div>

                    {loadingTests ? (
                        <div style={styles.centered}><Spin size="large" /></div>
                    ) : tests.length === 0 ? (
                        <div style={{ ...styles.card, padding: 60 }}>
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
                                    { label: "Total Students", value: leaderboard.length, icon: <TeamOutlined />, color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
                                    { label: "Passed", value: passed.length, icon: <TrophyOutlined />, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
                                    { label: "Avg Score", value: `${avgScore}%`, icon: <BarChartOutlined />, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
                                    { label: "Top Score", value: `${topScore}%`, icon: <CrownOutlined />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
                                ].map((card, i) => (
                                    <div key={i} style={{ ...styles.statCard, padding: isMobile ? "14px" : "18px 20px" }}>
                                        <div style={{ ...styles.statIcon, background: card.bg, color: card.color }}>{card.icon}</div>
                                        <div style={{ ...styles.statValue, color: card.color, fontSize: isMobile ? 24 : 28 }}>{card.value}</div>
                                        <div style={styles.statLabel}>{card.label}</div>
                                    </div>
                                ))}
                            </div>

                            {loadingLeaderboard ? (
                                <div style={styles.centered}><Spin /></div>
                            ) : leaderboard.length === 0 ? (
                                <div style={{ ...styles.card, padding: 60 }}>
                                    <Empty description={<span style={{ color: "#475569" }}>No submissions yet for this test</span>}
                                        image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                </div>
                            ) : (
                                <>
                                    {/* Score Chart */}
                                    <div style={{ ...styles.card, marginBottom: 20 }}>
                                        <div style={styles.cardHeader}>
                                            <h3 style={styles.cardTitle}>Score Chart — Top {chartData.length}</h3>
                                            <span style={styles.cardSub}>{testTitle}</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
                                            <BarChart data={chartData} barSize={32}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: "#f1f5f9" }}
                                                    formatter={(val) => [`${val}%`, "Score"]} />
                                                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                                    {chartData.map((_, i) => (
                                                        <Cell key={i} fill={i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "#38bdf8"} fillOpacity={0.9} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Podium — top 3 */}
                                    {leaderboard.length >= 3 && (
                                        <div style={{ ...styles.card, marginBottom: 20 }}>
                                            <div style={styles.cardHeader}>
                                                <h3 style={styles.cardTitle}>🏆 Top 3 Podium</h3>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: isMobile ? 8 : 20, padding: "20px 0" }}>
                                                {[1, 0, 2].map((rankIndex) => {
                                                    const entry = leaderboard[rankIndex];
                                                    if (!entry) return null;
                                                    const isFirst = rankIndex === 0;
                                                    const heights = [160, 200, 130];
                                                    return (
                                                        <div key={rankIndex} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                                            <span style={{ fontSize: isMobile ? 24 : 32 }}>{RANK_ICONS[rankIndex]}</span>
                                                            <Avatar
                                                                style={{ background: `linear-gradient(135deg, ${RANK_COLORS[rankIndex]}, ${RANK_COLORS[rankIndex]}99)`, color: "#fff", fontWeight: 700, fontSize: isFirst ? 20 : 16, border: `2px solid ${RANK_COLORS[rankIndex]}` }}
                                                                size={isFirst ? (isMobile ? 52 : 64) : (isMobile ? 40 : 52)}
                                                            >
                                                                {entry.studentName?.[0]?.toUpperCase() || "S"}
                                                            </Avatar>
                                                            <div style={{ textAlign: "center" }}>
                                                                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: isMobile ? 12 : 14, fontFamily: "'Syne', sans-serif" }}>
                                                                    {entry.studentName?.split(" ")[0]}
                                                                </div>
                                                                <div style={{ color: RANK_COLORS[rankIndex], fontWeight: 800, fontSize: isMobile ? 16 : 20, fontFamily: "'Syne', sans-serif" }}>
                                                                    {entry.percentage}%
                                                                </div>
                                                            </div>
                                                            <div style={{ width: isMobile ? 80 : 110, height: heights[rankIndex], background: `linear-gradient(180deg, ${RANK_COLORS[rankIndex]}30, ${RANK_COLORS[rankIndex]}10)`, border: `1px solid ${RANK_COLORS[rankIndex]}40`, borderRadius: "10px 10px 0 0", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 12 }}>
                                                                <span style={{ color: RANK_COLORS[rankIndex], fontWeight: 800, fontSize: isMobile ? 18 : 24, fontFamily: "'Syne', sans-serif" }}>
                                                                    #{entry.rank}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Full Rankings */}
                                    <div style={styles.card}>
                                        <div style={styles.cardHeader}>
                                            <h3 style={styles.cardTitle}>Full Rankings</h3>
                                            <span style={styles.cardSub}>{leaderboard.length} student{leaderboard.length !== 1 ? "s" : ""}</span>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            {leaderboard.map((entry, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < leaderboard.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: entry.rank <= 3 ? `${RANK_COLORS[entry.rank - 1]}08` : "transparent" }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: entry.rank <= 3 ? `${RANK_COLORS[entry.rank - 1]}20` : "rgba(255,255,255,0.04)", color: entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : "#475569", fontWeight: 800, fontSize: entry.rank <= 3 ? 18 : 14, flexShrink: 0, fontFamily: "'Syne', sans-serif" }}>
                                                        {entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : `#${entry.rank}`}
                                                    </div>
                                                    <Avatar style={{ background: entry.rank <= 3 ? `linear-gradient(135deg, ${RANK_COLORS[entry.rank - 1]}, ${RANK_COLORS[entry.rank - 1]}88)` : "linear-gradient(135deg, #38bdf8, #818cf8)", color: "#fff", fontWeight: 700, flexShrink: 0 }} size={36}>
                                                        {entry.studentName?.[0]?.toUpperCase() || "S"}
                                                    </Avatar>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{entry.studentName}</div>
                                                        {!isMobile && (
                                                            <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
                                                                {entry.score}/{entry.totalPoints} pts · {entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!isMobile && (
                                                        <div style={{ width: 140 }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                                <span style={{ fontSize: 11, color: "#64748b" }}>Score</span>
                                                                <span style={{ fontSize: 11, color: entry.isPassed ? "#34d399" : "#f87171", fontWeight: 700 }}>{entry.percentage}%</span>
                                                            </div>
                                                            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                                                <div style={{ height: "100%", width: `${entry.percentage}%`, background: entry.rank <= 3 ? `linear-gradient(90deg, ${RANK_COLORS[entry.rank - 1]}, ${RANK_COLORS[entry.rank - 1]}88)` : entry.isPassed ? "linear-gradient(90deg, #34d399, #10b981)" : "linear-gradient(90deg, #f87171, #ef4444)", borderRadius: 3 }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <Tag style={{ background: entry.isPassed ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: entry.isPassed ? "#34d399" : "#f87171", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 11, flexShrink: 0 }}>
                                                        {entry.isPassed ? "PASSED" : "FAILED"}
                                                    </Tag>
                                                    {isMobile && (
                                                        <span style={{ color: entry.isPassed ? "#34d399" : "#f87171", fontWeight: 800, fontSize: 14, fontFamily: "'Syne', sans-serif", flexShrink: 0 }}>
                                                            {entry.percentage}%
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
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
    refreshBtn: { background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", color: "#38bdf8", borderRadius: 10, fontWeight: 600 },
    exportBtn: { background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", borderRadius: 10, fontWeight: 600 },
    primaryBtn: { background: "linear-gradient(135deg, #f59e0b, #f97316)", border: "none", color: "#0f172a", borderRadius: 10, fontWeight: 700, height: 40 },
    selectorCard: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 20px", marginBottom: 20, gap: 16, flexWrap: "wrap" },
    statCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 },
    statIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12 },
    statValue: { fontWeight: 800, lineHeight: 1, marginBottom: 4, fontFamily: "'Syne', sans-serif" },
    statLabel: { fontSize: 12, color: "#64748b" },
    card: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px", overflow: "hidden" },
    cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    cardTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
    cardSub: { fontSize: 12, color: "#475569" },
    centered: { display: "flex", justifyContent: "center", alignItems: "center", padding: 60 },
};