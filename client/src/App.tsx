import { Refine } from "@refinedev/core";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
// import { ThemedLayoutV2, RefineThemes, notificationProvider } from "@refinedev/antd";
import { RefineThemes, notificationProvider } from "@refinedev/antd";
import { ConfigProvider, App as AntApp } from "antd";
import dataProvider from "@refinedev/simple-rest";
import routerProvider from "@refinedev/react-router-v6";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./providers/authProvider";

// Auth
import { Login } from "./pages/auth/Login.jsx";
import { Register } from "./pages/auth/Register.jsx";

// Admin
import { AdminHeader } from "./components/AdminHeader.jsx";
import { AdminDashboard } from "./pages/admin/Dashboard.jsx";
import { UserList } from "./pages/admin/UserList.jsx";
import { AllTests } from "./pages/admin/AllTests.jsx";
import { Flagged } from "./pages/admin/Flagged.jsx";
import { Settings } from "./pages/admin/Settings.jsx";

// Student
import { StudentDashboard } from "./pages/student/Dashboard.jsx";
import { AvailableTests } from "./pages/student/AvailableTests.jsx";
import { TakeTest } from "./pages/student/TakeTest.jsx";
import { MyAttempts } from "./pages/student/MyAttempts.jsx";
import { MyResults } from "./pages/student/MyResults.jsx";
import { AttemptResult } from "./pages/student/AttemptResult.jsx";
import { StudentSettings } from "./pages/student/StudentSettings.jsx";

// Teacher
import { TeacherDashboard } from "./pages/teacher/Dashboard.jsx";
import { MyTests } from "./pages/teacher/MyTests.jsx";
import { CreateTest } from "./pages/teacher/CreateTest.jsx";
import { TeacherResults } from "./pages/teacher/Results.jsx";
import { TeacherFlagged } from "./pages/teacher/Flagged.jsx";
import { TeacherSettings } from "./pages/teacher/Settings.jsx";
import { EditTest } from "./pages/teacher/EditTest.jsx";
import { Leaderboard } from "./pages/teacher/Leaderboard.jsx";
import { AttemptDetail } from "./pages/teacher/AttemptDetail.jsx";


const API_URL = "http://localhost:3000/api";

// ✅ Protects routes based on role stored in localStorage
const ProtectedRoute = ({ allowedRole }: { allowedRole: string }) => {
  const token = localStorage.getItem("accessToken"); // 👈 changed from "token"
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" />;
  if (user.role !== allowedRole) return <Navigate to="/login" />;

  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
                <Route>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<UserList />} />
                  <Route path="/admin/tests" element={<AllTests />} />
                  <Route path="/admin/flagged" element={<Flagged />} />
                  <Route path="/admin/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* ─────────────────────────────────────────────
                  👩‍🏫 TEACHER ROUTES
              ───────────────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRole="teacher" />}>
                <Route>
                  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                  <Route path="/teacher/tests" element={<MyTests />} />
                  <Route path="/teacher/tests/create" element={<CreateTest />} />
                  <Route path="/teacher/results" element={<TeacherResults />} />
                  <Route path="/teacher/flagged" element={<TeacherFlagged />} />
                  <Route path="/teacher/settings" element={<TeacherSettings />} />
                  <Route path="/teacher/tests/:testId/edit" element={<EditTest />} />
                  <Route path="/teacher/leaderboard" element={<Leaderboard />} />
                  <Route path="/oversight/attempts/:attemptId" element={<AttemptDetail />} />
                </Route>
              </Route>

              {/* ─────────────────────────────────────────────
                  👨‍🎓 STUDENT ROUTES
              ───────────────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRole="student" />}>
                <Route>
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/student/tests" element={<AvailableTests />} />
                  <Route path="/student/tests/:testId" element={<TakeTest />} />
                  <Route path="/student/attempts" element={<MyAttempts />} />
                  <Route path="/student/results" element={<MyResults />} />
                  <Route path="/student/results/:attemptId" element={<AttemptResult />} />
                  <Route path="/student/settings" element={<StudentSettings />} />

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