import { Refine } from "@refinedev/core";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemedLayoutV2, RefineThemes, notificationProvider } from "@refinedev/antd";
import { ConfigProvider, App as AntApp } from "antd";
import dataProvider from "@refinedev/simple-rest";
import routerProvider from "@refinedev/react-router-v6";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./providers/authProvider";

// Auth
import { Login } from "./pages/auth/Login.jsx";
import { Register } from "./pages/auth/Register.jsx";

const API_URL = "http://localhost:3000/api";

// ✅ Protects routes based on role stored in localStorage
const ProtectedRoute = ({ allowedRole }: { allowedRole: string }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" />;
  if (user.role !== allowedRole) return <Navigate to="/login" />;

  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntApp>
          <Refine
            dataProvider={dataProvider(API_URL)}
            routerProvider={routerProvider}
            authProvider={authProvider}
            notificationProvider={notificationProvider}
            resources={[]}
          >
            <Routes>
              {/* ─────────────────────────────────────────────
                  🌐 PUBLIC ROUTES
              ───────────────────────────────────────────── */}
              <Route index element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ─────────────────────────────────────────────
                  🛡️ ADMIN ROUTES
              ───────────────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRole="admin" />}>
                <Route
                  element={
                    <ThemedLayoutV2>
                      <Outlet />
                    </ThemedLayoutV2>
                  }
                >
                  <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
                  <Route path="/admin/users" element={<div>Users Page</div>} />
                  <Route path="/admin/tests" element={<div>All Tests Page</div>} />
                </Route>
              </Route>

              {/* ─────────────────────────────────────────────
                  👩‍🏫 TEACHER ROUTES
              ───────────────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRole="teacher" />}>
                <Route
                  element={
                    <ThemedLayoutV2>
                      <Outlet />
                    </ThemedLayoutV2>
                  }
                >
                  <Route path="/teacher/dashboard" element={<div>Teacher Dashboard</div>} />
                  <Route path="/teacher/tests" element={<div>My Tests Page</div>} />
                  <Route path="/teacher/tests/create" element={<div>Create Test Page</div>} />
                  <Route path="/teacher/results" element={<div>Results Page</div>} />
                </Route>
              </Route>

              {/* ─────────────────────────────────────────────
                  👨‍🎓 STUDENT ROUTES
              ───────────────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRole="student" />}>
                <Route
                  element={
                    <ThemedLayoutV2>
                      <Outlet />
                    </ThemedLayoutV2>
                  }
                >
                  <Route path="/student/dashboard" element={<div>Student Dashboard</div>} />
                  <Route path="/student/tests" element={<div>Available Tests</div>} />
                  <Route path="/student/tests/:testId" element={<div>Take Test</div>} />
                  <Route path="/student/results" element={<div>My Results</div>} />
                </Route>
              </Route>

              {/* ─────────────────────────────────────────────
                  404
              ───────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Refine>
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}