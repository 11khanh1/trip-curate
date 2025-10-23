import type { Booking } from "@/services/bookingApi";
import { resolveBookingPaymentUrl } from "./payment-utils";

const possibleQrKeys = [
  "qr",
  "qr_image",
  "qrImage",
  "qr_img",
  "qrImg",
  "qr_code",
  "qrCode",
  "qrcode",
  "qr_url",
  "qrUrl",
  "qr_image_url",
  "qrImageUrl",
  "qr_data",
  "qrData",
  "qr_base64",
  "qrBase64",
];

const isDataUrlImage = (value: string) => /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(value.trim());

const isHttpImageUrl = (value: string) => {
  if (!/^https?:\/\//i.test(value)) return false;
  if (/\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(value)) {
    return true;
  }
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase().includes("sepay.vn") && url.pathname.toLowerCase().includes("/img")) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

const isBase64Payload = (value: string) => /^[A-Za-z0-9+/=]+$/.test(value.replace(/\s+/g, ""));

const extractQrImageFromObject = (source: unknown, visited = new WeakSet<object>()): string | null => {
  if (!source) return null;
  if (typeof source === "string") {
    const value = source.trim();
    if (isDataUrlImage(value) || isHttpImageUrl(value)) {
      return value;
    }
    if (isBase64Payload(value)) {
      return `data:image/png;base64,${value}`;
    }
    return null;
  }
  if (typeof source !== "object") return null;
  if (visited.has(source as object)) return null;
  visited.add(source as object);

  const record = source as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (
      typeof value === "string" &&
      possibleQrKeys.some((candidate) => key.toLowerCase().includes(candidate.toLowerCase()))
    ) {
      const trimmed = value.trim();
      if (isDataUrlImage(trimmed) || isHttpImageUrl(trimmed)) {
        return trimmed;
      }
      if (isBase64Payload(trimmed)) {
        return `data:image/png;base64,${trimmed}`;
      }
    }
    const nested = extractQrImageFromObject(value, visited);
    if (nested) return nested;
  }
  return null;
};

export const deriveQrFromPaymentUrl = (paymentUrl: string | null | undefined): string | null => {
  if (!paymentUrl) return null;
  try {
    const parsed = new URL(paymentUrl);
    for (const [key, rawValue] of parsed.searchParams.entries()) {
      if (!rawValue) continue;
      if (!possibleQrKeys.some((candidate) => key.toLowerCase().includes(candidate.toLowerCase()))) {
        continue;
      }
      const value = rawValue.trim();
      if (isDataUrlImage(value) || isHttpImageUrl(value)) {
        return value;
      }
      if (isBase64Payload(value)) {
        return `data:image/png;base64,${value}`;
      }
    }
    if (parsed.hostname.toLowerCase().includes("sepay.vn") && parsed.pathname.toLowerCase().includes("/img")) {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
};

export const deduceSepayQrImage = (source: unknown): string | null => {
  const fromPayload = extractQrImageFromObject(source);
  if (fromPayload) return fromPayload;
  if (source && typeof source === "object" && "payment_url" in (source as Record<string, unknown>)) {
    const paymentUrl = (source as Record<string, unknown>).payment_url;
    if (typeof paymentUrl === "string") {
      const fromUrl = deriveQrFromPaymentUrl(paymentUrl);
      if (fromUrl) return fromUrl;
    }
  }
  return null;
};

export const extractSepayQrFromBooking = (booking?: Booking | null): string | null => {
  if (!booking) return null;
  const fromPayments = extractQrImageFromObject(booking?.payments);
  if (fromPayments) return fromPayments;
  const urlBased = deriveQrFromPaymentUrl(resolveBookingPaymentUrl(booking));
  if (urlBased) return urlBased;
  return null;
};
