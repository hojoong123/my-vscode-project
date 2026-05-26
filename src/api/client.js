import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8080/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = "Bearer " + token;

  // ✅ 알림 API 등에서 사용하는 발신자 식별 헤더 자동 첨부
  const adminId = localStorage.getItem("adminId");
  if (adminId) config.headers["X-Admin-Id"] = adminId;

  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes("/auth/login");
    if (!isLoginRequest && (err.response?.status === 401 || err.response?.status === 403)) {
      localStorage.removeItem("token");
      localStorage.removeItem("adminId");
      localStorage.removeItem("role");
      localStorage.removeItem("floor");
      localStorage.removeItem("username");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default client;