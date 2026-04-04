import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Ensure this matches your server
});

// 👉 Request interceptor – attach JWT automatically
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 👉 Response interceptor – handle 401 & 429 globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login"; // redirect to login
      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests with a single retry
    if (
      error.response?.status === 429 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      console.warn("Rate limit hit. Retrying after 5 seconds...");

      await new Promise((resolve) => setTimeout(resolve, 5000));

      return api(originalRequest); // retry the request
    }

    return Promise.reject(error);
  }
);

export default api;