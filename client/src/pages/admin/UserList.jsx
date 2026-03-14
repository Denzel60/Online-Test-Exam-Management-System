import { useState, useEffect } from "react";
import {
  Table, Tag, Button, Avatar, Drawer, Input,
  Select, Modal, Form, message, Popconfirm, Badge
} from "antd";
import {
  LogoutOutlined, SettingOutlined, RiseOutlined,
  TeamOutlined, BookOutlined, FlagOutlined,
  SearchOutlined, PlusOutlined, DeleteOutlined,
  EditOutlined, FilterOutlined, ArrowRightOutlined,
  ExclamationCircleOutlined, MenuOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import { AdminHeader } from "../../components/AdminHeader";

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

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let result = [...users];
    if (search) {
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }
    setFiltered(result);
  }, [search, roleFilter, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/users");
      setUsers(data.users || []);
      setFiltered(data.users || []);
    } catch {
      message.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      message.success("User deleted successfully");
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      await axiosInstance.delete("/users/bulk", { data: { ids: selectedRowKeys } });
      message.success(`${selectedRowKeys.length} user(s) deleted`);
      setSelectedRowKeys([]);
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || "Bulk delete failed");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleEditUser = (record) => {
    setSelectedUser(record);
    form.setFieldsValue({ role: record.role });
    setEditModalOpen(true);
  };

  const handleUpdateRole = async (values) => {
    setEditLoading(true);
    try {
      await axiosInstance.patch(`/users/${selectedUser.id}/role`, { role: values.role });
      message.success("Role updated successfully");
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const roleCounts = {
    all: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    teacher: users.filter((u) => u.role === "teacher").length,
    student: users.filter((u) => u.role === "student").length,
  };

  const columns = [
    {
      title: "User",
      dataIndex: "name",
      render: (name, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            style={{ background: record.role === "admin" ? "#f59e0b" : record.role === "teacher" ? "#38bdf8" : "#34d399", color: "#0f172a", fontWeight: 700, flexShrink: 0 }}
            size={isMobile ? 28 : 34}
          >
            {name?.[0]?.toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </div>
            <div style={{ color: "#64748b", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      width: 110,
      render: (role) => (
        <Tag style={{
          background: role === "admin" ? "rgba(245,158,11,0.15)" : role === "teacher" ? "rgba(56,189,248,0.15)" : "rgba(52,211,153,0.15)",
          color: role === "admin" ? "#f59e0b" : role === "teacher" ? "#38bdf8" : "#34d399",
          border: "none", borderRadius: 6, fontWeight: 600, fontSize: 11,
          textTransform: "uppercase", letterSpacing: "0.5px",
        }}>
          {role}
        </Tag>
      ),
    },
    ...(!isMobile ? [{
      title: "Joined",
      dataIndex: "createdAt",
      width: 120,
      render: (date) => (
        <span style={{ color: "#64748b", fontSize: 12 }}>
          {date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
        </span>
      ),
    }] : []),
    {
      title: "Actions",
      width: isMobile ? 80 : 120,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", borderRadius: 6 }}
          />
          <Popconfirm
            title="Delete this user?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            icon={<ExclamationCircleOutlined style={{ color: "#f87171" }} />}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 6 }}
            />
          </Popconfirm>
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
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside style={{ ...styles.sidebar, width: isTablet ? 200 : 240 }}>
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Drawer */}
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

      {/* Main */}
      <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240 }}>
        <AdminHeader
          title="Users"
          subtitle="Manage all system users"
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* ── STAT PILLS */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { label: "All Users", key: "all", color: "#f1f5f9", bg: "rgba(241,245,249,0.08)" },
              { label: "Admins", key: "admin", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
              { label: "Teachers", key: "teacher", color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
              { label: "Students", key: "student", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
            ].map((pill) => (
              <div
                key={pill.key}
                onClick={() => setRoleFilter(pill.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 20, cursor: "pointer",
                  background: roleFilter === pill.key ? pill.bg : "rgba(255,255,255,0.03)",
                  border: `1px solid ${roleFilter === pill.key ? pill.color + "44" : "rgba(255,255,255,0.06)"}`,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: roleFilter === pill.key ? pill.color : "#64748b" }}>
                  {pill.label}
                </span>
                <span style={{
                  background: roleFilter === pill.key ? pill.color + "22" : "rgba(255,255,255,0.06)",
                  color: roleFilter === pill.key ? pill.color : "#64748b",
                  borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                }}>
                  {roleCounts[pill.key]}
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
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "8px 14px",
            }}>
              <SearchOutlined style={{ color: "#475569", fontSize: 14, flexShrink: 0 }} />
              <input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: 13, width: "100%" }}
              />
              {search && (
                <span onClick={() => setSearch("")} style={{ color: "#475569", cursor: "pointer", fontSize: 12 }}>✕</span>
              )}
            </div>

            {/* Bulk delete */}
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`Delete ${selectedRowKeys.length} user(s)?`}
                description="This action cannot be undone."
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
            {/* Table header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexWrap: "wrap", gap: 10,
            }}>
              <div>
                <h3 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, margin: 0, fontFamily: "'Syne', sans-serif" }}>
                  All Users
                </h3>
                <p style={{ color: "#475569", fontSize: 12, margin: "2px 0 0" }}>
                  {filtered.length} {filtered.length === 1 ? "user" : "users"} found
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
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
                columnWidth: 40,
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: !isMobile,
                showTotal: (total) => (
                  <span style={{ color: "#64748b", fontSize: 12 }}>{total} total users</span>
                ),
                style: { padding: "12px 20px" },
              }}
            />
          </div>

        </div>
      </main>

      {/* ── EDIT ROLE MODAL */}
      <Modal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        title={null}
        styles={{
          content: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 0 },
          mask: { backdropFilter: "blur(4px)" },
        }}
      >
        <div style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <Avatar
              style={{ background: "#f59e0b", color: "#0f172a", fontWeight: 700 }}
              size={46}
            >
              {selectedUser?.name?.[0]?.toUpperCase()}
            </Avatar>
            <div>
              <h3 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16, margin: 0 }}>
                {selectedUser?.name}
              </h3>
              <p style={{ color: "#64748b", fontSize: 13, margin: "2px 0 0" }}>
                {selectedUser?.email}
              </p>
            </div>
          </div>

          <Form form={form} layout="vertical" onFinish={handleUpdateRole}>
            <Form.Item
              name="role"
              label={<span style={{ color: "#94a3b8", fontSize: 13 }}>Role</span>}
              rules={[{ required: true, message: "Please select a role" }]}
            >
              <Select
                style={{ borderRadius: 10 }}
                styles={{ popup: { root: { background: "#1e293b" } } }}
              >
                <Select.Option value="student">👨‍🎓 Student</Select.Option>
                <Select.Option value="teacher">👩‍🏫 Teacher</Select.Option>
                <Select.Option value="admin">🛡️ Admin</Select.Option>
              </Select>
            </Form.Item>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Button
                onClick={() => setEditModalOpen(false)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 }}
              >
                Cancel
              </Button>
              <Button
                htmlType="submit"
                loading={editLoading}
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", color: "#fff", borderRadius: 8, fontWeight: 600 }}
              >
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
          background: rgba(255,255,255,0.03) !important;
          color: #64748b !important;
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
        .dark-table .ant-table-selection-column { padding-left: 16px !important; }
        .dark-table .ant-pagination { padding: 12px 20px !important; margin: 0 !important; }
      `}</style>
    </div>
  );
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