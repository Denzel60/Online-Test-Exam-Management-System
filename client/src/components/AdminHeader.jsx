import { useState } from "react";
import { Button, Avatar, Badge } from "antd";
import {
  BellOutlined,
  SettingOutlined,
  SearchOutlined,
  MenuOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export const AdminHeader = ({ title, subtitle, onMobileMenuOpen }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [notifications] = useState(3);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        {/* Mobile menu trigger */}
        <Button
          icon={<MenuOutlined />}
          onClick={onMobileMenuOpen}
          style={styles.mobileMenuBtn}
        />

        {/* Breadcrumb + Title */}
        <div>
          <div style={styles.breadcrumb}>
            <span style={styles.breadcrumbRoot}>ExamFlow</span>
            <span style={styles.breadcrumbSep}>/</span>
            <span style={styles.breadcrumbCurrent}>{title}</span>
          </div>
          <h1 style={styles.pageTitle}>{title}</h1>
          {subtitle && <p style={styles.pageSubtitle}>{subtitle}</p>}
        </div>
      </div>

      <div style={styles.headerRight}>
        {/* Search */}
        <div style={styles.searchBar} className="header-search">
          <SearchOutlined style={{ color: "#475569", fontSize: 14 }} />
          <input
            placeholder="Search users, tests..."
            style={styles.searchInput}
          />
        </div>

        {/* Notifications */}
        <Badge count={notifications} size="small" color="#f59e0b">
          <Button
            icon={<BellOutlined />}
            style={styles.iconBtn}
            shape="circle"
          />
        </Badge>

        {/* Settings shortcut */}
        <Button
          icon={<SettingOutlined />}
          style={styles.iconBtn}
          shape="circle"
          onClick={() => navigate("/admin/settings")}
        />

        {/* Avatar */}
        <div
          style={styles.headerAvatar}
          onClick={() => navigate("/admin/settings")}
        >
          <Avatar
            style={{ background: "#f59e0b", color: "#0f172a", fontWeight: 700 }}
            size={34}
          >
            {user?.name?.[0]?.toUpperCase() || "A"}
          </Avatar>
          <div style={styles.headerAvatarInfo} className="header-avatar-info">
            <span style={styles.headerAvatarName}>
              {user?.name || "Admin"}
            </span>
            <span style={styles.headerAvatarRole}>Administrator</span>
          </div>
        </div>

        {/* Logout */}
        <Button
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={styles.logoutBtn}
        >
          <span className="logout-text">Sign Out</span>
        </Button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .header-search { display: none !important; }
          .header-avatar-info { display: none !important; }
          .logout-text { display: none !important; }
        }
      `}</style>
    </header>
  );
};

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    height: 68,
    background: "#0d1829",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 50,
    gap: 16,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  mobileMenuBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
    display: "none",
    borderRadius: 8,
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  breadcrumbRoot: { fontSize: 11, color: "#475569" },
  breadcrumbSep: { fontSize: 11, color: "#334155" },
  breadcrumbCurrent: { fontSize: 11, color: "#64748b", fontWeight: 500 },
  pageTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#f1f5f9",
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "-0.3px",
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#475569",
    margin: "2px 0 0",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "8px 14px",
    width: 220,
  },
  searchInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#94a3b8",
    fontSize: 13,
    width: "100%",
  },
  iconBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "#64748b",
    width: 36,
    height: 36,
  },
  headerAvatar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  headerAvatarInfo: {
    display: "flex",
    flexDirection: "column",
  },
  headerAvatarName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#f1f5f9",
    lineHeight: 1.3,
  },
  headerAvatarRole: { fontSize: 11, color: "#475569" },
  logoutBtn: {
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    color: "#f87171",
    borderRadius: 8,
    height: 36,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
};