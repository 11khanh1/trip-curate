import type {
  Booking,
  BookingPayment,
  BookingPaymentIntentResponse,
} from "@/services/bookingApi";

export const coalesceString = (...values: Array<unknown>): string | null => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
};

const isUrl = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
};

const toRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
};

const parseMetaRecord = (meta: unknown): Record<string, unknown> | undefined => {
  if (!meta) return undefined;
  if (typeof meta === "string") {
    try {
      const parsed = JSON.parse(meta);
      return toRecord(parsed);
    } catch {
      return undefined;
    }
  }
  return toRecord(meta);
};

const findUrlDeep = (source: unknown): string | null => {
  if (typeof source === "string") {
    return isUrl(source);
  }
  if (!source || typeof source !== "object") return null;
  if (Array.isArray(source)) {
    for (const item of source) {
      const result = findUrlDeep(item);
      if (result) return result;
    }
    return null;
  }
  const record = source as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const result = findUrlDeep(record[key]);
    if (result) return result;
  }
  return null;
};

export const extractPaymentUrl = (payment?: BookingPayment | null): string | null => {
  if (!payment) return null;
  const paymentRecord = toRecord(payment) ?? {};
  const metaRecord = parseMetaRecord(paymentRecord.meta);
  const nestedMetaData = metaRecord?.data ? parseMetaRecord(metaRecord.data) : undefined;
  const candidateSources = [paymentRecord, metaRecord, nestedMetaData];
  const candidateKeys = [
    "payment_url",
    "paymentUrl",
    "payment_link",
    "paymentLink",
    "pay_url",
    "payUrl",
    "checkout_url",
    "checkoutUrl",
    "redirect_url",
    "redirectUrl",
    "gateway_url",
    "gatewayUrl",
    "intent_url",
    "intentUrl",
    "url",
    "link",
  ];

  for (const source of candidateSources) {
    if (!source) continue;
    for (const key of candidateKeys) {
      const value = source[key];
      if (typeof value === "string") {
        const normalized = isUrl(value);
        if (normalized) return normalized;
      }
    }
  }

  const deepMetaUrl = metaRecord ? findUrlDeep(metaRecord) : null;
  if (deepMetaUrl) return deepMetaUrl;

  const deepPaymentUrl = findUrlDeep(paymentRecord);
  if (deepPaymentUrl) return deepPaymentUrl;

  return null;
};

export const resolveBookingPaymentUrl = (booking?: Booking | null): string | null => {
  if (!booking) return null;
  const directUrl = coalesceString(booking.payment_url) ?? null;
  if (directUrl) return directUrl;
  if (Array.isArray(booking.payments)) {
    for (const payment of booking.payments) {
      const candidate = extractPaymentUrl(payment);
      if (candidate) return candidate;
    }
  }
  return null;
};

export const extractPaymentIntentUrl = (
  intent?: BookingPaymentIntentResponse | null,
  fallbackBooking?: Booking | null,
): string | null => {
  if (!intent) {
    return resolveBookingPaymentUrl(fallbackBooking);
  }
  const direct = coalesceString(
    (intent as Record<string, unknown>)?.payment_url as string | undefined,
    (intent as Record<string, unknown>)?.paymentUrl as string | undefined,
    (intent as Record<string, unknown>)?.url as string | undefined,
  );
  if (direct) return direct;
  if (intent.booking) {
    return resolveBookingPaymentUrl(intent.booking);
  }
  return resolveBookingPaymentUrl(fallbackBooking);
};

