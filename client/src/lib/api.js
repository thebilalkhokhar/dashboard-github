import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
});

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

export const fetchRepositories = async (inactiveOnly = false) => {
  const res = await api.get(inactiveOnly ? "/repos/inactive" : "/repos");
  return res.data.data;
};

export const triggerSync = async () => {
  const res = await api.post("/sync/trigger");
  return res.data;
};

export default api;
