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

const DATA_URL_PATTERN = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;

const isDataUrlImage = (value: string) => DATA_URL_PATTERN.test(value.trim());

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

const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "");

const sepayAccountKeyHints = [
  "acc",
  "accountno",
  "accountnumber",
  "account",
  "bankaccount",
  "beneficiaryaccount",
  "stk",
  "sotaikhoan",
];

const sepayBankKeyHints = [
  "bank",
  "bankcode",
  "bankid",
  "bankshort",
  "shortname",
  "bankname",
  "providerbank",
];

const sepayAmountKeyHints = [
  "amount",
  "totalamount",
  "paymentamount",
  "grandtotal",
  "totalprice",
  "price",
];

const sepayDescriptionKeyHints = [
  "des",
  "description",
  "desc",
  "content",
  "paymentcontent",
  "paymentdescription",
  "ordercontent",
  "note",
  "message",
  "ordercode",
  "bookingcode",
  "orderid",
  "transactioncode",
];

const matchesAnyHint = (key: string, hints: string[]) =>
  hints.some((hint) => key === hint || key.endsWith(hint));

const coerceToTrimmedString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

const coerceAccountString = (value: unknown): string | null => {
  const str = coerceToTrimmedString(value);
  if (!str) return null;
  const compact = str.replace(/[\s-]+/g, "");
  if (/^\d{4,}$/.test(compact)) {
    return compact;
  }
  return null;
};

const coerceToNumericAmount = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const findNestedNumeric = (source: unknown, visited = new WeakSet<object>()): number | null => {
  const numeric = coerceToNumericAmount(source);
  if (numeric !== null) return numeric;
  if (!source || typeof source !== "object") return null;
  if (visited.has(source as object)) return null;
  visited.add(source as object);
  const values = Array.isArray(source)
    ? (source as unknown[])
    : Object.values(source as Record<string, unknown>);
  for (const entry of values) {
    const nested = findNestedNumeric(entry, visited);
    if (nested !== null) return nested;
  }
  return null;
};

interface SepayMetadataState {
  account?: string;
  bank?: string;
  amount?: number | null;
  description?: string;
}

const gatherSepayMetadata = (
  source: unknown,
  state: SepayMetadataState,
  visited = new WeakSet<object>(),
) => {
  if (!source || typeof source !== "object") return;
  if (visited.has(source as object)) return;
  visited.add(source as object);

  const entries = Array.isArray(source)
    ? Array.from((source as unknown[]).entries())
    : Object.entries(source as Record<string, unknown>);

  for (const [rawKey, value] of entries) {
    const key = typeof rawKey === "string" ? rawKey : String(rawKey);
    const normalizedKey = normalizeKey(key);

    if (!state.account && matchesAnyHint(normalizedKey, sepayAccountKeyHints)) {
      const candidate = coerceAccountString(value);
      if (candidate) {
        state.account = candidate;
      }
    }

    if (!state.bank && matchesAnyHint(normalizedKey, sepayBankKeyHints)) {
      const candidate = coerceToTrimmedString(value);
      if (candidate) {
        state.bank = candidate;
      }
    }

    if (state.amount === undefined && matchesAnyHint(normalizedKey, sepayAmountKeyHints)) {
      const numeric = coerceToNumericAmount(value);
      if (numeric !== null) {
        state.amount = numeric;
      } else if (value && typeof value === "object") {
        const nestedNumeric = findNestedNumeric(value);
        if (nestedNumeric !== null) {
          state.amount = nestedNumeric;
        }
      }
    }

    if (!state.description && matchesAnyHint(normalizedKey, sepayDescriptionKeyHints)) {
      const candidate = coerceToTrimmedString(value);
      if (candidate) {
        state.description = candidate;
      }
    }

    if (value && typeof value === "object") {
      gatherSepayMetadata(value, state, visited);
    }
  }
};

const buildSepayQrFromMetadata = (source: unknown): string | null => {
  if (!source || typeof source !== "object") return null;
  const state: SepayMetadataState = {};
  gatherSepayMetadata(source, state);
  if (!state.account || !state.bank) return null;

  const params = new URLSearchParams();
  params.set("acc", state.account);
  params.set("bank", state.bank);

  if (typeof state.amount === "number" && Number.isFinite(state.amount)) {
    const rounded = Math.max(0, Math.round(Math.abs(state.amount)));
    params.set("amount", String(rounded));
  }

  const description = state.description?.trim();
  params.set("des", description && description.length > 0 ? description : "Thanh toan don hang");

  return `https://qr.sepay.vn/img?${params.toString()}`;
};

const normalizeQrImageCandidate = (value: unknown, context?: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "pending") return null;

  if (isDataUrlImage(trimmed)) {
    const [prefix, base64Part = ""] = trimmed.split(",", 2);
    const normalizedPayload = base64Part.replace(/\s+/g, "");

    if (normalizedPayload.length === 0 || /^\d+$/.test(normalizedPayload)) {
      if (normalizedPayload.length > 0 && context) {
        const fallback = buildSepayQrFromMetadata(context);
        if (fallback) return fallback;
      }
      return null;
    }

    return `${prefix},${normalizedPayload}`;
  }

  if (isHttpImageUrl(trimmed)) {
    return trimmed;
  }

  if (isBase64Payload(trimmed)) {
    const sanitized = trimmed.replace(/\s+/g, "");
    if (sanitized.length === 0 || /^\d+$/.test(sanitized)) {
      if (sanitized.length > 0 && context) {
        const fallback = buildSepayQrFromMetadata(context);
        if (fallback) return fallback;
      }
      return null;
    }
    return `data:image/png;base64,${sanitized}`;
  }

  return null;
};

const extractQrImageFromObject = (source: unknown, visited = new WeakSet<object>()): string | null => {
  if (!source) return null;
  if (typeof source === "string") {
    return normalizeQrImageCandidate(source);
  }
  if (typeof source !== "object") return null;
  if (visited.has(source as object)) return null;
  visited.add(source as object);

  const record = source as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (possibleQrKeys.some((candidate) => key.toLowerCase().includes(candidate.toLowerCase()))) {
      const normalized = normalizeQrImageCandidate(value, source);
      if (normalized) return normalized;
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
      const normalized = normalizeQrImageCandidate(rawValue);
      if (normalized) return normalized;
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
  if (fromPayload && fromPayload !== "pending") return fromPayload;

  const inferred = buildSepayQrFromMetadata(source);
  if (inferred && inferred !== "pending") return inferred;

  if (
    source &&
    typeof source === "object" &&
    "payment_url" in (source as Record<string, unknown>)
  ) {
    const paymentUrl = (source as Record<string, unknown>).payment_url;
    if (typeof paymentUrl === "string" && paymentUrl !== "pending") {
      const fromUrl = deriveQrFromPaymentUrl(paymentUrl);
      if (fromUrl && fromUrl !== "pending") return fromUrl;
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
  const inferred = buildSepayQrFromMetadata(booking);
  if (inferred) return inferred;
  return null;
};
