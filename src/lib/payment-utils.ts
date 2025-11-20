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

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const PAYMENT_FINAL_AMOUNT_KEYS = [
  "payable_amount",
  "amount_payable",
  "amount_due",
  "amount_after_discount",
  "amountAfterDiscount",
  "final_amount",
  "finalAmount",
  "final_total",
  "finalTotal",
  "final_price",
  "finalPrice",
  "total_after_discount",
  "totalAfterDiscount",
  "price_after_discount",
  "priceAfterDiscount",
  "net_amount",
  "netAmount",
  "amount",
  "value",
];

const PAYMENT_ORIGINAL_AMOUNT_KEYS = [
  "original_amount",
  "originalAmount",
  "list_price",
  "listPrice",
  "listed_price",
  "listedPrice",
  "total_price",
  "totalPrice",
  "total_amount",
  "totalAmount",
];

const PAYMENT_DISCOUNT_KEYS = [
  "discount_total",
  "discountTotal",
  "discount_amount",
  "discountAmount",
  "promotion_discount",
  "promotionDiscount",
  "total_discount",
  "totalDiscount",
];

const BOOKING_FINAL_AMOUNT_KEYS = [
  "payable_amount",
  "amount_payable",
  "amount_due",
  "amount_after_discount",
  "amountAfterDiscount",
  "final_amount",
  "finalAmount",
  "final_total",
  "finalTotal",
  "final_price",
  "finalPrice",
  "total_after_discount",
  "totalAfterDiscount",
  "price_after_discount",
  "priceAfterDiscount",
  "grand_total",
  "grandTotal",
  "net_amount",
  "netAmount",
  "total_amount",
  "totalAmount",
  "total_price",
  "totalPrice",
  "amount",
  "value",
];

const BOOKING_ORIGINAL_AMOUNT_KEYS = [
  "original_total",
  "originalTotal",
  "list_price",
  "listPrice",
  "listed_price",
  "listedPrice",
  "subtotal",
  "sub_total",
  "subTotal",
  "base_price",
  "basePrice",
  "total_price",
  "totalPrice",
];

const BOOKING_DISCOUNT_KEYS = [
  "discount_total",
  "discountTotal",
  "discount_amount",
  "discountAmount",
  "promotion_discount",
  "promotionDiscount",
  "total_discount",
  "totalDiscount",
];

const collectRecords = (...sources: Array<unknown>): Record<string, unknown>[] => {
  const records: Record<string, unknown>[] = [];
  const visit = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      records.push(value as Record<string, unknown>);
    }
  };
  sources.forEach(visit);
  return records;
};

const collectPaymentRecords = (payment?: BookingPayment | Record<string, unknown> | null) => {
  const paymentRecord = toRecord(payment);
  const metaRecord = paymentRecord ? parseMetaRecord((paymentRecord as { meta?: unknown }).meta) : undefined;
  const nestedMeta =
    metaRecord && metaRecord.data ? parseMetaRecord(metaRecord.data) : undefined;
  return collectRecords(paymentRecord, metaRecord, nestedMeta);
};

const resolveAmountFromRecords = (records: Record<string, unknown>[], keys: string[]): number | null => {
  for (const record of records) {
    for (const key of keys) {
      if (!(key in record)) continue;
      const parsed = parseNumericValue(record[key]);
      if (parsed !== null) {
        return parsed;
      }
    }
  }
  return null;
};

export const resolvePaymentFinalAmount = (
  payment?: BookingPayment | Record<string, unknown> | null,
): number | null => {
  if (!payment) return null;
  const records = collectPaymentRecords(payment);
  const payable = resolveAmountFromRecords(records, PAYMENT_FINAL_AMOUNT_KEYS);
  if (payable !== null) return payable;
  const original = resolveAmountFromRecords(records, PAYMENT_ORIGINAL_AMOUNT_KEYS);
  const discount = resolveAmountFromRecords(records, PAYMENT_DISCOUNT_KEYS);
  if (original !== null && discount !== null && discount > 0) {
    return Math.max(0, original - discount);
  }
  return original;
};

export const resolvePaymentOriginalAmount = (
  payment?: BookingPayment | Record<string, unknown> | null,
): number | null => {
  if (!payment) return null;
  const records = collectPaymentRecords(payment);
  return resolveAmountFromRecords(records, PAYMENT_ORIGINAL_AMOUNT_KEYS);
};

export const resolvePaymentDiscountAmount = (
  payment?: BookingPayment | Record<string, unknown> | null,
): number | null => {
  if (!payment) return null;
  const records = collectPaymentRecords(payment);
  return resolveAmountFromRecords(records, PAYMENT_DISCOUNT_KEYS);
};

const collectBookingRecords = (booking?: Booking | Record<string, unknown> | null) => {
  if (!booking) return [];
  const bookingRecord = (booking as Record<string, unknown>) ?? {};
  const paymentRecords: Record<string, unknown>[] = [];
  const bookingPayments =
    (booking as Booking)?.payments ??
    ((Array.isArray(bookingRecord?.["payments"]) ? bookingRecord?.["payments"] : null) as
      | BookingPayment[]
      | null
      | undefined);
  if (Array.isArray(bookingPayments)) {
    bookingPayments.forEach((payment) => {
      collectPaymentRecords(payment as BookingPayment).forEach((record) => paymentRecords.push(record));
    });
  }
  return [bookingRecord, ...paymentRecords];
};

export const resolveBookingPayableAmount = (
  booking?: Booking | Record<string, unknown> | null,
): number | null => {
  if (!booking) return null;
  const records = collectBookingRecords(booking);
  const payable = resolveAmountFromRecords(records, BOOKING_FINAL_AMOUNT_KEYS);
  if (payable !== null) return payable;
  const original = resolveAmountFromRecords(records, BOOKING_ORIGINAL_AMOUNT_KEYS);
  const discount = resolveAmountFromRecords(records, BOOKING_DISCOUNT_KEYS);
  if (original !== null && discount !== null && discount > 0) {
    return Math.max(0, original - discount);
  }
  return original;
};
