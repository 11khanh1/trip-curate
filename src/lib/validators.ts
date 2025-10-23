const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

export const sanitizeVietnamPhone = (value: string) => sanitizeDigits(value);

export const isValidVietnamPhone = (value: string): boolean => {
  const digits = sanitizeDigits(value);
  if (digits.length === 10 && digits.startsWith("0")) return true;
  if (digits.length === 11 && digits.startsWith("84")) return true;
  return false;
};

export const normalizeVietnamPhone = (value: string): string => {
  const digits = sanitizeDigits(value);
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 11 && digits.startsWith("84")) return digits;
  return value.trim();
};

export const isValidCitizenId = (value: string): boolean => {
  const digits = sanitizeDigits(value);
  return digits.length === 9 || digits.length === 12;
};

export const normalizeCitizenId = (value: string): string => sanitizeDigits(value);

export const isPastDate = (value: string): boolean => {
  if (!value) return true;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};
