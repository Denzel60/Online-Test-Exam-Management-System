// src/pages/teacher/Settings.jsx
import { useState, useEffect } from "react";
import {
  Button, Avatar, Input, Form, Tag, message,
  Drawer, Tabs, Switch,
} from "antd";
import {
  UserOutlined, MailOutlined, LockOutlined,
  EditOutlined, SaveOutlined, CloseOutlined,
  LogoutOutlined, HomeOutlined, BookOutlined,
  BarChartOutlined, FlagOutlined, SettingOutlined,
  CameraOutlined, CheckCircleOutlined, EyeInvisibleOutlined,
  EyeOutlined, MenuOutlined, TeamOutlined, PlusOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { axiosInstance } from "../../api/axiosInstance";

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

export const TeacherSettings = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [stats, setStats] = useState({ totalTests: 0, published: 0, drafts: 0 });
  const [notifications, setNotifications] = useState({
    newAttempts: true,
    flaggedAlerts: true,
    testDeadlines: true,
    weeklyReport: false,
  });
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => {
    profileForm.setFieldsValue({ name: user.name || "", email: user.email || "" });
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axiosInstance.get("/tests");
      const mine = (data.tests || []).filter((t) => t.createdBy === user.id);
      setStats({
        totalTests: mine.length,
        published: mine.filter((t) => t.status === "published").length,
        drafts: mine.filter((t) => t.status === "draft").length,
      });
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSaveProfile = async (values) => {
    setSavingProfile(true);
    try {
      await axiosInstance.patch("/users/me", { name: values.name, email: values.email });
      const updated = { ...user, name: values.name, email: values.email };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
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
      await axiosInstance.patch("/users/me", { currentPassword: values.currentPassword, newPassword: values.newPassword });
      passwordForm.resetFields();
      messageApi.success("Password changed successfully");
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div style={styles.sidebarLogo}><span>📝</span><span style={styles.logoText}>ExamFlow</span></div>
      <div style={styles.sidebarProfile}>
        <Avatar style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff", fontWeight: 700, fontSize: 18 }} size={52}>
          {user?.name?.[0]?.toUpperCase() || "T"}
        </Avatar>
        <div style={styles.sidebarProfileName}>{user?.name || "Teacher"}</div>
        <div style={styles.sidebarProfileEmail}>{user?.email || ""}</div>
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
                <span style={styles.breadcrumbCurrent}>Settings</span>
              </div>
              <h1 style={{ ...styles.pageTitle, fontSize: isMobile ? 16 : 20 }}>Settings</h1>
            </div>
          </div>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} style={styles.logoutHeaderBtn} size={isMobile ? "small" : "middle"}>
            {!isMobile && "Sign Out"}
          </Button>
        </header>

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>
          <div style={{ display: "flex", gap: 24, flexDirection: isMobile || isTablet ? "column" : "row", alignItems: "flex-start" }}>

            {/* ── PROFILE CARD */}
            <div style={{ ...styles.profileCard, width: isMobile || isTablet ? "100%" : 280, flexShrink: 0 }}>
              <div style={styles.avatarSection}>
                <div style={styles.avatarWrapper}>
                  <Avatar style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff", fontWeight: 800, fontSize: 32 }} size={96}>
                    {user?.name?.[0]?.toUpperCase() || "T"}
                  </Avatar>
                  <div style={styles.avatarEditBtn}><CameraOutlined style={{ fontSize: 12, color: "#0f172a" }} /></div>
                </div>
                <h3 style={styles.profileName}>{user?.name || "Teacher"}</h3>
                <Tag style={styles.roleTag}><TeamOutlined style={{ fontSize: 10, marginRight: 4 }} /> Teacher</Tag>
              </div>

              {/* Teacher Stats */}
              <div style={styles.quickStats}>
                <div style={styles.quickStat}>
                  <div style={{ ...styles.quickStatValue, color: "#38bdf8" }}>{stats.totalTests}</div>
                  <div style={styles.quickStatLabel}>My Tests</div>
                </div>
                <div style={styles.quickStatDivider} />
                <div style={styles.quickStat}>
                  <div style={{ ...styles.quickStatValue, color: "#34d399" }}>{stats.published}</div>
                  <div style={styles.quickStatLabel}>Published</div>
                </div>
                <div style={styles.quickStatDivider} />
                <div style={styles.quickStat}>
                  <div style={{ ...styles.quickStatValue, color: "#f59e0b" }}>{stats.drafts}</div>
                  <div style={styles.quickStatLabel}>Drafts</div>
                </div>
              </div>

              <div style={styles.profileInfo}>
                <div style={styles.infoRow}>
                  <MailOutlined style={{ color: "#475569", fontSize: 14, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.infoLabel}>Email</div>
                    <div style={{ ...styles.infoValue, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email || "—"}</div>
                  </div>
                </div>
                <div style={styles.infoRow}>
                  <UserOutlined style={{ color: "#475569", fontSize: 14, flexShrink: 0 }} />
                  <div>
                    <div style={styles.infoLabel}>Role</div>
                    <div style={styles.infoValue}>Teacher</div>
                  </div>
                </div>
                <div style={styles.infoRow}>
                  <CheckCircleOutlined style={{ color: "#34d399", fontSize: 14, flexShrink: 0 }} />
                  <div>
                    <div style={styles.infoLabel}>Status</div>
                    <div style={{ ...styles.infoValue, color: "#34d399" }}>Active</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Button block icon={<BookOutlined />} onClick={() => navigate("/teacher/tests")}
                  style={styles.quickLinkBtn}>My Tests</Button>
                <Button block icon={<PlusOutlined />} onClick={() => navigate("/teacher/tests/create")}
                  style={styles.quickLinkBtn}>Create Test</Button>
              </div>
            </div>

            {/* ── TABS */}
            <div style={{ flex: 1, width: "100%" }}>
              <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
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
                          <Button icon={<EditOutlined />} onClick={() => setEditingProfile(true)} style={styles.smallEditBtn} size="small">Edit</Button>
                        )}
                      </div>
                      <Form form={profileForm} layout="vertical" onFinish={handleSaveProfile}>
                        <Form.Item name="name" label={<span style={styles.formLabel}>Full Name</span>} rules={[{ required: true }]}>
                          <Input prefix={<UserOutlined style={{ color: "#475569" }} />} disabled={!editingProfile} style={{ ...styles.formInput, background: editingProfile ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)" }} />
                        </Form.Item>
                        <Form.Item name="email" label={<span style={styles.formLabel}>Email Address</span>} rules={[{ required: true }, { type: "email" }]}>
                          <Input prefix={<MailOutlined style={{ color: "#475569" }} />} disabled={!editingProfile} style={{ ...styles.formInput, background: editingProfile ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)" }} />
                        </Form.Item>
                        <Form.Item label={<span style={styles.formLabel}>Role</span>}>
                          <Input value="Teacher" disabled prefix={<TeamOutlined style={{ color: "#475569" }} />} style={{ ...styles.formInput, background: "rgba(255,255,255,0.02)" }} />
                        </Form.Item>
                        {editingProfile && (
                          <div style={{ display: "flex", gap: 10 }}>
                            <Button type="primary" htmlType="submit" loading={savingProfile} icon={<SaveOutlined />} style={styles.saveBtn}>Save Changes</Button>
                            <Button onClick={() => { profileForm.setFieldsValue({ name: user.name, email: user.email }); setEditingProfile(false); }} icon={<CloseOutlined />} style={styles.cancelBtn}>Cancel</Button>
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
                          <p style={styles.sectionSubtitle}>Keep your account secure</p>
                        </div>
                      </div>
                      <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                        {["currentPassword", "newPassword", "confirmPassword"].map((field, i) => (
                          <Form.Item key={field} name={field}
                            label={<span style={styles.formLabel}>{["Current Password", "New Password", "Confirm New Password"][i]}</span>}
                            rules={[
                              { required: true },
                              ...(field === "newPassword" ? [{ min: 6 }] : []),
                              ...(field === "confirmPassword" ? [{
                                validator: (_, val) => {
                                  if (!val || passwordForm.getFieldValue("newPassword") === val) return Promise.resolve();
                                  return Promise.reject("Passwords do not match");
                                }
                              }] : []),
                            ]}
                            dependencies={field === "confirmPassword" ? ["newPassword"] : []}
                          >
                            <Input.Password prefix={<LockOutlined style={{ color: "#475569" }} />} style={styles.formInput}
                              iconRender={(v) => v ? <EyeOutlined style={{ color: "#475569" }} /> : <EyeInvisibleOutlined style={{ color: "#475569" }} />} />
                          </Form.Item>
                        ))}
                        <Button type="primary" htmlType="submit" loading={savingPassword} icon={<LockOutlined />} style={styles.saveBtn}>Update Password</Button>
                      </Form>
                      <div style={styles.dangerZone}>
                        <h4 style={styles.dangerTitle}>⚠️ Danger Zone</h4>
                        <p style={styles.dangerDesc}>Signing out will end your current session.</p>
                        <Button icon={<LogoutOutlined />} onClick={handleLogout} style={styles.dangerBtn}>Sign Out</Button>
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
                          <p style={styles.sectionSubtitle}>Control what you get notified about</p>
                        </div>
                      </div>
                      <div style={styles.notifList}>
                        {[
                          { key: "newAttempts", label: "New Attempts", desc: "Get notified when a student submits a test", icon: "📝" },
                          { key: "flaggedAlerts", label: "Flagged Attempts", desc: "Be alerted when an attempt is flagged", icon: "🚩" },
                          { key: "testDeadlines", label: "Test Deadlines", desc: "Reminders before your tests expire", icon: "⏰" },
                          { key: "weeklyReport", label: "Weekly Report", desc: "A weekly summary of student performance", icon: "📊" },
                        ].map((item) => (
                          <div key={item.key} style={styles.notifRow}>
                            <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={styles.notifLabel}>{item.label}</div>
                              <div style={styles.notifDesc}>{item.desc}</div>
                            </div>
                            <Switch checked={notifications[item.key]}
                              onChange={(val) => setNotifications((p) => ({ ...p, [item.key]: val }))}
                              style={{ background: notifications[item.key] ? "#f59e0b" : "#334155" }} />
                          </div>
                        ))}
                      </div>
                      <Button style={styles.saveBtn} icon={<SaveOutlined />}
                        onClick={() => messageApi.success("Preferences saved")}>
                        Save Preferences
                      </Button>
                    </div>
                  ),
                },
              ]} />
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .ant-tabs-nav::before { border-color: rgba(255,255,255,0.06) !important; }
        .ant-tabs-ink-bar { background: #f59e0b !important; }
        .ant-tabs-tab { padding: 10px 0 !important; }
        .ant-tabs-tab + .ant-tabs-tab { margin-left: 24px !important; }
        .ant-input-affix-wrapper { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.08) !important; color: #f1f5f9 !important; }
        .ant-input-affix-wrapper:focus, .ant-input-affix-wrapper-focused { border-color: rgba(245,158,11,0.5) !important; box-shadow: 0 0 0 2px rgba(245,158,11,0.1) !important; }
        .ant-input-affix-wrapper-disabled { background: rgba(255,255,255,0.02) !important; }
        .ant-input { background: transparent !important; color: #f1f5f9 !important; }
        .ant-input::placeholder { color: #475569 !important; }
        .ant-input-disabled { color: #64748b !important; }
        .ant-form-item-label > label { color: #94a3b8 !important; }
        .ant-switch { min-width: 40px !important; }
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
  pageTitle: { fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" },
  logoutHeaderBtn: { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 10 },
  profileCard: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 },
  avatarSection: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  avatarWrapper: { position: "relative", display: "inline-block" },
  avatarEditBtn: { position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #0d1829" },
  profileName: { fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif", textAlign: "center" },
  roleTag: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", borderRadius: 20, fontWeight: 600, fontSize: 11 },
  quickStats: { display: "flex", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px 8px" },
  quickStat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  quickStatValue: { fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif", lineHeight: 1 },
  quickStatLabel: { fontSize: 10, color: "#475569" },
  quickStatDivider: { width: 1, height: 32, background: "rgba(255,255,255,0.06)" },
  profileInfo: { display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 0" },
  infoRow: { display: "flex", alignItems: "flex-start", gap: 12 },
  infoLabel: { fontSize: 11, color: "#475569", marginBottom: 2 },
  infoValue: { fontSize: 13, color: "#cbd5e1", fontWeight: 500 },
  quickLinkBtn: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", color: "#f59e0b", borderRadius: 10, fontWeight: 500, height: 36, fontSize: 13 },
  tabContent: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "24px" },
  sectionHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px", fontFamily: "'Syne', sans-serif" },
  sectionSubtitle: { fontSize: 13, color: "#475569", margin: 0 },
  smallEditBtn: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", borderRadius: 8, fontWeight: 600 },
  formLabel: { fontSize: 13, color: "#94a3b8", fontWeight: 500 },
  formInput: { borderRadius: 10, height: 44, border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9", fontSize: 14 },
  saveBtn: { background: "linear-gradient(135deg, #f59e0b, #f97316)", border: "none", color: "#0f172a", borderRadius: 10, fontWeight: 700, height: 42, paddingInline: 20, boxShadow: "0 4px 14px rgba(245,158,11,0.3)" },
  cancelBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 10, height: 42, paddingInline: 20 },
  dangerZone: { marginTop: 28, padding: "20px", background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 14 },
  dangerTitle: { fontSize: 14, fontWeight: 700, color: "#f87171", margin: "0 0 8px" },
  dangerDesc: { fontSize: 13, color: "#64748b", margin: "0 0 16px" },
  dangerBtn: { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: 10, fontWeight: 600, height: 38 },
  notifList: { display: "flex", flexDirection: "column", gap: 0, marginBottom: 24, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" },
  notifRow: { display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  notifLabel: { fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 2 },
  notifDesc: { fontSize: 12, color: "#475569" },
};