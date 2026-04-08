
import axios from "axios";

const api = axios.create({
  baseURL: "https://collasphere.onrender.com/api",
});

// 👉 Request interceptor – attach JWT automatically
api.interceptors.request.use(
  (config) => {
    let user = null;

    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch (err) {
      user = null;
    }

    config.headers = config.headers || {};

    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 👉 Response interceptor – handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ❌ 401 Unauthorized → logout user
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // ⏳ 429 Too Many Requests OR Network Errors (ERR_CONNECTION_CLOSED, etc)
    if (
      (error.response?.status === 429 || !error.response) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const delay = error.response?.status === 429 ? 5000 : 2000;
      console.warn(`Connection issue (Status: ${error.response?.status || 'Network'}). Retrying in ${delay/1000}s...`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;