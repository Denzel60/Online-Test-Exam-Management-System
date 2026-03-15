// src/pages/teacher/MyTests.jsx
import { useState, useEffect } from "react";
import {
  Table, Tag, Button, Avatar, Drawer, Modal,
  Input, Select, Empty, Popconfirm, message, Tooltip,
} from "antd";
import {
  BookOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, CheckCircleOutlined,
  ClockCircleOutlined, FlagOutlined, BarChartOutlined,
  HomeOutlined, FileTextOutlined, SettingOutlined,
  LogoutOutlined, MenuOutlined, ArrowRightOutlined,
  SearchOutlined, FilterOutlined, TeamOutlined,
  SendOutlined, InboxOutlined, TrophyOutlined
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

export const MyTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTest, setSelectedTest] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchTests(); }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/tests");
      const all = data.tests || [];
      const mine = all.filter((t) => t.createdBy === user.id);
      setTests(mine);
    } catch (err) {
      console.error("Fetch tests error:", err);
      messageApi.error("Failed to load tests");
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

  const handlePublish = async (testId) => {
    setPublishing(testId);
    try {
      await axiosInstance.patch(`/tests/${testId}/publish`);
      messageApi.success("Test published successfully");
      fetchTests();
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Failed to publish test");
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (testId) => {
    setDeleting(testId);
    try {
      await axiosInstance.delete(`/tests/${testId}`);
      messageApi.success("Test deleted successfully");
      fetchTests();
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Failed to delete test");
    } finally {
      setDeleting(null);
    }
  };

  const handleViewTest = (test) => {
    setSelectedTest(test);
    setViewModalOpen(true);
  };

  // ── FILTER LOGIC
  const filtered = tests.filter((t) => {
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tests.length,
    published: tests.filter((t) => t.status === "published").length,
    draft: tests.filter((t) => t.status === "draft").length,
    archived: tests.filter((t) => t.status === "archived").length,
  };

  const columns = [
    {
      title: "Test",
      dataIndex: "title",
      render: (title, record) => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: record.status === "published"
              ? "rgba(52,211,153,0.1)"
              : record.status === "draft"
              ? "rgba(245,158,11,0.1)"
              : "rgba(100,116,139,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: record.status === "published" ? "#34d399" : record.status === "draft" ? "#f59e0b" : "#64748b",
            fontSize: 16,
          }}>
            <BookOutlined />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{title}</div>
            <div style={{ color: "#475569", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 160 : 300 }}>
              {record.description || "No description"}
            </div>
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
    ...(!isMobile ? [
      {
        title: "Time Limit",
        dataIndex: "timeLimit",
        render: (t) => (
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: 12 }}>
            <ClockCircleOutlined style={{ fontSize: 11 }} />
            {t ? `${t} min` : "No limit"}
          </div>
        ),
      },
      {
        title: "Attempts",
        dataIndex: "maxAttempts",
        render: (a) => (
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: 12 }}>
            <TeamOutlined style={{ fontSize: 11 }} />
            {a ?? 1} max
          </div>
        ),
      },
      {
        title: "Pass Mark",
        dataIndex: "passMarkPercent",
        render: (p) => (
          <span style={{
            color: (p ?? 50) >= 70 ? "#f87171" : (p ?? 50) >= 50 ? "#f59e0b" : "#34d399",
            fontSize: 12, fontWeight: 600,
          }}>
            {p ?? 50}%
          </span>
        ),
      },
    ] : []),
    {
      title: "Actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* View */}
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewTest(record)}
              style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", borderRadius: 6 }}
            />
          </Tooltip>

          {/* Edit */}
          <Tooltip title="Edit Test">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/teacher/tests/${record.id}/edit`)}
              style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", borderRadius: 6 }}
            />
          </Tooltip>

          {/* Publish */}
          {record.status === "draft" && (
            <Tooltip title="Publish Test">
              <Button
                size="small"
                icon={<SendOutlined />}
                loading={publishing === record.id}
                onClick={() => handlePublish(record.id)}
                style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", borderRadius: 6 }}
              />
            </Tooltip>
          )}

          {/* Results */}
          {record.status === "published" && (
            <Tooltip title="View Results">
              <Button
                size="small"
                icon={<BarChartOutlined />}
                onClick={() => navigate(`/teacher/results/${record.id}`)}
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: 6 }}
              />
            </Tooltip>
          )}

          {/* Delete */}
          <Tooltip title="Delete Test">
            <Popconfirm
              title="Delete this test?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                icon={<DeleteOutlined />}
                loading={deleting === record.id}
                style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 6 }}
              />
            </Popconfirm>
          </Tooltip>
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
            <div key={item.label}
              onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}>
              <span style={{ fontSize: 15, color: isActive ? "#f59e0b" : "#64748b" }}>{item.icon}</span>
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
      {contextHolder}

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
                <span style={styles.breadcrumbCurrent}>My Tests</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 16 : 20 }}>My Tests</h1>
            </div>
          </div>
          <Button
            icon={<PlusOutlined />}
            onClick={() => navigate("/teacher/tests/create")}
            style={styles.createBtn}
            size={isMobile ? "small" : "middle"}
          >
            {isMobile ? "New" : "Create Test"}
          </Button>
        </header>

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* ── STAT PILLS */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { key: "all", label: "All Tests", value: stats.total, color: "#94a3b8" },
              { key: "published", label: "Published", value: stats.published, color: "#34d399" },
              { key: "draft", label: "Drafts", value: stats.draft, color: "#f59e0b" },
              { key: "archived", label: "Archived", value: stats.archived, color: "#64748b" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 20, cursor: "pointer",
                  background: statusFilter === f.key ? `${f.color}20` : "rgba(255,255,255,0.03)",
                  border: statusFilter === f.key ? `1px solid ${f.color}60` : "1px solid rgba(255,255,255,0.06)",
                  color: statusFilter === f.key ? f.color : "#64748b",
                  fontWeight: 600, fontSize: 13, transition: "all 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {f.label}
                <span style={{
                  background: statusFilter === f.key ? `${f.color}30` : "rgba(255,255,255,0.06)",
                  color: statusFilter === f.key ? f.color : "#475569",
                  borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                }}>
                  {f.value}
                </span>
              </button>
            ))}
          </div>

          {/* ── STAT CARDS */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: isMobile ? 10 : 14, marginBottom: 24,
          }}>
            {[
              { label: "Total Tests", value: stats.total, icon: <BookOutlined />, color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
              { label: "Published", value: stats.published, icon: <CheckCircleOutlined />, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
              { label: "Drafts", value: stats.draft, icon: <EditOutlined />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
              { label: "Archived", value: stats.archived, icon: <InboxOutlined />, color: "#64748b", bg: "rgba(100,116,139,0.1)" },
            ].map((card, i) => (
              <div key={i} style={{ ...styles.statCard, padding: isMobile ? "14px" : "18px 20px" }}>
                <div style={{ ...styles.statIcon, background: card.bg, color: card.color }}>{card.icon}</div>
                <div style={{ ...styles.statValue, color: card.color }}>{card.value}</div>
                <div style={styles.statLabel}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* ── SEARCH & FILTER BAR */}
          <div style={{
            display: "flex", gap: 10, marginBottom: 16,
            flexDirection: isMobile ? "column" : "row",
          }}>
            <div style={styles.searchBar}>
              <SearchOutlined style={{ color: "#475569", fontSize: 14, flexShrink: 0 }} />
              <input
                placeholder="Search tests by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, padding: 0 }}
                >
                  ✕
                </button>
              )}
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: isMobile ? "100%" : 160, height: 42 }}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </div>

          {/* ── TESTS TABLE */}
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <div>
                <h3 style={styles.tableTitle}>
                  {statusFilter === "all" ? "All Tests" : statusFilter === "published" ? "Published Tests" : statusFilter === "draft" ? "Draft Tests" : "Archived Tests"}
                </h3>
                <p style={styles.tableSubtitle}>
                  {filtered.length} test{filtered.length !== 1 ? "s" : ""}
                  {search && ` matching "${search}"`}
                </p>
              </div>
              <Button
                icon={<PlusOutlined />}
                onClick={() => navigate("/teacher/tests/create")}
                style={styles.createSmallBtn}
                size="small"
              >
                {!isMobile && "New Test"}
              </Button>
            </div>

            {filtered.length === 0 && !loading ? (
              <div style={styles.emptyState}>
                <Empty
                  description={
                    <div style={{ textAlign: "center" }}>
                      <p style={{ color: "#475569", margin: "0 0 12px" }}>
                        {search ? `No tests found matching "${search}"` : "You haven't created any tests yet"}
                      </p>
                      {!search && (
                        <Button
                          icon={<PlusOutlined />}
                          onClick={() => navigate("/teacher/tests/create")}
                          style={styles.createBtn}
                        >
                          Create Your First Test
                        </Button>
                      )}
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            ) : (
              <Table
                dataSource={filtered}
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

      {/* ── VIEW TEST MODAL */}
      <Modal
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        centered
        width={isMobile ? "95%" : 600}
        styles={{
          content: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20 },
          header: { background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.06)" },
          mask: { backdropFilter: "blur(4px)" },
        }}
        title={
          <span style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
            Test Details
          </span>
        }
      >
        {selectedTest && (
          <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Title & Status */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h3 style={{ color: "#f1f5f9", fontWeight: 700, margin: "0 0 6px", fontFamily: "'Syne', sans-serif", fontSize: 18 }}>
                  {selectedTest.title}
                </h3>
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                  {selectedTest.description || "No description provided"}
                </p>
              </div>
              <Tag style={{
                background: selectedTest.status === "published" ? "rgba(52,211,153,0.15)" : "rgba(245,158,11,0.15)",
                color: selectedTest.status === "published" ? "#34d399" : "#f59e0b",
                border: "none", borderRadius: 6, fontWeight: 700, fontSize: 11,
                textTransform: "uppercase", flexShrink: 0,
              }}>
                {selectedTest.status}
              </Tag>
            </div>

            {/* Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {[
                { label: "Time Limit", value: selectedTest.timeLimit ? `${selectedTest.timeLimit} minutes` : "No limit", icon: <ClockCircleOutlined />, color: "#38bdf8" },
                { label: "Max Attempts", value: `${selectedTest.maxAttempts ?? 1} attempt${(selectedTest.maxAttempts ?? 1) !== 1 ? "s" : ""}`, icon: <TeamOutlined />, color: "#a78bfa" },
                { label: "Pass Mark", value: `${selectedTest.passMarkPercent ?? 50}%`, icon: <CheckCircleOutlined />, color: "#34d399" },
                { label: "Start Date", value: selectedTest.startDate ? new Date(selectedTest.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not set", icon: <FileTextOutlined />, color: "#f59e0b" },
                { label: "End Date", value: selectedTest.endDate ? new Date(selectedTest.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not set", icon: <FileTextOutlined />, color: "#f87171" },
                { label: "Created", value: selectedTest.createdAt ? new Date(selectedTest.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—", icon: <BookOutlined />, color: "#64748b" },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ color: item.color, fontSize: 12 }}>{item.icon}</span>
                    <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                      {item.label}
                    </span>
                  </div>
                  <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
              <Button
                icon={<EditOutlined />}
                onClick={() => { setViewModalOpen(false); navigate(`/teacher/tests/${selectedTest.id}/edit`); }}
                style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", borderRadius: 10 }}
              >
                Edit Test
              </Button>
              {selectedTest.status === "draft" && (
                <Button
                  icon={<SendOutlined />}
                  loading={publishing === selectedTest.id}
                  onClick={() => { handlePublish(selectedTest.id); setViewModalOpen(false); }}
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", borderRadius: 10 }}
                >
                  Publish Test
                </Button>
              )}
              {selectedTest.status === "published" && (
                <Button
                  icon={<BarChartOutlined />}
                  onClick={() => { setViewModalOpen(false); navigate(`/teacher/results/${selectedTest.id}`); }}
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: 10 }}
                >
                  View Results
                </Button>
              )}
              <Popconfirm
                title="Delete this test?"
                description="This action cannot be undone."
                onConfirm={() => { handleDelete(selectedTest.id); setViewModalOpen(false); }}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  icon={<DeleteOutlined />}
                  style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 10 }}
                >
                  Delete
                </Button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Modal>

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
        .dark-table .ant-pagination-item a { color: #64748b !important; }
        .dark-table .ant-pagination-item-active { border-color: #f59e0b !important; }
        .dark-table .ant-pagination-item-active a { color: #f59e0b !important; }
        .dark-table .ant-pagination-prev button, .dark-table .ant-pagination-next button { color: #64748b !important; }
        .ant-select-selector { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.08) !important; color: #94a3b8 !important; border-radius: 10px !important; }
        .ant-select-arrow { color: #475569 !important; }
        .ant-popover-inner { background: #1e293b !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; }
        .ant-popover-title { color: #f1f5f9 !important; border-bottom-color: rgba(255,255,255,0.06) !important; }
        .ant-popover-inner-content { color: #94a3b8 !important; }
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
  createBtn: { background: "linear-gradient(135deg, #f59e0b, #f97316)", border: "none", borderRadius: 10, fontWeight: 600, boxShadow: "0 4px 12px rgba(245,158,11,0.25)", color: "#0f172a" },
  statCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 },
  statIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 4, fontFamily: "'Syne', sans-serif" },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: 500 },
  searchBar: { flex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0 14px", height: 42 },
  searchInput: { flex: 1, background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: 14, fontFamily: "'DM Sans', sans-serif" },
  tableCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px", overflow: "hidden" },
  tableHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 },
  tableTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  tableSubtitle: { fontSize: 12, color: "#475569", margin: "3px 0 0" },
  createSmallBtn: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", borderRadius: 8, fontWeight: 600 },
  emptyState: { padding: "40px 20px", display: "flex", justifyContent: "center" },
};