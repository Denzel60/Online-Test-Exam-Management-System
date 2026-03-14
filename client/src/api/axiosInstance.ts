import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
});

// ✅ Attach accessToken to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Auto refresh when accessToken expires
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // No refresh token — force logout
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // ✅ Call your refresh endpoint
        const { data } = await axios.post(
          "http://localhost:3000/api/users/refresh",
          { refreshToken }
        );

        // ✅ Store the new accessToken
        localStorage.setItem("accessToken", data.accessToken);

        // ✅ Retry the original failed request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // Refresh failed — force logout
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);