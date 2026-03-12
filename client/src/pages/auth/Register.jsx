import { useState, useEffect } from "react";
import { Form, Input, Button, Alert, Select } from "antd";
import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";

export const Register = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    setError("");
    try {
      await axiosInstance.post("/users/register", {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* ── LEFT PANEL — hidden on mobile ── */}
      {!isMobile && (
        <div style={styles.left}>
          <div style={styles.brand}>
            <div style={styles.logo}>📝</div>
            <h1 style={styles.brandName}>ExamFlow</h1>
            <p style={styles.brandTagline}>
              Join thousands of educators and students using ExamFlow to streamline assessments.
            </p>
            <div style={styles.roles}>
              {[
                { icon: "👩‍🏫", role: "Teacher", desc: "Create tests and track student progress" },
                { icon: "👨‍🎓", role: "Student", desc: "Take tests and view your results" },
              ].map((r) => (
                <div key={r.role} style={styles.roleCard}>
                  <span style={styles.roleIcon}>{r.icon}</span>
                  <div>
                    <div style={styles.roleName}>{r.role}</div>
                    <div style={styles.roleDesc}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.adminNote}>
              🛡️ Admin accounts are created by system administrators only.
            </div>
          </div>
        </div>
      )}

      {/* ── RIGHT PANEL ── */}
      <div style={isMobile ? styles.rightMobile : styles.right}>
        <div style={isMobile ? styles.cardMobile : styles.card}>

          {/* Mobile-only compact brand header */}
          {isMobile && (
            <div style={styles.mobileHeader}>
              <span style={styles.mobileLogo}>📝</span>
              <span style={styles.mobileBrandName}>ExamFlow</span>
            </div>
          )}

          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Create an account</h2>
            <p style={styles.cardSubtitle}>Fill in your details to get started</p>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 20, borderRadius: 8 }}
            />
          )}

          {success && (
            <Alert
              message="Account created! Redirecting to login..."
              type="success"
              showIcon
              style={{ marginBottom: 20, borderRadius: 8 }}
            />
          )}

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              name="name"
              label={<span style={styles.label}>Full name</span>}
              rules={[{ required: true, message: "Full name is required" }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#6366f1" }} />}
                placeholder="Jane Doe"
                style={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span style={styles.label}>Email address</span>}
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#6366f1" }} />}
                placeholder="you@example.com"
                style={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={styles.label}>Password</span>}
              rules={[
                { required: true, message: "Password is required" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#6366f1" }} />}
                placeholder="••••••••"
                style={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span style={styles.label}>Confirm password</span>}
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#6366f1" }} />}
                placeholder="••••••••"
                style={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="role"
              label={<span style={styles.label}>I am a...</span>}
              rules={[{ required: true, message: "Please select a role" }]}
            >
              <Select placeholder="Select your role" style={{ height: 46 }}>
                <Select.Option value="student">👨‍🎓 Student</Select.Option>
                <Select.Option value="teacher">👩‍🏫 Teacher</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={success}
                block
                style={styles.submitBtn}
              >
                Create account
              </Button>
            </Form.Item>
          </Form>

          <p style={styles.switchText}>
            Already have an account?{" "}
            <a href="/login" style={styles.link}>
              Sign in
            </a>
          </p>

          {/* Mobile-only admin note */}
          {isMobile && (
            <p style={styles.mobileAdminNote}>
              🛡️ Admin accounts are created by system administrators only.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
  },

  // ── Left panel (desktop only)
  left: {
    flex: 1,
    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px",
  },
  brand: { maxWidth: 400, color: "#fff" },
  logo: { fontSize: 48, marginBottom: 16 },
  brandName: {
    fontSize: 42,
    fontWeight: 800,
    color: "#fff",
    margin: "0 0 12px",
    letterSpacing: "-1px",
  },
  brandTagline: {
    fontSize: 17,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.6,
    marginBottom: 40,
  },
  roles: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 },
  roleCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "14px 18px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  roleIcon: { fontSize: 24 },
  roleName: { color: "#fff", fontWeight: 600, fontSize: 15 },
  roleDesc: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 },
  adminNote: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },

  // ── Right panel — desktop
  right: {
    width: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    background: "#f8fafc",
    overflowY: "auto",
  },

  // ── Right panel — mobile (full width, gradient bg)
  rightMobile: {
    flex: 1,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "24px 16px 40px",
    background: "linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)",
    minHeight: "100vh",
    overflowY: "auto",
  },

  // ── Card — desktop
  card: {
    width: "100%",
    background: "#fff",
    borderRadius: 20,
    padding: "40px",
    boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
  },

  // ── Card — mobile
  cardMobile: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 20,
    padding: "28px 22px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    marginTop: 16,
  },

  // ── Mobile brand header
  mobileHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottom: "1px solid #f1f5f9",
  },
  mobileLogo: { fontSize: 26 },
  mobileBrandName: {
    fontSize: 22,
    fontWeight: 800,
    color: "#1e1b4b",
    letterSpacing: "-0.5px",
  },
  mobileAdminNote: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 0,
  },

  // ── Shared card content
  cardHeader: { marginBottom: 24 },
  cardTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
  },
  cardSubtitle: { fontSize: 15, color: "#64748b", margin: 0 },
  label: { fontSize: 14, fontWeight: 500, color: "#374151" },
  input: { borderRadius: 10, height: 46 },
  submitBtn: {
    height: 48,
    borderRadius: 10,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    border: "none",
    fontSize: 16,
    fontWeight: 600,
    boxShadow: "0 4px 15px rgba(79,70,229,0.4)",
  },
  switchText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 20,
    fontSize: 14,
  },
  link: { color: "#4f46e5", fontWeight: 600, textDecoration: "none" },
};