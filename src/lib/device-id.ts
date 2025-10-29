const DEVICE_STORAGE_KEY = "tripcurate_device_id";

const generateDeviceId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getOrCreateDeviceId = () => {
  if (typeof window === "undefined") {
    return generateDeviceId();
  }

  try {
    const existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    if (existing && existing.trim().length > 0) {
      return existing.trim();
    }
  } catch {
    // ignore storage errors
  }

  const next = generateDeviceId();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DEVICE_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }
  return next;
};

export const clearStoredDeviceId = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEVICE_STORAGE_KEY);
  } catch {
    // ignore errors
  }
};
