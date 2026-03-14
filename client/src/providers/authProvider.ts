import axios from "axios";

const API_URL = "http://localhost:3000/api";

export const authProvider = {
  login: async ({ email, password }: { email: string; password: string }) => {
    try {
      const { data } = await axios.post(`${API_URL}/users/login`, {
        email,
        password,
      });

      // ✅ Updated to match your backend response keys
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

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
    // ✅ Clear all tokens on logout
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = localStorage.getItem("accessToken"); // ✅ updated key

    if (!token) {
      return { authenticated: false, redirectTo: "/login" };
    }

    // ✅ Check if token is expired before making any request
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        // Try to refresh before declaring unauthenticated
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          localStorage.clear();
          return { authenticated: false, redirectTo: "/login" };
        }

        try {
          const { data } = await axios.post(`${API_URL}/users/refresh`, {
            refreshToken,
          });
          localStorage.setItem("accessToken", data.accessToken);
          return { authenticated: true };
        } catch {
          localStorage.clear();
          return { authenticated: false, redirectTo: "/login" };
        }
      }

      return { authenticated: true };
    } catch {
      // Token malformed
      localStorage.clear();
      return { authenticated: false, redirectTo: "/login" };
    }
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
      // ✅ Try refresh on 401 before logging out
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/users/refresh`, {
            refreshToken,
          });
          localStorage.setItem("accessToken", data.accessToken);
          return { error }; // don't logout, just return error so request can retry
        } catch {
          localStorage.clear();
          return { logout: true, redirectTo: "/login" };
        }
      }

      localStorage.clear();
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};