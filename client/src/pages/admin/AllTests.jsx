import { useState, useEffect } from "react";
import {
  Table, Tag, Button, Avatar, Drawer, Modal,
  Form, Input, Select, InputNumber, DatePicker,
  message, Popconfirm, Tooltip,
} from "antd";
import {
  LogoutOutlined, SettingOutlined, RiseOutlined,
  TeamOutlined, BookOutlined, FlagOutlined,
  SearchOutlined, DeleteOutlined, EditOutlined,
  EyeOutlined, CheckCircleOutlined, StopOutlined,
  ArrowRightOutlined, ClockCircleOutlined,
  CalendarOutlined, TrophyOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import { AdminHeader } from "../../components/AdminHeader";
import dayjs from "dayjs";

const NAV_ITEMS = [
  { icon: <RiseOutlined />, label: "Dashboard", path: "/admin/dashboard" },
  { icon: <TeamOutlined />, label: "Users", path: "/admin/users" },
  { icon: <BookOutlined />, label: "All Tests", path: "/admin/tests" },
  { icon: <FlagOutlined />, label: "Flagged", path: "/admin/flagged" },
  { icon: <SettingOutlined />, label: "Settings", path: "/admin/settings" },
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

export const AllTests = () => {
  const [tests, setTests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchTests(); }, []);

  useEffect(() => {
    let result = [...tests];
    if (search) {
      result = result.filter((t) =>
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, tests]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/tests");
      setTests(data.tests || []);
      setFiltered(data.tests || []);
    } catch {
      message.error("Failed to fetch tests");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (id) => {
    try {
      await axiosInstance.delete(`/tests/${id}`);
      message.success("Test deleted successfully");
      fetchTests();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to delete test");
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      await axiosInstance.delete("/tests/bulk", { data: { ids: selectedRowKeys } });
      message.success(`${selectedRowKeys.length} test(s) deleted`);
      setSelectedRowKeys([]);
      fetchTests();
    } catch (err) {
      message.error(err.response?.data?.message || "Bulk delete failed");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleViewTest = (record) => {
    setSelectedTest(record);
    setViewModalOpen(true);
  };

  const handleEditTest = (record) => {
    setSelectedTest(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      timeLimit: record.timeLimit,
      maxAttempts: record.maxAttempts,
      passMarkPercent: record.passMarkPercent,
      status: record.status,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
    });
    setEditModalOpen(true);
  };

  const handleUpdateTest = async (values) => {
    setEditLoading(true);
    try {
      await axiosInstance.patch(`/tests/${selectedTest.id}`, {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      });
      message.success("Test updated successfully");
      setEditModalOpen(false);
      fetchTests();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to update test");
    } finally {
      setEditLoading(false);
    }
  };

  const handlePublishTest = async (id) => {
    try {
      await axiosInstance.patch(`/tests/${id}/publish`);
      message.success("Test published successfully");
      fetchTests();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to publish test");
    }
  };

  const handleArchiveTest = async (id) => {
    try {
      await axiosInstance.patch(`/tests/${id}`, { status: "archived" });
      message.success("Test archived");
      fetchTests();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to archive test");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const statusCounts = {
    all: tests.length,
    draft: tests.filter((t) => t.status === "draft").length,
    published: tests.filter((t) => t.status === "published").length,
    archived: tests.filter((t) => t.status === "archived").length,
  };

  const statusStyle = (status) => ({
    background:
      status === "published" ? "rgba(52,211,153,0.15)" :
      status === "draft" ? "rgba(100,116,139,0.15)" :
      "rgba(248,113,113,0.15)",
    color:
      status === "published" ? "#34d399" :
      status === "draft" ? "#94a3b8" :
      "#f87171",
    border: "none", borderRadius: 6, fontWeight: 600,
    fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px",
  });

  const columns = [
    {
      title: "Test",
      dataIndex: "title",
      render: (title, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: isMobile ? 32 : 38, height: isMobile ? 32 : 38,
            borderRadius: 10, flexShrink: 0,
            background:
              record.status === "published" ? "rgba(52,211,153,0.1)" :
              record.status === "draft" ? "rgba(100,116,139,0.1)" :
              "rgba(248,113,113,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: isMobile ? 14 : 16,
          }}>
            📋
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </div>
            {!isMobile && record.description && (
              <div style={{ color: "#64748b", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                {record.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      render: (status) => <Tag style={statusStyle(status)}>{status}</Tag>,
    },
    ...(!isMobile ? [
      {
        title: "Time Limit",
        dataIndex: "timeLimit",
        width: 110,
        render: (t) => (
          <span style={{ color: "#64748b", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <ClockCircleOutlined style={{ fontSize: 11 }} />
            {t ? `${t} min` : "No limit"}
          </span>
        ),
      },
      {
        title: "Attempts",
        dataIndex: "maxAttempts",
        width: 90,
        render: (a) => (
          <span style={{ color: "#64748b", fontSize: 12 }}>{a ?? "∞"}</span>
        ),
      },
      {
        title: "Pass Mark",
        dataIndex: "passMarkPercent",
        width: 100,
        render: (p) => (
          <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>{p ?? 50}%</span>
        ),
      },
    ] : []),
    {
      title: "Actions",
      width: isMobile ? 100 : 160,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* View */}
          <Tooltip title="View details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewTest(record)}
              style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", borderRadius: 6 }} />
          </Tooltip>

          {/* Edit */}
          <Tooltip title="Edit test">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEditTest(record)}
              style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", borderRadius: 6 }} />
          </Tooltip>

          {/* Publish / Archive */}
          {!isMobile && record.status === "draft" && (
            <Tooltip title="Publish">
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handlePublishTest(record.id)}
                style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", borderRadius: 6 }} />
            </Tooltip>
          )}
          {!isMobile && record.status === "published" && (
            <Tooltip title="Archive">
              <Button size="small" icon={<StopOutlined />} onClick={() => handleArchiveTest(record.id)}
                style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 6 }} />
            </Tooltip>
          )}

          {/* Delete */}
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this test?"
              description="All questions and attempts will be removed."
              onConfirm={() => handleDeleteTest(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" icon={<DeleteOutlined />}
                style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 6 }} />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ];

  const SidebarContent = () => (
    <>
      <div style={styles.sidebarLogo}>
        <span style={styles.logoIcon}>📝</span>
        <span style={styles.logoText}>ExamFlow</span>
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
              <span style={{ fontSize: 16, display: "flex", alignItems: "center", color: isActive ? "#f59e0b" : "#64748b" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && <div style={styles.navActiveBar} />}
            </div>
          );
        })}
      </nav>
      <div style={styles.sidebarFooter}>
        <div style={styles.adminProfile}>
          <Avatar style={{ background: "#f59e0b", color: "#0f172a", fontWeight: 700, flexShrink: 0 }} size={34}>
            {user?.name?.[0]?.toUpperCase() || "A"}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.adminName}>{user?.name || "Admin"}</div>
            <div style={styles.adminRole}>Administrator</div>
          </div>
        </div>
        <Button icon={<LogoutOutlined />} onClick={handleLogout} style={styles.logoutBtn} size="small" block>
          Sign Out
        </Button>
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

      <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240 }}>
        <AdminHeader
          title="All Tests"
          subtitle="Browse and manage all tests"
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* ── STAT PILLS */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { label: "All Tests", key: "all", color: "#f1f5f9", bg: "rgba(241,245,249,0.08)" },
              { label: "Draft", key: "draft", color: "#94a3b8", bg: "rgba(100,116,139,0.1)" },
              { label: "Published", key: "published", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
              { label: "Archived", key: "archived", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
            ].map((pill) => (
              <div
                key={pill.key}
                onClick={() => setStatusFilter(pill.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 20, cursor: "pointer",
                  background: statusFilter === pill.key ? pill.bg : "rgba(255,255,255,0.03)",
                  border: `1px solid ${statusFilter === pill.key ? pill.color + "44" : "rgba(255,255,255,0.06)"}`,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: statusFilter === pill.key ? pill.color : "#64748b" }}>
                  {pill.label}
                </span>
                <span style={{
                  background: statusFilter === pill.key ? pill.color + "22" : "rgba(255,255,255,0.06)",
                  color: statusFilter === pill.key ? pill.color : "#64748b",
                  borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                }}>
                  {statusCounts[pill.key]}
                </span>
              </div>
            ))}
          </div>

          {/* ── TOOLBAR */}
          <div style={{
            display: "flex", gap: 10, marginBottom: 16,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "8px 14px",
            }}>
              <SearchOutlined style={{ color: "#475569", fontSize: 14, flexShrink: 0 }} />
              <input
                placeholder="Search by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: 13, width: "100%" }}
              />
              {search && (
                <span onClick={() => setSearch("")} style={{ color: "#475569", cursor: "pointer", fontSize: 12 }}>✕</span>
              )}
            </div>

            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`Delete ${selectedRowKeys.length} test(s)?`}
                description="All linked questions and attempts will be removed."
                onConfirm={handleBulkDelete}
                okText="Delete All"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  icon={<DeleteOutlined />}
                  loading={bulkDeleteLoading}
                  style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 10, height: 38 }}
                >
                  Delete {selectedRowKeys.length} selected
                </Button>
              </Popconfirm>
            )}
          </div>

          {/* ── TABLE */}
          <div style={{ background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: 10,
            }}>
              <div>
                <h3 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, margin: 0, fontFamily: "'Syne', sans-serif" }}>
                  All Tests
                </h3>
                <p style={{ color: "#475569", fontSize: 12, margin: "2px 0 0" }}>
                  {filtered.length} {filtered.length === 1 ? "test" : "tests"} found
                </p>
              </div>
            </div>

            <Table
              dataSource={filtered}
              columns={columns}
              loading={loading}
              rowKey="id"
              size={isMobile ? "small" : "middle"}
              className="dark-table"
              scroll={{ x: isMobile ? 400 : undefined }}
              rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, columnWidth: 40 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: !isMobile,
                showTotal: (total) => (
                  <span style={{ color: "#64748b", fontSize: 12 }}>{total} total tests</span>
                ),
              }}
            />
          </div>
        </div>
      </main>

      {/* ── VIEW MODAL */}
      <Modal
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        title={null}
        width={isMobile ? "95%" : 520}
        styles={{
          content: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 0 },
          mask: { backdropFilter: "blur(4px)" },
        }}
      >
        {selectedTest && (
          <div style={{ padding: "28px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                📋
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 17, margin: "0 0 4px" }}>
                  {selectedTest.title}
                </h3>
                <Tag style={statusStyle(selectedTest.status)}>{selectedTest.status}</Tag>
              </div>
            </div>

            {/* Description */}
            {selectedTest.description && (
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, marginBottom: 20, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                {selectedTest.description}
              </p>
            )}

            {/* Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { icon: <ClockCircleOutlined />, label: "Time Limit", value: selectedTest.timeLimit ? `${selectedTest.timeLimit} minutes` : "No limit", color: "#38bdf8" },
                { icon: <TrophyOutlined />, label: "Pass Mark", value: `${selectedTest.passMarkPercent ?? 50}%`, color: "#f59e0b" },
                { icon: <CheckCircleOutlined />, label: "Max Attempts", value: selectedTest.maxAttempts ?? "Unlimited", color: "#34d399" },
                { icon: <CalendarOutlined />, label: "Created", value: selectedTest.createdAt ? new Date(selectedTest.createdAt).toLocaleDateString() : "—", color: "#a78bfa" },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ color: item.color, fontSize: 13 }}>{item.icon}</span>
                    <span style={{ color: "#475569", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</span>
                  </div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Schedule */}
            {(selectedTest.startDate || selectedTest.endDate) && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                <p style={{ color: "#475569", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>Schedule</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectedTest.startDate && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b", fontSize: 12 }}>Start</span>
                      <span style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600 }}>
                        {new Date(selectedTest.startDate).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedTest.endDate && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b", fontSize: 12 }}>End</span>
                      <span style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600 }}>
                        {new Date(selectedTest.endDate).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {selectedTest.status === "draft" && (
                <Button
                  onClick={() => { handlePublishTest(selectedTest.id); setViewModalOpen(false); }}
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", borderRadius: 8 }}
                >
                  Publish Test
                </Button>
              )}
              <Button
                onClick={() => { setViewModalOpen(false); handleEditTest(selectedTest); }}
                style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", borderRadius: 8 }}
              >
                Edit Test
              </Button>
              <Button
                onClick={() => setViewModalOpen(false)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── EDIT MODAL */}
      <Modal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        title={null}
        width={isMobile ? "95%" : 560}
        styles={{
          content: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 0 },
          mask: { backdropFilter: "blur(4px)" },
        }}
      >
        <div style={{ padding: "28px" }}>
          <h3 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16, margin: "0 0 20px", fontFamily: "'Syne', sans-serif" }}>
            Edit Test
          </h3>

          <Form form={form} layout="vertical" onFinish={handleUpdateTest}>
            <Form.Item name="title" label={<span style={{ color: "#94a3b8", fontSize: 13 }}>Title</span>}
              rules={[{ required: true, message: "Title is required" }]}>
              <Input style={inputStyle} placeholder="Test title" />
            </Form.Item>

            <Form.Item name="description" label={<span style={{ color: "#94a3b8", fontSize: 13 }}>Description</span>}>
              <Input.TextArea style={{ ...inputStyle, height: 80, resize: "none" }} placeholder="Test description" />
            </Form.Item>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <Form.Item name="timeLimit" label={<span style={{ color: "#94a3b8", fontSize: 13 }}>Time Limit (minutes)</span>}>
                <InputNumber min={1} style={{ ...inputStyle, width: "100%" }} placeholder="e.g. 60" />
              </Form.Item>

              <Form.Item name="maxAttempts" label={<span style={{ color: "#94a3b8", fontSize: 13 }}>Max Attempts</span>}>
                <InputNumber min={1} style={{ ...inputStyle, width: "100%" }} placeholder="e.g. 2" />
              </Form.Item>

              <Form.Item name="passMarkPercent" label={<span style={{ color: "#94a3b8", fontSize: 13 }}>Pass Mark (%)</span>}>
                <InputNumber min={1} max={100} style={{ ...inputStyle, width: "100%" }} placeholder="e.g. 50" />
              </Form.Item>

              <Form.Item name="status" label={<span style={{ color: "#94a3b8", fontSize: 13 }}>Status</span>}>
                <Select style={{ borderRadius: 10 }}>
                  <Select.Option value="draft">Draft</Select.Option>
                  <Select.Option value="published">Published</Select.Option>
                  <Select.Option value="archived">Archived</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <Form.Item name="startDate" label={<span style={{ color: "#94a3b8", fontSize: 13 }}>Start Date</span>}>
                <DatePicker showTime style={{ ...inputStyle, width: "100%" }} />
              </Form.Item>

              <Form.Item name="endDate" label={<span style={{ color: "#94a3b8", fontSize: 13 }}>End Date</span>}>
                <DatePicker showTime style={{ ...inputStyle, width: "100%" }} />
              </Form.Item>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Button onClick={() => setEditModalOpen(false)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 }}>
                Cancel
              </Button>
              <Button htmlType="submit" loading={editLoading}
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", color: "#fff", borderRadius: 8, fontWeight: 600 }}>
                Save Changes
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
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
        .dark-table .ant-table-tbody > tr:hover > td { background: rgba(245,158,11,0.04) !important; }
        .dark-table .ant-spin-dot-item { background: #f59e0b !important; }
        .dark-table .ant-pagination-item a { color: #64748b; }
        .dark-table .ant-pagination-item-active a { color: #f59e0b; }
        .dark-table .ant-pagination-item-active { border-color: #f59e0b !important; background: rgba(245,158,11,0.1) !important; }
        .dark-table .ant-checkbox-inner { background: transparent; border-color: #334155; }
        .dark-table .ant-checkbox-checked .ant-checkbox-inner { background: #f59e0b; border-color: #f59e0b; }
        .dark-table .ant-pagination { padding: 12px 20px !important; margin: 0 !important; }
        .ant-picker { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.1) !important; }
        .ant-picker input { color: #f1f5f9 !important; }
        .ant-picker-suffix { color: #64748b !important; }
        .ant-input-number { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.1) !important; }
        .ant-input-number input { color: #f1f5f9 !important; }
        .ant-input-number-handler-wrap { background: rgba(255,255,255,0.04) !important; }
      `}</style>
    </div>
  );
};

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#f1f5f9",
};

const styles = {
  wrapper: { display: "flex", minHeight: "100vh", background: "#080f1a", fontFamily: "'DM Sans', sans-serif" },
  sidebar: {
    background: "#0d1829", borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex", flexDirection: "column", padding: "24px 0",
    position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100, overflowY: "auto",
  },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 10, padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 19, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" },
  nav: { flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 },
  navItem: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 500, transition: "all 0.15s", position: "relative", userSelect: "none" },
  navItemActive: { background: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  navActiveBar: { position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: "#f59e0b", borderRadius: 2 },
  sidebarFooter: { padding: "14px 14px 0", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 10 },
  adminProfile: { display: "flex", alignItems: "center", gap: 10 },
  adminName: { color: "#f1f5f9", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  adminRole: { color: "#475569", fontSize: 11 },
  logoutBtn: { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 8, height: 34 },
  main: { flex: 1, minHeight: "100vh", background: "#080f1a" },
};