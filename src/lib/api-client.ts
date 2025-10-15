import axios from "axios";


const isProd = import.meta.env.MODE === "production";

const resolveBaseURL = () => {
  const primary = isProd ? import.meta.env.VITE_API_BASE_URL_PROD : import.meta.env.VITE_API_BASE_URL;
  const fallback = isProd ? import.meta.env.VITE_API_BASE_URL : import.meta.env.VITE_API_BASE_URL_PROD;
  const candidate = primary ?? fallback ?? "http://localhost:8080/api";
  return candidate.replace(/\/+$/, "");
};

const baseURL = resolveBaseURL();

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid → xoá khỏi localStorage để tránh lặp vô hạn
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

export function extractData<T>(res: any): T {
  if (!res) return res as T;
  const data = res.data ?? res;
  if (data?.data !== undefined) return data.data as T;
  return data as T;
}
