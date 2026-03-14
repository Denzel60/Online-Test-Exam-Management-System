// src/pages/admin/Settings.jsx
import { useState, useEffect } from "react";
import {
  Button, Avatar, Input, Form, Tag, message,
  Drawer, Tabs, Switch,
} from "antd";
import {
  UserOutlined, MailOutlined, LockOutlined,
  EditOutlined, SaveOutlined, CloseOutlined,
  LogoutOutlined, RiseOutlined, TeamOutlined,
  BookOutlined, FlagOutlined, SettingOutlined,
  CameraOutlined, CheckCircleOutlined, EyeInvisibleOutlined,
  EyeOutlined, MenuOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { axiosInstance } from "../../api/axiosInstance";
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

export const Settings = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    newAttempts: true,
    flaggedAlerts: true,
    weeklyReport: false,
  });
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => {
    profileForm.setFieldsValue({
      name: user.name || "",
      email: user.email || "",
    });
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSaveProfile = async (values) => {
    setSavingProfile(true);
    try {
      const { data } = await axiosInstance.patch("/users/me", {
        name: values.name,
        email: values.email,
      });

      // ✅ Update localStorage with new user data
      const updatedUser = { ...user, name: values.name, email: values.email };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditingProfile(false);
      messageApi.success("Profile updated successfully");
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (values) => {
    setSavingPassword(true);
    try {
      await axiosInstance.patch("/users/me", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      messageApi.success("Password changed successfully");
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    profileForm.setFieldsValue({ name: user.name, email: user.email });
    setEditingProfile(false);
  };

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
          <Avatar style={{ background: "#f59e0b", color: "#0f172a", fontWeight: 700, flexShrink: 0 }} size={36}>
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
      {contextHolder}

      {/* ── SIDEBAR */}
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
        width={240}
        styles={{ body: { padding: 0, background: "#0d1829" }, header: { display: "none" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px 0" }}>
          <SidebarContent />
        </div>
      </Drawer>

      {/* ── MAIN */}
      <main style={{ ...styles.main, marginLeft: isMobile ? 0 : isTablet ? 200 : 240 }}>
        <AdminHeader
          title="Settings"
          subtitle="Manage your account"
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        <div style={{ padding: isMobile ? "16px" : "28px 32px 40px" }}>

          {/* ── PAGE HEADER */}
          <div style={styles.pageHeader}>
            <h2 style={styles.pageTitle}>Account Settings</h2>
            <p style={styles.pageSubtitle}>Manage your profile, security and preferences</p>
          </div>

          <div style={{ display: "flex", gap: 24, flexDirection: isMobile || isTablet ? "column" : "row", alignItems: "flex-start" }}>

            {/* ── LEFT — PROFILE CARD */}
            <div style={{ ...styles.profileCard, width: isMobile || isTablet ? "100%" : 280, flexShrink: 0 }}>
              {/* Avatar Section */}
              <div style={styles.avatarSection}>
                <div style={styles.avatarWrapper}>
                  <Avatar
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a", fontWeight: 800, fontSize: 32 }}
                    size={96}
                  >
                    {user?.name?.[0]?.toUpperCase() || "A"}
                  </Avatar>
                  <div style={styles.avatarEditBtn}>
                    <CameraOutlined style={{ fontSize: 12, color: "#0f172a" }} />
                  </div>
                </div>
                <h3 style={styles.profileName}>{user?.name || "Admin"}</h3>
                <Tag style={styles.roleTag}>Administrator</Tag>
              </div>

              {/* Profile Info */}
              <div style={styles.profileInfo}>
                <div style={styles.infoRow}>
                  <MailOutlined style={{ color: "#475569", fontSize: 14 }} />
                  <div>
                    <div style={styles.infoLabel}>Email</div>
                    <div style={styles.infoValue}>{user?.email || "—"}</div>
                  </div>
                </div>
                <div style={styles.infoRow}>
                  <UserOutlined style={{ color: "#475569", fontSize: 14 }} />
                  <div>
                    <div style={styles.infoLabel}>Role</div>
                    <div style={styles.infoValue}>Administrator</div>
                  </div>
                </div>
                <div style={styles.infoRow}>
                  <CheckCircleOutlined style={{ color: "#34d399", fontSize: 14 }} />
                  <div>
                    <div style={styles.infoLabel}>Status</div>
                    <div style={{ ...styles.infoValue, color: "#34d399" }}>Active</div>
                  </div>
                </div>
              </div>

              {/* Edit Profile Button */}
              <Button
                icon={<EditOutlined />}
                onClick={() => { setEditingProfile(true); setActiveTab("profile"); }}
                style={styles.editProfileBtn}
                block
              >
                Edit Profile
              </Button>
            </div>

            {/* ── RIGHT — TABS */}
            <div style={{ flex: 1, width: "100%" }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                style={{ color: "#f1f5f9" }}
                items={[
                  {
                    key: "profile",
                    label: <span style={{ color: activeTab === "profile" ? "#f59e0b" : "#64748b", fontWeight: 600 }}>Profile</span>,
                    children: (
                      <div style={styles.tabContent}>
                        <div style={styles.sectionHeader}>
                          <div>
                            <h3 style={styles.sectionTitle}>Personal Information</h3>
                            <p style={styles.sectionSubtitle}>Update your name and email address</p>
                          </div>
                          {!editingProfile && (
                            <Button
                              icon={<EditOutlined />}
                              onClick={() => setEditingProfile(true)}
                              style={styles.smallEditBtn}
                              size="small"
                            >
                              Edit
                            </Button>
                          )}
                        </div>

                        <Form
                          form={profileForm}
                          layout="vertical"
                          onFinish={handleSaveProfile}
                        >
                          {/* Name */}
                          <Form.Item
                            name="name"
                            label={<span style={styles.formLabel}>Full Name</span>}
                            rules={[{ required: true, message: "Name is required" }]}
                          >
                            <Input
                              prefix={<UserOutlined style={{ color: "#475569" }} />}
                              disabled={!editingProfile}
                              style={{
                                ...styles.formInput,
                                background: editingProfile ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                                cursor: editingProfile ? "text" : "default",
                              }}
                              placeholder="Your full name"
                            />
                          </Form.Item>

                          {/* Email */}
                          <Form.Item
                            name="email"
                            label={<span style={styles.formLabel}>Email Address</span>}
                            rules={[
                              { required: true, message: "Email is required" },
                              { type: "email", message: "Enter a valid email" },
                            ]}
                          >
                            <Input
                              prefix={<MailOutlined style={{ color: "#475569" }} />}
                              disabled={!editingProfile}
                              style={{
                                ...styles.formInput,
                                background: editingProfile ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                                cursor: editingProfile ? "text" : "default",
                              }}
                              placeholder="your@email.com"
                            />
                          </Form.Item>

                          {/* Role — read only */}
                          <Form.Item label={<span style={styles.formLabel}>Role</span>}>
                            <Input
                              value="Administrator"
                              disabled
                              style={{ ...styles.formInput, background: "rgba(255,255,255,0.02)", cursor: "default" }}
                              prefix={<UserOutlined style={{ color: "#475569" }} />}
                            />
                          </Form.Item>

                          {/* Action Buttons */}
                          {editingProfile && (
                            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={savingProfile}
                                icon={<SaveOutlined />}
                                style={styles.saveBtn}
                              >
                                Save Changes
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                icon={<CloseOutlined />}
                                style={styles.cancelBtn}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </Form>
                      </div>
                    ),
                  },
                  {
                    key: "security",
                    label: <span style={{ color: activeTab === "security" ? "#f59e0b" : "#64748b", fontWeight: 600 }}>Security</span>,
                    children: (
                      <div style={styles.tabContent}>
                        <div style={styles.sectionHeader}>
                          <div>
                            <h3 style={styles.sectionTitle}>Change Password</h3>
                            <p style={styles.sectionSubtitle}>Update your password to keep your account secure</p>
                          </div>
                        </div>

                        <Form
                          form={passwordForm}
                          layout="vertical"
                          onFinish={handleChangePassword}
                        >
                          <Form.Item
                            name="currentPassword"
                            label={<span style={styles.formLabel}>Current Password</span>}
                            rules={[{ required: true, message: "Current password is required" }]}
                          >
                            <Input.Password
                              prefix={<LockOutlined style={{ color: "#475569" }} />}
                              style={styles.formInput}
                              placeholder="Enter current password"
                              iconRender={(visible) =>
                                visible
                                  ? <EyeOutlined style={{ color: "#475569" }} />
                                  : <EyeInvisibleOutlined style={{ color: "#475569" }} />
                              }
                            />
                          </Form.Item>

                          <Form.Item
                            name="newPassword"
                            label={<span style={styles.formLabel}>New Password</span>}
                            rules={[
                              { required: true, message: "New password is required" },
                              { min: 6, message: "Password must be at least 6 characters" },
                            ]}
                          >
                            <Input.Password
                              prefix={<LockOutlined style={{ color: "#475569" }} />}
                              style={styles.formInput}
                              placeholder="Enter new password"
                              iconRender={(visible) =>
                                visible
                                  ? <EyeOutlined style={{ color: "#475569" }} />
                                  : <EyeInvisibleOutlined style={{ color: "#475569" }} />
                              }
                            />
                          </Form.Item>

                          <Form.Item
                            name="confirmPassword"
                            label={<span style={styles.formLabel}>Confirm New Password</span>}
                            dependencies={["newPassword"]}
                            rules={[
                              { required: true, message: "Please confirm your password" },
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  if (!value || getFieldValue("newPassword") === value) {
                                    return Promise.resolve();
                                  }
                                  return Promise.reject(new Error("Passwords do not match"));
                                },
                              }),
                            ]}
                          >
                            <Input.Password
                              prefix={<LockOutlined style={{ color: "#475569" }} />}
                              style={styles.formInput}
                              placeholder="Confirm new password"
                              iconRender={(visible) =>
                                visible
                                  ? <EyeOutlined style={{ color: "#475569" }} />
                                  : <EyeInvisibleOutlined style={{ color: "#475569" }} />
                              }
                            />
                          </Form.Item>

                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={savingPassword}
                            icon={<LockOutlined />}
                            style={styles.saveBtn}
                          >
                            Update Password
                          </Button>
                        </Form>

                        {/* Danger Zone */}
                        <div style={styles.dangerZone}>
                          <h4 style={styles.dangerTitle}>⚠️ Danger Zone</h4>
                          <p style={styles.dangerDesc}>
                            Signing out will clear your session and require you to log in again.
                          </p>
                          <Button
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            style={styles.dangerBtn}
                          >
                            Sign Out of All Sessions
                          </Button>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "notifications",
                    label: <span style={{ color: activeTab === "notifications" ? "#f59e0b" : "#64748b", fontWeight: 600 }}>Notifications</span>,
                    children: (
                      <div style={styles.tabContent}>
                        <div style={styles.sectionHeader}>
                          <div>
                            <h3 style={styles.sectionTitle}>Notification Preferences</h3>
                            <p style={styles.sectionSubtitle}>Choose what you want to be notified about</p>
                          </div>
                        </div>

                        <div style={styles.notifList}>
                          {[
                            { key: "emailAlerts", label: "Email Alerts", desc: "Receive important alerts via email" },
                            { key: "newAttempts", label: "New Attempts", desc: "Get notified when a student submits a test" },
                            { key: "flaggedAlerts", label: "Flagged Attempts", desc: "Be alerted when an attempt is flagged" },
                            { key: "weeklyReport", label: "Weekly Report", desc: "Receive a weekly summary of activity" },
                          ].map((item) => (
                            <div key={item.key} style={styles.notifRow}>
                              <div style={{ flex: 1 }}>
                                <div style={styles.notifLabel}>{item.label}</div>
                                <div style={styles.notifDesc}>{item.desc}</div>
                              </div>
                              <Switch
                                checked={notifications[item.key]}
                                onChange={(val) => setNotifications((prev) => ({ ...prev, [item.key]: val }))}
                                style={{ background: notifications[item.key] ? "#f59e0b" : "#334155" }}
                              />
                            </div>
                          ))}
                        </div>

                        <Button
                          style={styles.saveBtn}
                          icon={<SaveOutlined />}
                          onClick={() => messageApi.success("Notification preferences saved")}
                        >
                          Save Preferences
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .ant-tabs-nav::before { border-color: rgba(255,255,255,0.06) !important; }
        .ant-tabs-ink-bar { background: #f59e0b !important; }
        .ant-tabs-tab { padding: 10px 0 !important; }
        .ant-tabs-tab + .ant-tabs-tab { margin-left: 24px !important; }

        .ant-input-affix-wrapper {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #f1f5f9 !important;
        }
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: rgba(245,158,11,0.5) !important;
          box-shadow: 0 0 0 2px rgba(245,158,11,0.1) !important;
        }
        .ant-input-affix-wrapper-disabled {
          background: rgba(255,255,255,0.02) !important;
          border-color: rgba(255,255,255,0.04) !important;
        }
        .ant-input {
          background: transparent !important;
          color: #f1f5f9 !important;
        }
        .ant-input::placeholder { color: #475569 !important; }
        .ant-input-disabled { color: #64748b !important; }
        .ant-form-item-label > label { color: #94a3b8 !important; }

        .ant-switch { min-width: 40px !important; }
      `}</style>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex", minHeight: "100vh",
    background: "#080f1a", fontFamily: "'DM Sans', sans-serif",
  },
  sidebar: {
    background: "#0d1829",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex", flexDirection: "column", padding: "24px 0",
    position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100, overflowY: "auto",
  },
  sidebarLogo: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 12,
  },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 19, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" },
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
    padding: "14px 14px 0", borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex", flexDirection: "column", gap: 10,
  },
  adminProfile: { display: "flex", alignItems: "center", gap: 10 },
  adminName: { color: "#f1f5f9", fontSize: 13, fontWeight: 600 },
  adminRole: { color: "#475569", fontSize: 11 },
  logoutBtn: {
    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
    color: "#f87171", borderRadius: 8, height: 34,
  },
  main: { flex: 1, minHeight: "100vh", background: "#080f1a" },

  // ── PAGE HEADER
  pageHeader: { marginBottom: 28 },
  pageTitle: {
    fontSize: 22, fontWeight: 800, color: "#f1f5f9",
    margin: "0 0 4px", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px",
  },
  pageSubtitle: { fontSize: 13, color: "#475569", margin: 0 },

  // ── PROFILE CARD
  profileCard: {
    background: "#0d1829",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20, padding: "28px 24px",
    display: "flex", flexDirection: "column", gap: 20,
  },
  avatarSection: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
  },
  avatarWrapper: { position: "relative", display: "inline-block" },
  avatarEditBtn: {
    position: "absolute", bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: "50%",
    background: "#f59e0b", display: "flex",
    alignItems: "center", justifyContent: "center",
    cursor: "pointer", border: "2px solid #0d1829",
  },
  profileName: {
    fontSize: 17, fontWeight: 700, color: "#f1f5f9",
    margin: 0, fontFamily: "'Syne', sans-serif", textAlign: "center",
  },
  roleTag: {
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.25)",
    color: "#f59e0b", borderRadius: 20, fontWeight: 600,
    fontSize: 11, letterSpacing: "0.5px", textTransform: "uppercase",
  },
  profileInfo: {
    display: "flex", flexDirection: "column", gap: 14,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    padding: "16px 0",
  },
  infoRow: { display: "flex", alignItems: "flex-start", gap: 12 },
  infoLabel: { fontSize: 11, color: "#475569", marginBottom: 2 },
  infoValue: { fontSize: 13, color: "#cbd5e1", fontWeight: 500, wordBreak: "break-all" },
  editProfileBtn: {
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.25)",
    color: "#f59e0b", borderRadius: 10,
    fontWeight: 600, height: 38,
  },

  // ── TABS CONTENT
  tabContent: {
    background: "#0d1829",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20, padding: "24px",
  },
  sectionHeader: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 24, gap: 12,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 700, color: "#f1f5f9",
    margin: "0 0 4px", fontFamily: "'Syne', sans-serif",
  },
  sectionSubtitle: { fontSize: 13, color: "#475569", margin: 0 },
  smallEditBtn: {
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.25)",
    color: "#f59e0b", borderRadius: 8, fontWeight: 600,
  },
  formLabel: { fontSize: 13, color: "#94a3b8", fontWeight: 500 },
  formInput: {
    borderRadius: 10, height: 44,
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f1f5f9", fontSize: 14,
  },
  saveBtn: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    border: "none", color: "#0f172a",
    borderRadius: 10, fontWeight: 700,
    height: 42, paddingLeft: 20, paddingRight: 20,
    boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
  },
  cancelBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8", borderRadius: 10,
    height: 42, paddingLeft: 20, paddingRight: 20,
  },

  // ── DANGER ZONE
  dangerZone: {
    marginTop: 32, padding: "20px",
    background: "rgba(248,113,113,0.05)",
    border: "1px solid rgba(248,113,113,0.15)",
    borderRadius: 14,
  },
  dangerTitle: { fontSize: 14, fontWeight: 700, color: "#f87171", margin: "0 0 8px" },
  dangerDesc: { fontSize: 13, color: "#64748b", margin: "0 0 16px" },
  dangerBtn: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#f87171", borderRadius: 10, fontWeight: 600, height: 38,
  },

  // ── NOTIFICATIONS
  notifList: {
    display: "flex", flexDirection: "column",
    gap: 0, marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, overflow: "hidden",
  },
  notifRow: {
    display: "flex", alignItems: "center", gap: 16,
    padding: "16px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: "transparent",
  },
  notifLabel: { fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 2 },
  notifDesc: { fontSize: 12, color: "#475569" },
};