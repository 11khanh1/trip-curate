import axios from "axios";
import type { AxiosRequestHeaders } from "axios";

const TOKEN_STORAGE_KEY = "token";
const isBrowser = typeof window !== "undefined";
const isProd = import.meta.env.MODE === "production";

const normalizeToken = (token?: string | null) => {
 if (!token) return null;
 return token
  .replace(/^Bearer\s+/i, "")
  .replace(/^"+|"+$/g, "")
  .trim() || null;
};

const readTokenFromStorage = (): string | null => {
 if (!isBrowser) return null;
 try {
  const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  return normalizeToken(raw);
 } catch {
  return null;
 }
};

const assignAuthorizationHeader = (headers: any, token: string) => {
 if (!headers) return;
 const value = `Bearer ${token}`;
 if (typeof headers.set === "function") {
  headers.set("Authorization", value);
 } else {
  headers.Authorization = value;
 }
};

const resolveBaseURL = () => {
  const primary = isProd ? import.meta.env.VITE_API_BASE_URL_PROD : import.meta.env.VITE_API_BASE_URL;
  const fallback = isProd ? import.meta.env.VITE_API_BASE_URL : import.meta.env.VITE_API_BASE_URL_PROD;
  const candidate = primary ?? fallback ?? "http://localhost:8080/api";
  return candidate.replace(/\/+$/, "");
};



const apiBaseURL = resolveBaseURL();


const rootBaseURL = apiBaseURL.replace(/\/api\/?$/, "");

export const apiClient = axios.create({
 baseURL: apiBaseURL,
 headers: {
  "Content-Type": "application/json",
  Accept: "application/json",
 },

 withCredentials: true,
 xsrfCookieName: "XSRF-TOKEN",
 xsrfHeaderName: "X-CSRF-TOKEN",
});

let defaultAuthToken: string | null = null;

const setDefaultAuthorizationHeader = (token: string | null) => {
 defaultAuthToken = token ?? null;
 if (token) {
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
 } else {
  delete apiClient.defaults.headers.common.Authorization;
 }
};

export const persistAuthToken = (token?: string | null) => {
 const normalized = normalizeToken(token);
 if (isBrowser) {
  try {
   if (normalized) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, normalized);
   } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
   }
  } catch {
   // Ignore storage errors (Safari private mode, etc.)
  }
 }
 setDefaultAuthorizationHeader(normalized);
 return normalized;
};

const resolveAuthToken = () => readTokenFromStorage() ?? defaultAuthToken;

if (isBrowser) {
 const bootstrapToken = readTokenFromStorage();
 if (bootstrapToken) {
  setDefaultAuthorizationHeader(bootstrapToken);
 }
}

apiClient.interceptors.request.use(
  (config) => {
    const token = resolveAuthToken();
    if (token) {
      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }
      assignAuthorizationHeader(config.headers, token);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      persistAuthToken(null);
      if (isBrowser) {
        try {
          window.localStorage.removeItem("user");
        } catch {
          // ignore storage errors
        }
      }
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
export const primeCsrfToken = () => {
 return axios.get(`${rootBaseURL}/sanctum/csrf-cookie`, {
  withCredentials: true,
 });
};

const hasXsrfCookie = () => {
 if (typeof document === "undefined") return false;
 return document.cookie
  .split(";")
  .some((cookie) => cookie.trim().startsWith("XSRF-TOKEN="));
};

export const ensureCsrfToken = async () => {
 if (hasXsrfCookie()) return;
 await primeCsrfToken();
};
