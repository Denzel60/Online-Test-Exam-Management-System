import { useState, useEffect } from "react";
import {
  Table, Tag, Button, Avatar, Drawer, Modal,
  message, Popconfirm, Badge, Select
} from "antd";
import {
  LogoutOutlined, SettingOutlined, RiseOutlined,
  TeamOutlined, BookOutlined, FlagOutlined,
  SearchOutlined, DeleteOutlined, EyeOutlined,
  CheckOutlined, ExclamationCircleOutlined, MenuOutlined,
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

export const Flagged = () => {
  const [attempts, setAttempts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => { fetchFlaggedAttempts(); }, []);

  useEffect(() => {
    let result = [...attempts];
    if (search) {
      result = result.filter(
        (a) =>
          a.studentName?.toLowerCase().includes(search.toLowerCase()) ||
          a.testTitle?.toLowerCase().includes(search.toLowerCase()) ||
          a.flagReason?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, attempts]);

  const fetchFlaggedAttempts = async () => {
    setLoading(true);
    try {
      // Fetch all tests first then get flagged attempts per test
      const testsRes = await axiosInstance.get("/tests");
      const tests = testsRes.data.tests || [];

      const allFlagged = [];
      await Promise.all(
        tests.map(async (test) => {
          try {
            const res = await axiosInstance.get(`/oversight/tests/${test.id}/attempts`);
            const flagged = (res.data.attempts || [])
              .filter((a) => a.isFlagged)
              .map((a) => ({ ...a, testTitle: test.title }));
            allFlagged.push(...flagged);
          } catch { /* skip tests with no attempts */ }
        })
      );

      setAttempts(allFlagged);
      setFiltered(allFlagged);
    } catch {
      message.error("Failed to fetch flagged attempts");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (attempt) => {
    setSelectedAttempt(attempt);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const { data } = await axiosInstance.get(`/oversight/attempts/${attempt.attemptId}`);
      setAttemptDetail(data);
    } catch {
      message.error("Failed to load attempt details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUnflag = async (attemptId) => {
    try {
      // Patch the attempt to remove the flag
      await axiosInstance.patch(`/oversight/attempts/${attemptId}/unflag`, {
        flagReason: "",
        isFlagged: false,
      });
      message.success("Attempt unflagged successfully");
      fetchFlaggedAttempts();
    } catch {
      message.error("Failed to unflag attempt");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const statusCounts = {
    all: attempts.length,
    submitted: attempts.filter((a) => a.status === "submitted").length,
    in_progress: attempts.filter((a) => a.status === "in_progress").length,
  };

  const columns = [
    {
      title: "Student",
      dataIndex: "studentName",
      render: (name, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            style={{ background: "#f87171", color: "#0f172a", fontWeight: 700, flexShrink: 0 }}
            size={isMobile ? 28 : 34}
          >
            {name?.[0]?.toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </div>
            {!isMobile && (
              <div style={{ color: "#64748b", fontSize: 11 }}>{record.studentEmail}</div>
            )}
          </div>
        </div>
      ),
    },
    ...(!isMobile ? [{
      title: "Test",
      dataIndex: "testTitle",
      render: (title) => (
        <span style={{ color: "#94a3b8", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: 160 }}>
          {title}
        </span>
      ),
    }] : []),
    {
      title: "Flag Reason",
      dataIndex: "flagReason",
      render: (reason) => (
        <div style={{
          background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: 8, padding: "4px 10px",
          color: "#fca5a5", fontSize: 12,
          maxWidth: isMobile ? 120 : 220,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          🚩 {reason || "No reason provided"}
        </div>
      ),
    },
    {
      title: "Score",
      dataIndex: "score",
      width: 80,
      render: (score, record) => (
        <div style={{ textAlign: "center" }}>
          <span style={{ color: record.isPassed ? "#34d399" : "#f87171", fontWeight: 700, fontSize: 14 }}>
            {score ?? "—"}
          </span>
          {record.totalPoints && (
            <span style={{ color: "#475569", fontSize: 11 }}>/{record.totalPoints}</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (status, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Tag style={{
            background: status === "submitted" ? "rgba(52,211,153,0.15)" : "rgba(245,158,11,0.15)",
            color: status === "submitted" ? "#34d399" : "#f59e0b",
            border: "none", borderRadius: 6, fontWeight: 600,
            fontSize: 10, textTransform: "uppercase",
          }}>
            {status === "submitted" ? "Submitted" : "In Progress"}
          </Tag>
          {record.isPassed !== null && record.isPassed !== undefined && (
            <Tag style={{
              background: record.isPassed ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
              color: record.isPassed ? "#34d399" : "#f87171",
              border: "none", borderRadius: 6, fontWeight: 600,
              fontSize: 10, textTransform: "uppercase",
            }}>
              {record.isPassed ? "Passed" : "Failed"}
            </Tag>
          )}
        </div>
      ),
    },
    ...(!isMobile ? [{
      title: "Submitted",
      dataIndex: "submittedAt",
      width: 120,
      render: (date) => (
        <span style={{ color: "#64748b", fontSize: 12 }}>
          {date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
        </span>
      ),
    }] : []),
    {
      title: "Actions",
      width: isMobile ? 80 : 110,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", borderRadius: 6 }}
          />
          <Popconfirm
            title="Unflag this attempt?"
            description="This will remove the flag from this attempt."
            onConfirm={() => handleUnflag(record.attemptId)}
            okText="Unflag"
            cancelText="Cancel"
            icon={<CheckOutlined style={{ color: "#34d399" }} />}
          >
            <Button
              size="small"
              icon={<CheckOutlined />}
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", borderRadius: 6 }}
            />
          </Popconfirm>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar style={{ background: "#f59e0b", color: "#0f172a", fontWeight: 700, flexShrink: 0 }} size={34}>
            {user?.name?.[0]?.toUpperCase() || "A"}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.adminName}>{user?.name || "Admin"}</div>
            <div style={{ color: "#475569", fontSize: 11 }}>Administrator</div>
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
          title="Flagged Attempts"
          subtitle="Review suspicious activity"
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px 40px" }}>

          {/* ── ALERT BANNER */}
          {attempts.length > 0 && (
            <div style={styles.alertBanner}>
              <div style={styles.alertIcon}>🚩</div>
              <div>
                <div style={styles.alertTitle}>
                  {attempts.length} flagged {attempts.length === 1 ? "attempt" : "attempts"} need your attention
                </div>
                <div style={styles.alertSub}>
                  Review each attempt carefully before taking action
                </div>
              </div>
            </div>
          )}

          {/* ── STAT PILLS */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { label: "All Flagged", key: "all", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
              { label: "Submitted", key: "submitted", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
              { label: "In Progress", key: "in_progress", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
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
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexDirection: isMobile ? "column" : "row" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "8px 14px",
            }}>
              <SearchOutlined style={{ color: "#475569", fontSize: 14, flexShrink: 0 }} />
              <input
                placeholder="Search by student, test or flag reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: 13, width: "100%" }}
              />
              {search && (
                <span onClick={() => setSearch("")} style={{ color: "#475569", cursor: "pointer", fontSize: 12 }}>✕</span>
              )}
            </div>
          </div>

          {/* ── TABLE */}
          <div style={{ background: "#0d1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexWrap: "wrap", gap: 10,
            }}>
              <div>
                <h3 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, margin: 0, fontFamily: "'Syne', sans-serif" }}>
                  Flagged Attempts
                </h3>
                <p style={{ color: "#475569", fontSize: 12, margin: "2px 0 0" }}>
                  {filtered.length} {filtered.length === 1 ? "attempt" : "attempts"} found
                </p>
              </div>
            </div>

            <Table
              dataSource={filtered}
              columns={columns}
              loading={loading}
              rowKey="attemptId"
              size={isMobile ? "small" : "middle"}
              className="dark-table"
              scroll={{ x: isMobile ? 500 : undefined }}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
                columnWidth: 40,
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: !isMobile,
                showTotal: (total) => (
                  <span style={{ color: "#64748b", fontSize: 12 }}>{total} total flagged</span>
                ),
              }}
              locale={{
                emptyText: (
                  <div style={{ padding: "40px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                    <div style={{ color: "#34d399", fontWeight: 600, fontSize: 15 }}>
                      No flagged attempts
                    </div>
                    <div style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>
                      All attempts are clean
                    </div>
                  </div>
                ),
              }}
            />
          </div>
        </div>
      </main>

      {/* ── DETAIL MODAL */}
      <Modal
        open={detailModalOpen}
        onCancel={() => { setDetailModalOpen(false); setAttemptDetail(null); }}
        footer={null}
        title={null}
        width={isMobile ? "95vw" : 620}
        styles={{
          content: { background: "#0d1829", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 0 },
          mask: { backdropFilter: "blur(4px)" },
        }}
      >
        <div style={{ padding: "28px" }}>
          {/* Modal Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <Avatar
              style={{ background: "#f87171", color: "#0f172a", fontWeight: 700 }}
              size={46}
            >
              {selectedAttempt?.studentName?.[0]?.toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16, margin: 0 }}>
                {selectedAttempt?.studentName}
              </h3>
              <p style={{ color: "#64748b", fontSize: 13, margin: "2px 0 0" }}>
                {selectedAttempt?.testTitle}
              </p>
            </div>
            <Tag style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "none", borderRadius: 8, fontWeight: 600 }}>
              🚩 Flagged
            </Tag>
          </div>

          {/* Flag Reason */}
          <div style={styles.detailSection}>
            <div style={styles.detailSectionTitle}>Flag Reason</div>
            <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "12px 16px", color: "#fca5a5", fontSize: 13 }}>
              {selectedAttempt?.flagReason || "No reason provided"}
            </div>
          </div>

          {/* Score Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Score", value: selectedAttempt?.score !== null ? `${selectedAttempt?.score}/${selectedAttempt?.totalPoints}` : "—", color: "#f1f5f9" },
              { label: "Result", value: selectedAttempt?.isPassed ? "Passed" : "Failed", color: selectedAttempt?.isPassed ? "#34d399" : "#f87171" },
              { label: "Submitted", value: selectedAttempt?.submittedAt ? new Date(selectedAttempt.submittedAt).toLocaleDateString() : "—", color: "#94a3b8" },
            ].map((item) => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{item.label}</div>
                <div style={{ color: item.color, fontWeight: 700, fontSize: 15 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Answer Breakdown */}
          {detailLoading ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#475569" }}>Loading details...</div>
          ) : attemptDetail?.breakdown?.length > 0 ? (
            <div style={styles.detailSection}>
              <div style={styles.detailSectionTitle}>Answer Breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                {attemptDetail.breakdown.map((item, i) => (
                  <div key={i} style={{
                    background: item.isCorrect ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.05)",
                    border: `1px solid ${item.isCorrect ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}`,
                    borderRadius: 10, padding: "12px 14px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ color: "#94a3b8", fontSize: 12, flex: 1 }}>
                        Q{i + 1}: {item.questionText}
                      </div>
                      <Tag style={{
                        background: item.isCorrect ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                        color: item.isCorrect ? "#34d399" : "#f87171",
                        border: "none", borderRadius: 6, fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>
                        {item.pointsAwarded}/{item.points}pts
                      </Tag>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 11 }}>
                        <span style={{ color: "#475569" }}>Answer: </span>
                        <span style={{ color: item.isCorrect ? "#34d399" : "#f87171", fontWeight: 600 }}>
                          {item.yourAnswer || "—"}
                        </span>
                      </div>
                      {!item.isCorrect && (
                        <div style={{ fontSize: 11 }}>
                          <span style={{ color: "#475569" }}>Correct: </span>
                          <span style={{ color: "#34d399", fontWeight: 600 }}>{item.correctAnswer || "—"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Button
              onClick={() => { setDetailModalOpen(false); setAttemptDetail(null); }}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8 }}
            >
              Close
            </Button>
            <Popconfirm
              title="Unflag this attempt?"
              onConfirm={() => { handleUnflag(selectedAttempt?.attemptId); setDetailModalOpen(false); }}
              okText="Unflag"
              cancelText="Cancel"
            >
              <Button style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", borderRadius: 8, fontWeight: 600 }}>
                ✅ Unflag Attempt
              </Button>
            </Popconfirm>
          </div>
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
        .dark-table .ant-table-tbody > tr:hover > td { background: rgba(248,113,113,0.04) !important; }
        .dark-table .ant-spin-dot-item { background: #f87171 !important; }
        .dark-table .ant-pagination-item a { color: #64748b; }
        .dark-table .ant-pagination-item-active a { color: #f87171; }
        .dark-table .ant-pagination-item-active { border-color: #f87171 !important; background: rgba(248,113,113,0.1) !important; }
        .dark-table .ant-checkbox-inner { background: transparent; border-color: #334155; }
        .dark-table .ant-checkbox-checked .ant-checkbox-inner { background: #f87171; border-color: #f87171; }
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
  sidebarLogo: { display: "flex", alignItems: "center", gap: 10, padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 12, fontSize: 22 },
  logoText: { fontSize: 19, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" },
  nav: { flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 },
  navItem: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 500, transition: "all 0.15s", position: "relative", userSelect: "none" },
  navItemActive: { background: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  navActiveBar: { position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: "#f59e0b", borderRadius: 2 },
  sidebarFooter: { padding: "14px 14px 0", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 10 },
  adminName: { color: "#f1f5f9", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logoutBtn: { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 8, height: 34 },
  main: { flex: 1, minHeight: "100vh", background: "#080f1a" },
  alertBanner: {
    display: "flex", alignItems: "center", gap: 14,
    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 14, padding: "16px 20px", marginBottom: 20,
  },
  alertIcon: { fontSize: 28, flexShrink: 0 },
  alertTitle: { color: "#fca5a5", fontWeight: 700, fontSize: 14 },
  alertSub: { color: "#64748b", fontSize: 12, marginTop: 2 },
  detailSection: { marginBottom: 20 },
  detailSectionTitle: { color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, marginBottom: 10 },
};