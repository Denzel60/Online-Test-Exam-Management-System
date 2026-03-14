import { useState, useEffect } from "react";
import { Form, Input, Button, Alert } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { axiosInstance } from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // const onFinish = async (values) => {
  //   setLoading(true);
  //   setError("");
  //   try {
  //     const { data } = await axiosInstance.post("/users/login", {
  //       email: values.email,
  //       password: values.password,
  //     });

  //     console.log("✅ Login response:", data);           // check what backend returns
  //     console.log("✅ Token:", data.token);              // check token exists
  //     console.log("✅ User:", data.user);                // check user exists
  //     console.log("✅ Role:", data.user?.role);          // check role exists

  //     console.log("✅ Stored in localStorage");

  //     localStorage.setItem("token", data.token);
  //     localStorage.setItem("user", JSON.stringify(data.user));

  //     const role = data.user.role;
  //     console.log("✅ Redirecting to:", `/${role}/dashboard`);

  //     if (role === "admin") navigate("/admin/dashboard");
  //     else if (role === "teacher") navigate("/teacher/dashboard");
  //     else navigate("/student/dashboard");
  //   } catch (err) {
  //     setError(err.response?.data?.message || "Invalid email or password");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const onFinish = async (values) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.post("/users/login", {
        email: values.email,
        password: values.password,
      });

      // ✅ Your backend returns accessToken not token
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("✅ Login response:", data);           // check what backend returns
      console.log("✅ Token:", data.accessToken);              // check token exists
      console.log("✅ User:", data.user);                // check user exists
      console.log("✅ Role:", data.user?.role);          // check role exists

      console.log("✅ Stored in localStorage");

      const role = data.user.role;
      console.log("✅ Redirecting to:", `/${role}/dashboard`);
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "teacher") navigate("/teacher/dashboard");
      else navigate("/student/dashboard");

    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
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
              The modern platform for creating, managing, and taking exams online.
            </p>
            <div style={styles.features}>
              {[
                "Timed assessments",
                "Auto-grading",
                "Real-time results",
                "Multi-role access",
              ].map((f) => (
                <div key={f} style={styles.featureItem}>
                  <span style={styles.featureDot} />
                  {f}
                </div>
              ))}
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
            <h2 style={styles.cardTitle}>Welcome back</h2>
            <p style={styles.cardSubtitle}>Sign in to your account to continue</p>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 24, borderRadius: 8 }}
            />
          )}

          <Form layout="vertical" onFinish={onFinish} size="large">
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
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#6366f1" }} />}
                placeholder="••••••••"
                style={styles.input}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={styles.submitBtn}
              >
                Sign in
              </Button>
            </Form.Item>
          </Form>

          <p style={styles.switchText}>
            Don't have an account?{" "}
            <a href="/register" style={styles.link}>
              Create one
            </a>
          </p>
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
  features: { display: "flex", flexDirection: "column", gap: 14 },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#a5b4fc",
    flexShrink: 0,
  },

  // ── Right panel — desktop
  right: {
    width: 480,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    background: "#f8fafc",
  },

  // ── Right panel — mobile (full width)
  rightMobile: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    background: "linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)",
    minHeight: "100vh",
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
    padding: "32px 24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },

  // ── Mobile brand header
  mobileHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 28,
    paddingBottom: 24,
    borderBottom: "1px solid #f1f5f9",
  },
  mobileLogo: { fontSize: 28 },
  mobileBrandName: {
    fontSize: 24,
    fontWeight: 800,
    color: "#1e1b4b",
    letterSpacing: "-0.5px",
  },

  // ── Shared card content
  cardHeader: { marginBottom: 28 },
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
    marginTop: 24,
    fontSize: 14,
  },
  link: { color: "#4f46e5", fontWeight: 600, textDecoration: "none" },
};