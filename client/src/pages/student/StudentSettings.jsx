// src/pages/student/Settings.jsx
import { useState, useEffect } from "react";
import {
  Button, Avatar, Input, Form, Tag, message,
  Drawer, Tabs, Switch,
} from "antd";
import {
  UserOutlined, MailOutlined, LockOutlined,
  EditOutlined, SaveOutlined, CloseOutlined,
  LogoutOutlined, HomeOutlined, BookOutlined,
  FileTextOutlined, BarChartOutlined, SettingOutlined,
  CameraOutlined, CheckCircleOutlined, EyeInvisibleOutlined,
  EyeOutlined, MenuOutlined, TeamOutlined, PlusOutlined,
  TrophyOutlined, StarOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { axiosInstance } from "../../api/axiosInstance";

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

export const StudentSettings = () => {
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
  const [stats, setStats] = useState({
    totalAttempts: 0,
    passed: 0,
    avgScore: 0,
  });
  const [notifications, setNotifications] = useState({
    testReminders: true,
    resultsReady: true,
    newTestsAvailable: true,
    weeklyProgress: false,
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
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axiosInstance.get("/student/tests/attempts");
      const attempts = data.attempts || [];
      const submitted = attempts.filter((a) => a.status === "submitted");
      const passed = submitted.filter((a) => a.isPassed);
      const avgScore =
        submitted.length > 0
          ? Math.round(
              submitted.reduce(
                (s, a) =>
                  s +
                  (a.totalPoints > 0
                    ? (a.score / a.totalPoints) * 100
                    : 0),
                0
              ) / submitted.length
            )
          : 0;
      setStats({
        totalAttempts: submitted.length,
        passed: passed.length,
        avgScore,
      });
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
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
      const { data } = await axiosInstance.patch("/users/me", {
        name: values.name,
        email: values.email,
      });

      const updatedUser = data.user || {
        ...user,
        name: values.name,
        email: values.email,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditingProfile(false);

      messageApi.success({
        content: "Profile updated successfully!",
        duration: 3,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(52,211,153,0.3)",
          borderRadius: 10,
          color: "#34d399",
        },
      });
    } catch (err) {
      messageApi.error({
        content:
          err.response?.data?.message || "Failed to update profile",
        duration: 4,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 10,
          color: "#f87171",
        },
      });
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

      messageApi.success({
        content: "Password changed successfully!",
        duration: 3,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(52,211,153,0.3)",
          borderRadius: 10,
          color: "#34d399",
        },
      });
    } catch (err) {
      messageApi.error({
        content:
          err.response?.data?.message || "Failed to change password",
        duration: 4,
        style: {
          background: "#0d1829",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 10,
          color: "#f87171",
        },
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    profileForm.setFieldsValue({ name: user.name, email: user.email });
    setEditingProfile(false);
  };

  const passRate =
    stats.totalAttempts > 0
      ? Math.round((stats.passed / stats.totalAttempts) * 100)
      : 0;

  const SidebarContent = () => (
    <>
      <div style={styles.sidebarLogo}>
        <span>📝</span>
        <span style={styles.logoText}>ExamFlow</span>
      </div>

      {/* Student Profile in Sidebar */}
      <div style={styles.sidebarProfile}>
        <Avatar
          style={{
            background: "linear-gradient(135deg, #38bdf8, #818cf8)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
          }}
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
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  color: isActive ? "#38bdf8" : "#64748b",
                }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && <div style={styles.navActiveBar} />}
            </div>
          );
        })}
      </nav>

      <div style={styles.sidebarFooter}>
        <Button
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={styles.logoutBtn}
          size="small"
          block
        >
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
        width={260}
        styles={{
          body: { padding: 0, background: "#080f1a" },
          header: { display: "none" },
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "24px 0",
          }}
        >
          <SidebarContent />
        </div>
      </Drawer>

      {/* ── MAIN */}
      <main
        style={{
          ...styles.main,
          marginLeft: isMobile ? 0 : isTablet ? 200 : 240,
        }}
      >
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
                <span style={styles.breadcrumbCurrent}>Settings</span>
              </div>
              <h1
                style={{
                  ...styles.pageTitle,
                  fontSize: isMobile ? 16 : 20,
                }}
              >
                Settings
              </h1>
            </div>
          </div>
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={styles.logoutHeaderBtn}
            size={isMobile ? "small" : "middle"}
          >
            {!isMobile && "Sign Out"}
          </Button>
        </header>

        <div
          style={{
            padding: isMobile
              ? "16px"
              : isTablet
              ? "20px 24px"
              : "28px 32px 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 24,
              flexDirection: isMobile || isTablet ? "column" : "row",
              alignItems: "flex-start",
            }}
          >
            {/* ── LEFT — PROFILE CARD */}
            <div
              style={{
                ...styles.profileCard,
                width: isMobile || isTablet ? "100%" : 280,
                flexShrink: 0,
              }}
            >
              {/* Avatar */}
              <div style={styles.avatarSection}>
                <div style={styles.avatarWrapper}>
                  <Avatar
                    style={{
                      background:
                        "linear-gradient(135deg, #38bdf8, #818cf8)",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 32,
                    }}
                    size={96}
                  >
                    {user?.name?.[0]?.toUpperCase() || "S"}
                  </Avatar>
                  <div style={styles.avatarEditBtn}>
                    <CameraOutlined
                      style={{ fontSize: 12, color: "#fff" }}
                    />
                  </div>
                </div>
                <h3 style={styles.profileName}>
                  {user?.name || "Student"}
                </h3>
                <Tag style={styles.roleTag}>
                  <StarOutlined
                    style={{ fontSize: 10, marginRight: 4 }}
                  />
                  Student
                </Tag>
              </div>

              {/* Quick Stats */}
              <div style={styles.quickStats}>
                <div style={styles.quickStat}>
                  <div
                    style={{
                      ...styles.quickStatValue,
                      color: "#38bdf8",
                    }}
                  >
                    {stats.totalAttempts}
                  </div>
                  <div style={styles.quickStatLabel}>Tests Done</div>
                </div>
                <div style={styles.quickStatDivider} />
                <div style={styles.quickStat}>
                  <div
                    style={{
                      ...styles.quickStatValue,
                      color: "#34d399",
                    }}
                  >
                    {passRate}%
                  </div>
                  <div style={styles.quickStatLabel}>Pass Rate</div>
                </div>
                <div style={styles.quickStatDivider} />
                <div style={styles.quickStat}>
                  <div
                    style={{
                      ...styles.quickStatValue,
                      color: "#a78bfa",
                    }}
                  >
                    {stats.avgScore}%
                  </div>
                  <div style={styles.quickStatLabel}>Avg Score</div>
                </div>
              </div>

              {/* Info */}
              <div style={styles.profileInfo}>
                <div style={styles.infoRow}>
                  <MailOutlined
                    style={{
                      color: "#475569",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.infoLabel}>Email</div>
                    <div
                      style={{
                        ...styles.infoValue,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user?.email || "—"}
                    </div>
                  </div>
                </div>
                <div style={styles.infoRow}>
                  <UserOutlined
                    style={{
                      color: "#475569",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={styles.infoLabel}>Role</div>
                    <div style={styles.infoValue}>Student</div>
                  </div>
                </div>
                <div style={styles.infoRow}>
                  <TrophyOutlined
                    style={{
                      color: "#f59e0b",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={styles.infoLabel}>Best Score</div>
                    <div style={{ ...styles.infoValue, color: "#f59e0b" }}>
                      {stats.avgScore}% avg
                    </div>
                  </div>
                </div>
                <div style={styles.infoRow}>
                  <CheckCircleOutlined
                    style={{
                      color: "#34d399",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={styles.infoLabel}>Status</div>
                    <div
                      style={{ ...styles.infoValue, color: "#34d399" }}
                    >
                      Active
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div style={styles.quickLinks}>
                <Button
                  block
                  icon={<BookOutlined />}
                  onClick={() => navigate("/student/tests")}
                  style={styles.quickLinkBtn}
                >
                  Browse Tests
                </Button>
                <Button
                  block
                  icon={<BarChartOutlined />}
                  onClick={() => navigate("/student/results")}
                  style={styles.quickLinkBtn}
                >
                  View Results
                </Button>
              </div>
            </div>

            {/* ── RIGHT — TABS */}
            <div style={{ flex: 1, width: "100%", minWidth: 0 }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                style={{ color: "#f1f5f9" }}
                items={[
                  // ── PROFILE TAB
                  {
                    key: "profile",
                    label: (
                      <span
                        style={{
                          color:
                            activeTab === "profile"
                              ? "#38bdf8"
                              : "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Profile
                      </span>
                    ),
                    children: (
                      <div style={styles.tabContent}>
                        <div style={styles.sectionHeader}>
                          <div>
                            <h3 style={styles.sectionTitle}>
                              Personal Information
                            </h3>
                            <p style={styles.sectionSubtitle}>
                              Update your name and email address
                            </p>
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
                          style={{ width: "100%" }}
                        >
                          <Form.Item
                            name="name"
                            label={
                              <span style={styles.formLabel}>
                                Full Name
                              </span>
                            }
                            rules={[
                              {
                                required: true,
                                message: "Name is required",
                              },
                            ]}
                            style={{ width: "100%" }}
                          >
                            <Input
                              prefix={
                                <UserOutlined
                                  style={{ color: "#475569" }}
                                />
                              }
                              disabled={!editingProfile}
                              style={{
                                ...styles.formInput,
                                width: "100%",
                                background: editingProfile
                                  ? "rgba(255,255,255,0.06)"
                                  : "rgba(255,255,255,0.02)",
                                cursor: editingProfile
                                  ? "text"
                                  : "default",
                              }}
                              placeholder="Your full name"
                            />
                          </Form.Item>

                          <Form.Item
                            name="email"
                            label={
                              <span style={styles.formLabel}>
                                Email Address
                              </span>
                            }
                            rules={[
                              {
                                required: true,
                                message: "Email is required",
                              },
                              {
                                type: "email",
                                message: "Enter a valid email",
                              },
                            ]}
                            style={{ width: "100%" }}
                          >
                            <Input
                              prefix={
                                <MailOutlined
                                  style={{ color: "#475569" }}
                                />
                              }
                              disabled={!editingProfile}
                              style={{
                                ...styles.formInput,
                                width: "100%",
                                background: editingProfile
                                  ? "rgba(255,255,255,0.06)"
                                  : "rgba(255,255,255,0.02)",
                                cursor: editingProfile
                                  ? "text"
                                  : "default",
                              }}
                              placeholder="your@email.com"
                            />
                          </Form.Item>

                          {/* Role — read only */}
                          <Form.Item
                            label={
                              <span style={styles.formLabel}>Role</span>
                            }
                            style={{ width: "100%" }}
                          >
                            <Input
                              value="Student"
                              disabled
                              prefix={
                                <StarOutlined
                                  style={{ color: "#475569" }}
                                />
                              }
                              style={{
                                ...styles.formInput,
                                width: "100%",
                                background: "rgba(255,255,255,0.02)",
                              }}
                            />
                          </Form.Item>

                          {editingProfile && (
                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                marginTop: 8,
                                flexWrap: "wrap",
                              }}
                            >
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

                  // ── SECURITY TAB
                  {
                    key: "security",
                    label: (
                      <span
                        style={{
                          color:
                            activeTab === "security"
                              ? "#38bdf8"
                              : "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Security
                      </span>
                    ),
                    children: (
                      <div style={styles.tabContent}>
                        <div style={styles.sectionHeader}>
                          <div>
                            <h3 style={styles.sectionTitle}>
                              Change Password
                            </h3>
                            <p style={styles.sectionSubtitle}>
                              Keep your account secure with a strong
                              password
                            </p>
                          </div>
                        </div>

                        {/* Password tips */}
                        <div style={styles.passwordTips}>
                          {[
                            "At least 6 characters",
                            "Mix letters and numbers",
                            "Avoid using your name or email",
                          ].map((tip) => (
                            <div key={tip} style={styles.passwordTip}>
                              <CheckCircleOutlined
                                style={{ color: "#34d399", fontSize: 12 }}
                              />
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>

                        <Form
                          form={passwordForm}
                          layout="vertical"
                          onFinish={handleChangePassword}
                          style={{ width: "100%" }}
                        >
                          <Form.Item
                            name="currentPassword"
                            label={
                              <span style={styles.formLabel}>
                                Current Password
                              </span>
                            }
                            rules={[
                              {
                                required: true,
                                message: "Current password is required",
                              },
                            ]}
                            style={{ width: "100%" }}
                          >
                            <Input.Password
                              prefix={
                                <LockOutlined
                                  style={{ color: "#475569" }}
                                />
                              }
                              style={{ ...styles.formInput, width: "100%" }}
                              placeholder="Enter current password"
                              iconRender={(visible) =>
                                visible ? (
                                  <EyeOutlined
                                    style={{ color: "#475569" }}
                                  />
                                ) : (
                                  <EyeInvisibleOutlined
                                    style={{ color: "#475569" }}
                                  />
                                )
                              }
                            />
                          </Form.Item>

                          <Form.Item
                            name="newPassword"
                            label={
                              <span style={styles.formLabel}>
                                New Password
                              </span>
                            }
                            rules={[
                              {
                                required: true,
                                message: "New password is required",
                              },
                              {
                                min: 6,
                                message:
                                  "Password must be at least 6 characters",
                              },
                            ]}
                            style={{ width: "100%" }}
                          >
                            <Input.Password
                              prefix={
                                <LockOutlined
                                  style={{ color: "#475569" }}
                                />
                              }
                              style={{ ...styles.formInput, width: "100%" }}
                              placeholder="Enter new password"
                              iconRender={(visible) =>
                                visible ? (
                                  <EyeOutlined
                                    style={{ color: "#475569" }}
                                  />
                                ) : (
                                  <EyeInvisibleOutlined
                                    style={{ color: "#475569" }}
                                  />
                                )
                              }
                            />
                          </Form.Item>

                          <Form.Item
                            name="confirmPassword"
                            label={
                              <span style={styles.formLabel}>
                                Confirm New Password
                              </span>
                            }
                            dependencies={["newPassword"]}
                            rules={[
                              {
                                required: true,
                                message: "Please confirm your password",
                              },
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  if (
                                    !value ||
                                    getFieldValue("newPassword") === value
                                  ) {
                                    return Promise.resolve();
                                  }
                                  return Promise.reject(
                                    new Error("Passwords do not match")
                                  );
                                },
                              }),
                            ]}
                            style={{ width: "100%" }}
                          >
                            <Input.Password
                              prefix={
                                <LockOutlined
                                  style={{ color: "#475569" }}
                                />
                              }
                              style={{ ...styles.formInput, width: "100%" }}
                              placeholder="Confirm new password"
                              iconRender={(visible) =>
                                visible ? (
                                  <EyeOutlined
                                    style={{ color: "#475569" }}
                                  />
                                ) : (
                                  <EyeInvisibleOutlined
                                    style={{ color: "#475569" }}
                                  />
                                )
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
                          <h4 style={styles.dangerTitle}>
                            ⚠️ Danger Zone
                          </h4>
                          <p style={styles.dangerDesc}>
                            Signing out will end your current session. Any
                            in-progress tests will be saved automatically.
                          </p>
                          <Button
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            style={styles.dangerBtn}
                          >
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    ),
                  },

                  // ── NOTIFICATIONS TAB
                  {
                    key: "notifications",
                    label: (
                      <span
                        style={{
                          color:
                            activeTab === "notifications"
                              ? "#38bdf8"
                              : "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Notifications
                      </span>
                    ),
                    children: (
                      <div style={styles.tabContent}>
                        <div style={styles.sectionHeader}>
                          <div>
                            <h3 style={styles.sectionTitle}>
                              Notification Preferences
                            </h3>
                            <p style={styles.sectionSubtitle}>
                              Control what notifications you receive
                            </p>
                          </div>
                        </div>

                        <div style={styles.notifList}>
                          {[
                            {
                              key: "testReminders",
                              label: "Test Reminders",
                              desc: "Get reminded before a scheduled test ends",
                              icon: "⏰",
                            },
                            {
                              key: "resultsReady",
                              label: "Results Ready",
                              desc: "Be notified when your test results are available",
                              icon: "📊",
                            },
                            {
                              key: "newTestsAvailable",
                              label: "New Tests Available",
                              desc: "Know when new tests are published for you",
                              icon: "📋",
                            },
                            {
                              key: "weeklyProgress",
                              label: "Weekly Progress",
                              desc: "Receive a weekly summary of your performance",
                              icon: "📈",
                            },
                          ].map((item) => (
                            <div key={item.key} style={styles.notifRow}>
                              <span style={styles.notifIcon}>
                                {item.icon}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={styles.notifLabel}>
                                  {item.label}
                                </div>
                                <div style={styles.notifDesc}>
                                  {item.desc}
                                </div>
                              </div>
                              <Switch
                                checked={notifications[item.key]}
                                onChange={(val) =>
                                  setNotifications((prev) => ({
                                    ...prev,
                                    [item.key]: val,
                                  }))
                                }
                                style={{
                                  background: notifications[item.key]
                                    ? "#38bdf8"
                                    : "#334155",
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        <Button
                          style={styles.saveBtn}
                          icon={<SaveOutlined />}
                          onClick={() =>
                            messageApi.success({
                              content: "Notification preferences saved!",
                              duration: 3,
                              style: {
                                background: "#0d1829",
                                border:
                                  "1px solid rgba(52,211,153,0.3)",
                                borderRadius: 10,
                                color: "#34d399",
                              },
                            })
                          }
                        >
                          Save Preferences
                        </Button>
                      </div>
                    ),
                  },

                  // ── ACTIVITY TAB
                  {
                    key: "activity",
                    label: (
                      <span
                        style={{
                          color:
                            activeTab === "activity"
                              ? "#38bdf8"
                              : "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Activity
                      </span>
                    ),
                    children: (
                      <div style={styles.tabContent}>
                        <div style={styles.sectionHeader}>
                          <div>
                            <h3 style={styles.sectionTitle}>
                              My Activity Summary
                            </h3>
                            <p style={styles.sectionSubtitle}>
                              A quick overview of your performance
                            </p>
                          </div>
                        </div>

                        {/* Activity Stats Grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: isMobile
                              ? "repeat(2,1fr)"
                              : "repeat(3,1fr)",
                            gap: 12,
                            marginBottom: 24,
                          }}
                        >
                          {[
                            {
                              label: "Tests Completed",
                              value: stats.totalAttempts,
                              color: "#38bdf8",
                              icon: "📋",
                            },
                            {
                              label: "Tests Passed",
                              value: stats.passed,
                              color: "#34d399",
                              icon: "✅",
                            },
                            {
                              label: "Tests Failed",
                              value: stats.totalAttempts - stats.passed,
                              color: "#f87171",
                              icon: "❌",
                            },
                            {
                              label: "Pass Rate",
                              value: `${passRate}%`,
                              color: "#a78bfa",
                              icon: "🏆",
                            },
                            {
                              label: "Average Score",
                              value: `${stats.avgScore}%`,
                              color: "#f59e0b",
                              icon: "⭐",
                            },
                            {
                              label: "Status",
                              value: "Active",
                              color: "#34d399",
                              icon: "🟢",
                            },
                          ].map((item, i) => (
                            <div key={i} style={styles.activityCard}>
                              <span style={styles.activityIcon}>
                                {item.icon}
                              </span>
                              <div
                                style={{
                                  ...styles.activityValue,
                                  color: item.color,
                                }}
                              >
                                {item.value}
                              </div>
                              <div style={styles.activityLabel}>
                                {item.label}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Quick Actions */}
                        <div style={styles.sectionTitle2}>
                          Quick Actions
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            marginTop: 12,
                          }}
                        >
                          {[
                            {
                              label: "View All My Results",
                              desc: "See detailed results for all your tests",
                              path: "/student/results",
                              color: "#38bdf8",
                              icon: <BarChartOutlined />,
                            },
                            {
                              label: "My Attempt History",
                              desc: "Browse all your test attempts",
                              path: "/student/attempts",
                              color: "#a78bfa",
                              icon: <FileTextOutlined />,
                            },
                            {
                              label: "Browse Available Tests",
                              desc: "Find new tests to attempt",
                              path: "/student/tests",
                              color: "#34d399",
                              icon: <BookOutlined />,
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              style={styles.activityLink}
                              onClick={() => navigate(item.path)}
                            >
                              <div
                                style={{
                                  ...styles.activityLinkIcon,
                                  color: item.color,
                                  background: `${item.color}15`,
                                }}
                              >
                                {item.icon}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    ...styles.activityLinkLabel,
                                    color: item.color,
                                  }}
                                >
                                  {item.label}
                                </div>
                                <div style={styles.activityLinkDesc}>
                                  {item.desc}
                                </div>
                              </div>
                              <span
                                style={{ color: "#334155", fontSize: 14 }}
                              >
                                ›
                              </span>
                            </div>
                          ))}
                        </div>
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
        * { box-sizing: border-box; }

        .ant-tabs-nav::before { border-color: rgba(255,255,255,0.06) !important; }
        .ant-tabs-ink-bar { background: #38bdf8 !important; }
        .ant-tabs-tab { padding: 10px 0 !important; }
        .ant-tabs-tab + .ant-tabs-tab { margin-left: 24px !important; }

        /* ✅ Force form items and inputs to fill full width */
        .ant-form-item { width: 100% !important; }
        .ant-form-item-control { width: 100% !important; }
        .ant-form-item-control-input { width: 100% !important; }
        .ant-form-item-control-input-content { width: 100% !important; }

        .ant-input-affix-wrapper {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #f1f5f9 !important;
          width: 100% !important;
        }
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: rgba(56,189,248,0.5) !important;
          box-shadow: 0 0 0 2px rgba(56,189,248,0.1) !important;
        }
        .ant-input-affix-wrapper-disabled {
          background: rgba(255,255,255,0.02) !important;
          border-color: rgba(255,255,255,0.04) !important;
        }
        .ant-input {
          background: transparent !important;
          color: #f1f5f9 !important;
          width: 100% !important;
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
    display: "flex",
    minHeight: "100vh",
    background: "#060d18",
    fontFamily: "'DM Sans', sans-serif",
  },

  // ── SIDEBAR
  sidebar: {
    background: "#080f1a",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    zIndex: 100,
    overflowY: "auto",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 20px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    marginBottom: 16,
    fontSize: 22,
  },
  logoText: {
    fontSize: 19,
    fontWeight: 800,
    color: "#f1f5f9",
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "-0.5px",
  },
  sidebarProfile: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "4px 20px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    marginBottom: 12,
    gap: 6,
  },
  sidebarProfileName: {
    color: "#f1f5f9",
    fontWeight: 700,
    fontSize: 14,
    textAlign: "center",
  },
  sidebarProfileEmail: {
    color: "#475569",
    fontSize: 11,
    textAlign: "center",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
    paddingInline: 8,
  },
  sidebarProfileBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "rgba(56,189,248,0.1)",
    color: "#38bdf8",
    border: "1px solid rgba(56,189,248,0.2)",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 600,
  },
  nav: {
    flex: 1,
    padding: "4px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.15s",
    position: "relative",
    userSelect: "none",
  },
  navItemActive: { background: "rgba(56,189,248,0.08)", color: "#38bdf8" },
  navActiveBar: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: 3,
    height: 20,
    background: "#38bdf8",
    borderRadius: 2,
  },
  sidebarFooter: {
    padding: "14px 14px 0",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  logoutBtn: {
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    color: "#f87171",
    borderRadius: 8,
    height: 34,
  },

  // ── HEADER
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 64,
    background: "#080f1a",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    position: "sticky",
    top: 0,
    zIndex: 50,
    gap: 12,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  menuBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
    borderRadius: 8,
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  breadcrumbRoot: { fontSize: 11, color: "#334155" },
  breadcrumbSep: { fontSize: 11, color: "#1e293b" },
  breadcrumbCurrent: { fontSize: 11, color: "#475569", fontWeight: 500 },
  pageTitle: {
    fontWeight: 800,
    color: "#f1f5f9",
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "-0.3px",
  },
  logoutHeaderBtn: {
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    color: "#f87171",
    borderRadius: 10,
  },

  // ── PROFILE CARD
  profileCard: {
    background: "#0d1829",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: "28px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  avatarWrapper: { position: "relative", display: "inline-block" },
  avatarEditBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #38bdf8, #818cf8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "2px solid #0d1829",
  },
  profileName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    textAlign: "center",
  },
  roleTag: {
    background: "rgba(56,189,248,0.1)",
    border: "1px solid rgba(56,189,248,0.2)",
    color: "#38bdf8",
    borderRadius: 20,
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.3px",
  },

  // ── QUICK STATS
  quickStats: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: "14px 8px",
  },
  quickStat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 800,
    fontFamily: "'Syne', sans-serif",
    lineHeight: 1,
  },
  quickStatLabel: { fontSize: 10, color: "#475569", fontWeight: 500 },
  quickStatDivider: {
    width: 1,
    height: 32,
    background: "rgba(255,255,255,0.06)",
  },

  // ── PROFILE INFO
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    padding: "16px 0",
  },
  infoRow: { display: "flex", alignItems: "flex-start", gap: 12 },
  infoLabel: { fontSize: 11, color: "#475569", marginBottom: 2 },
  infoValue: { fontSize: 13, color: "#cbd5e1", fontWeight: 500 },

  // ── QUICK LINKS
  quickLinks: { display: "flex", flexDirection: "column", gap: 8 },
  quickLinkBtn: {
    background: "rgba(56,189,248,0.06)",
    border: "1px solid rgba(56,189,248,0.15)",
    color: "#38bdf8",
    borderRadius: 10,
    fontWeight: 500,
    height: 36,
    fontSize: 13,
  },

  // ── TABS
  tabContent: {
    background: "#0d1829",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: "24px",
    width: "100%",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: "0 0 4px",
    fontFamily: "'Syne', sans-serif",
  },
  sectionTitle2: {
    fontSize: 14,
    fontWeight: 700,
    color: "#f1f5f9",
    fontFamily: "'Syne', sans-serif",
  },
  sectionSubtitle: { fontSize: 13, color: "#475569", margin: 0 },
  smallEditBtn: {
    background: "rgba(56,189,248,0.1)",
    border: "1px solid rgba(56,189,248,0.25)",
    color: "#38bdf8",
    borderRadius: 8,
    fontWeight: 600,
  },
  formLabel: { fontSize: 13, color: "#94a3b8", fontWeight: 500 },
  formInput: {
    borderRadius: 10,
    height: 44,
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f1f5f9",
    fontSize: 14,
    width: "100%",
  },
  saveBtn: {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    border: "none",
    color: "#fff",
    borderRadius: 10,
    fontWeight: 700,
    height: 42,
    paddingLeft: 20,
    paddingRight: 20,
    boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
  },
  cancelBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
    borderRadius: 10,
    height: 42,
    paddingLeft: 20,
    paddingRight: 20,
  },

  // ── PASSWORD TIPS
  passwordTips: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "rgba(52,211,153,0.05)",
    border: "1px solid rgba(52,211,153,0.12)",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 20,
  },
  passwordTip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#64748b",
  },

  // ── DANGER ZONE
  dangerZone: {
    marginTop: 28,
    padding: "20px",
    background: "rgba(248,113,113,0.05)",
    border: "1px solid rgba(248,113,113,0.15)",
    borderRadius: 14,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#f87171",
    margin: "0 0 8px",
  },
  dangerDesc: { fontSize: 13, color: "#64748b", margin: "0 0 16px" },
  dangerBtn: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#f87171",
    borderRadius: 10,
    fontWeight: 600,
    height: 38,
  },

  // ── NOTIFICATIONS
  notifList: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    overflow: "hidden",
  },
  notifRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  notifIcon: { fontSize: 20, flexShrink: 0 },
  notifLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#f1f5f9",
    marginBottom: 2,
  },
  notifDesc: { fontSize: 12, color: "#475569" },

  // ── ACTIVITY
  activityCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  activityIcon: { fontSize: 22 },
  activityValue: {
    fontSize: 22,
    fontWeight: 800,
    fontFamily: "'Syne', sans-serif",
    lineHeight: 1,
  },
  activityLabel: { fontSize: 11, color: "#475569", textAlign: "center" },
  activityLink: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  activityLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0,
  },
  activityLinkLabel: { fontSize: 13, fontWeight: 600, marginBottom: 2 },
  activityLinkDesc: { fontSize: 11, color: "#475569" },

  main: { flex: 1, minHeight: "100vh", background: "#060d18" },
};
