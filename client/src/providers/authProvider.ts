import axios from "axios";

const API_URL = "http://localhost:3000/api";

export const authProvider = {
  login: async ({ email, password }: { email: string; password: string }) => {
    try {
      const { data } = await axios.post(`${API_URL}/users/login`, {
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      const role = data.user.role;
      return {
        success: true,
        redirectTo:
          role === "admin"
            ? "/admin/dashboard"
            : role === "teacher"
            ? "/teacher/dashboard"
            : "/student/dashboard",
      };
    } catch {
      return {
        success: false,
        error: {
          name: "Login Failed",
          message: "Invalid email or password",
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = localStorage.getItem("token");
    return token
      ? { authenticated: true }
      : { authenticated: false, redirectTo: "/login" };
  },

  getPermissions: async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.role ?? null;
  },

  getIdentity: async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user ?? null;
  },

  onError: async (error: any) => {
    if (error?.response?.status === 401) {
      return { logout: true };
    }
    return { error };
  },
};