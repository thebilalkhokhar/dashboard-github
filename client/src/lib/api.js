import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
});

const authStateChangeEvent = "dashboard-auth-state-change";

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;

  return (
    window.sessionStorage.getItem("authToken") ||
    window.sessionStorage.getItem("token")
  );
};

export const subscribeToAuthState = (onChange) => {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(authStateChangeEvent, onChange);
  return () => window.removeEventListener(authStateChangeEvent, onChange);
};

export const getAuthSnapshot = () => Boolean(getAuthToken());
export const getServerAuthSnapshot = () => false;

export const getStoredAuthUserSnapshot = () =>
  typeof window === "undefined"
    ? null
    : window.sessionStorage.getItem("authUser");
export const getServerAuthUserSnapshot = () => null;

export const storeAuthSession = (token, user) => {
  window.sessionStorage.setItem("authToken", token);
  window.sessionStorage.setItem("authUser", JSON.stringify(user));
  window.dispatchEvent(new Event(authStateChangeEvent));
};

export const clearAuthSession = () => {
  window.sessionStorage.removeItem("authToken");
  window.sessionStorage.removeItem("token");
  window.sessionStorage.removeItem("authUser");
  window.dispatchEvent(new Event(authStateChangeEvent));
};

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearAuthSession();
    }

    return Promise.reject(error);
  },
);

export const fetchOverviewStats = async () => {
  const res = await api.get("/analytics/overview");
  return res.data.data;
};

export const fetchDeveloperAnalytics = async () => {
  const res = await api.get("/analytics/developers");
  return res.data.data;
};

export const fetchDeveloperDetail = async (username) => {
  const res = await api.get(`/analytics/developers/${username}`);
  return res.data.data;
};

export const fetchStuckPRs = async () => {
  const res = await api.get("/prs/stuck");
  return res.data.data;
};

export const fetchRepositories = async ({
  inactiveOnly = false,
  page = 1,
  limit = 100,
  search = "",
  sortBy = "lastPushedAt",
} = {}) => {
  const res = await api.get(inactiveOnly ? "/repos/inactive" : "/repos", {
    params: { page, limit, search, sortBy },
  });
  return res.data;
};

export const fetchRepositoryDetail = async (repoName) => {
  const res = await api.get(`/repos/${encodeURIComponent(repoName)}`);
  return res.data.data;
};

export const triggerSync = async () => {
  const res = await api.post("/sync/trigger");
  return res.data;
};

export const fetchSyncStatus = async () => {
  const res = await api.get("/sync/status");
  return res.data.data;
};

export default api;
