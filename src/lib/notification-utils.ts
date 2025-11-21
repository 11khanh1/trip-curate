import type { NotificationPayload } from "@/services/notificationApi";

export interface NotificationCopy {
  title: string;
  message: string;
}

const normalize = (value?: string | null) => (value ?? "").toString().trim().toLowerCase();

const TYPE_LABELS: Record<string, string> = {
  voucher: "Voucher",
  refund_request: "Yêu cầu hoàn tiền",
  refund_update: "Cập nhật hoàn tiền",
  refund_partner: "Đối tác hoàn tiền",
  refund_completed: "Hoàn tiền hoàn tất",
  refund_requested: "Yêu cầu hoàn tiền",
  invoice: "Hóa đơn",
  invoice_ready: "Hóa đơn",
  chatbot: "Chatbot",
  booking_success: "Đặt tour",
  booking_status: "Trạng thái đơn",
  booking_confirmed: "Đơn đã xác nhận",
  booking_cancelled: "Đơn đã hủy",
  booking_created: "Đơn mới",
  payment_status: "Thanh toán",
  payment_update: "Thanh toán",
  booking_confirmation: "Xác nhận đặt tour",
  payment_reminder: "Nhắc thanh toán",
  booking_update: "Cập nhật đơn",
  inventory_update: "Trạng thái chỗ",
  promotion_update: "Khuyến mãi",
  post_trip_review: "Mời đánh giá",
  booking_created_partner: "Đơn mới",
  booking_cancelled_partner: "Đơn hủy",
  payment_success_partner: "Thanh toán thành công",
  payment_failed_partner: "Thanh toán thất bại",
  payment_expired_partner: "Thanh toán hết hạn",
  upcoming_departure_partner: "Sắp khởi hành",
  refund_requested_partner: "Yêu cầu hoàn tiền",
  refund_processed_partner: "Cập nhật hoàn tiền",
  review_created_partner: "Đánh giá mới",
  partner_profile_submitted: "Hồ sơ đối tác",
  tour_submitted: "Tour cần duyệt",
  tour_updated_pending: "Tour chờ duyệt",
  booking_anomaly: "Cảnh báo đặt chỗ",
  refund_requested_admin: "Yêu cầu hoàn tiền",
  refund_processed_admin: "Cập nhật hoàn tiền",
  payment_webhook_issue: "Sự cố thanh toán",
  invoice_failed: "Hóa đơn lỗi",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Đang xử lý",
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
  success: "Thành công",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
  awaiting: "Đang chờ",
  await_partner: "Chờ đối tác xử lý",
  await_customer_confirm: "Chờ bạn xác nhận",
  processing: "Đang xử lý",
};

const coerceString = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
};

const coerceNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const formatCurrencyAmount = (amount?: number, currency?: string | null) => {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  const resolvedCurrency = currency?.trim().length ? currency!.trim().toUpperCase() : "VND";
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: resolvedCurrency,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("vi-VN")} ${resolvedCurrency}`;
  }
};

const humanizeStatus = (value?: string | null) => {
  if (!value) return "Đang cập nhật";
  const normalized = normalize(value);
  return STATUS_LABELS[normalized] ?? value;
};

const extractBookingCode = (data?: Record<string, unknown> | null) => {
  if (!data) return null;
  const keys = [
    "booking_code",
    "bookingCode",
    "code",
    "order_code",
    "orderCode",
    "reference",
    "reference_code",
    "referenceCode",
  ];
  for (const key of keys) {
    const value = coerceString(data[key]);
    if (value) return value;
  }
  return null;
};

export const getNotificationTypeLabel = (type?: string | null) => {
  const normalized = normalize(type);
  return TYPE_LABELS[normalized] ?? "Khác";
};


export const getNotificationCopy = (notification: NotificationPayload): NotificationCopy => {
  const data = (notification.data as Record<string, unknown> | undefined) ?? {};
  const explicitTitle = coerceString(data.title);
  const explicitMessage = coerceString(data.message);
  if (explicitTitle || explicitMessage) {
    return {
      title: explicitTitle ?? "Th?ng b?o m?i",
      message: explicitMessage ?? "Xem chi ti?t ?? bi?t th?m th?ng tin.",
    };
  }

  const eventType = normalize(coerceString(data.type));
  const type = normalize(notification.type);
  const bookingCode = extractBookingCode(data);
  const tourTitle = coerceString(data.tour_title) ?? coerceString(data.tourTitle);
  const startDate = coerceString(data.start_date) ?? coerceString(data.startDate);
  const statusLabel = humanizeStatus(
    coerceString(data.status) ??
      coerceString(data.payment_status) ??
      coerceString(data.paymentStatus) ??
      coerceString(data.booking_status) ??
      coerceString(data.refund_status) ??
      coerceString(data.refundStatus),
  );
  const amountValue =
    coerceNumber(data.amount) ??
    coerceNumber(data.total) ??
    coerceNumber(data.payment_amount) ??
    coerceNumber(data.paymentAmount) ??
    coerceNumber(data.refund_amount) ??
    coerceNumber(data.refundAmount);
  const amountLabel = formatCurrencyAmount(amountValue, coerceString(data.currency));

  switch (eventType || type) {
    case "booking_created":
      return {
        title: "??n ??t tour m?i",
        message: bookingCode
          ? `??n ${bookingCode} ?? ???c t?o${tourTitle ? ` cho tour ${tourTitle}` : ""}.`
          : "B?n v?a c? m?t ??n ??t tour m?i.",
      };
    case "booking_cancelled":
      return {
        title: "??n ??t tour ?? b? h?y",
        message: bookingCode
          ? `??n ${bookingCode} ?? b? h?y.${tourTitle ? ` Tour: ${tourTitle}.` : ""}`
          : "M?t ??n ??t tour ?? b? h?y.",
      };
    case "payment_success":
      return {
        title: "Thanh to?n th?nh c?ng",
        message: bookingCode
          ? `??n ${bookingCode} ?? thanh to?n th?nh c?ng.`
          : "Thanh to?n c?a b?n ?? ???c ghi nh?n.",
      };
    case "refund_requested":
      return {
        title: "C? y?u c?u ho?n ti?n",
        message: bookingCode
          ? `Y?u c?u ho?n ti?n cho ??n ${bookingCode} ?? ???c g?i.`
          : "M?t y?u c?u ho?n ti?n v?a ???c t?o.",
      };
    case "booking_created_partner":
      return {
        title: "B?n c? booking m?i",
        message: bookingCode
          ? `Kh?ch v?a ??t ??n ${bookingCode}${tourTitle ? ` cho tour ${tourTitle}` : ""}. Vui l?ng x?c nh?n.`
          : "B?n c? booking m?i c?n x?c nh?n.",
      };
    case "booking_cancelled_partner":
      return {
        title: "Kh?ch ?? h?y booking",
        message: bookingCode
          ? `Kh?ch ?? h?y ??n ${bookingCode}${tourTitle ? ` (${tourTitle})` : ""}.`
          : "M?t booking c?a b?n v?a b? h?y.",
      };
    case "payment_success_partner":
      return {
        title: "Booking ?? ???c thanh to?n",
        message: bookingCode
          ? `??n ${bookingCode}${tourTitle ? ` (${tourTitle})` : ""} ?? thanh to?n. Chu?n b? d?ch v? nh?!`
          : "M?t booking c?a b?n ?? ???c thanh to?n.",
      };
    case "payment_failed_partner":
      return {
        title: "Thanh to?n th?t b?i",
        message: bookingCode
          ? `??n ${bookingCode}${tourTitle ? ` (${tourTitle})` : ""} thanh to?n th?t b?i. Li?n h? kh?ch ?? h? tr?.`
          : "M?t booking thanh to?n th?t b?i. Vui l?ng ki?m tra.",
      };
    case "payment_expired_partner":
      return {
        title: "Thanh to?n qu? h?n",
        message: bookingCode
          ? `??n ${bookingCode}${tourTitle ? ` (${tourTitle})` : ""} ch?a thanh to?n v? ?? qu? h?n.`
          : "C? booking ch?a thanh to?n ?? qu? h?n.",
      };
    case "upcoming_departure_partner": {
      const pendingCount = coerceNumber(data.pending_count);
      const unpaidCount = coerceNumber(data.unpaid_count);
      const extra =
        pendingCount || unpaidCount
          ? `C?n ${pendingCount ?? 0} booking ch?a x?c nh?n, ${unpaidCount ?? 0} booking ch?a thanh to?n.`
          : "";
      const base = startDate
        ? `Tour${tourTitle ? ` ${tourTitle}` : ""} s? kh?i h?nh ng?y ${startDate}.`
        : "Tour s?p kh?i h?nh.";
      return {
        title: "Tour s?p kh?i h?nh (Partner)",
        message: `${base} ${extra}`.trim(),
      };
    }
    case "refund_requested_partner":
      return {
        title: "Kh?ch y?u c?u ho?n ti?n",
        message: bookingCode
          ? `Kh?ch y?u c?u ho?n ti?n cho ??n ${bookingCode}${tourTitle ? ` (${tourTitle})` : ""}.`
          : "C? y?u c?u ho?n ti?n m?i t? kh?ch.",
      };
    case "refund_processed_partner":
      return {
        title: "C?p nh?t ho?n ti?n",
        message: bookingCode
          ? `??n ${bookingCode} ?? ???c c?p nh?t tr?ng th?i ho?n ti?n: ${statusLabel}.`
          : `Ho?n ti?n: ${statusLabel}.`,
      };
    case "review_created_partner":
      return {
        title: "C? ??nh gi? m?i",
        message: tourTitle
          ? `Tour ${tourTitle} v?a nh?n ???c ??nh gi? m?i.`
          : "B?n v?a nh?n m?t ??nh gi? m?i cho tour.",
      };
    case "partner_profile_submitted":
      return {
        title: "H? s? ??i t?c ch? duy?t",
        message: tourTitle
          ? `??i t?c ${tourTitle} v?a g?i h? s?. Vui l?ng ki?m tra v? duy?t.`
          : "C? h? s? ??i t?c m?i ch? duy?t.",
      };
    case "tour_submitted":
    case "tour_updated_pending":
      return {
        title: "Tour ch? duy?t",
        message: tourTitle
          ? `Tour ${tourTitle} ?ang ch? duy?t n?i dung.`
          : "C? tour m?i/ch?nh s?a ?ang ch? duy?t.",
      };
    case "booking_anomaly":
      return {
        title: "C?nh b?o booking b?t th??ng",
        message: bookingCode
          ? `??n ${bookingCode} c? d?u hi?u b?t th??ng: ${statusLabel}.`
          : "H? th?ng ph?t hi?n giao d?ch b?t th??ng. Vui l?ng ki?m tra.",
      };
    case "refund_requested_admin":
      return {
        title: "Y?u c?u ho?n ti?n m?i",
        message: bookingCode
          ? `Y?u c?u ho?n ti?n cho ??n ${bookingCode}.`
          : "C? y?u c?u ho?n ti?n m?i c?n x? l?.",
      };
    case "refund_processed_admin":
      return {
        title: "Ho?n ti?n ?? x? l?",
        message: bookingCode
          ? `??n ${bookingCode}: tr?ng th?i ho?n ti?n ${statusLabel}.`
          : `Ho?n ti?n: ${statusLabel}.`,
      };
    case "payment_webhook_issue":
      return {
        title: "S? c? webhook thanh to?n",
        message:
          coerceString(data.provider) && coerceString(data.error_message)
            ? `Nh? cung c?p ${data.provider}: ${data.error_message}`
            : "Webhook thanh to?n g?p l?i. Vui l?ng ki?m tra c?u h?nh.",
      };
    case "invoice_failed":
      return {
        title: "G?i h?a ??n th?t b?i",
        message: bookingCode
          ? `H?a ??n cho ??n ${bookingCode} g?i th?t b?i. Vui l?ng ki?m tra v? g?i l?i.`
          : "G?i h?a ??n th?t b?i. Vui l?ng ki?m tra c?u h?nh email/billing.",
      };
    case "departure_reminder":
    case "upcoming_departure":
    case "departure_alert": {
      const base = startDate
        ? `Tour${tourTitle ? ` ${tourTitle}` : ""} s? kh?i h?nh ng?y ${startDate}.`
        : "Tour c?a b?n s?p kh?i h?nh.";
      const suffix = bookingCode ? ` M? ??n: ${bookingCode}.` : "";
      return {
        title: "Tour s?p kh?i h?nh (tr??c 1 ng?y)",
        message: `${base}${suffix}`,
      };
    }
    case "payment_pending_reminder":
    case "unpaid_booking":
    case "payment_pending":
      return {
        title: "Nh?c thanh to?n ??n ch?a tr?",
        message: bookingCode
          ? `??n ${bookingCode} ch?a thanh to?n trong 2 ng?y. Vui l?ng ho?n t?t ?? gi? ch?.`
          : "B?n c? ??n ??t tour ch?a thanh to?n trong 2 ng?y qua. H?y ho?n t?t ?? gi? ch?.",
      };
    case "tour_cleanup":
    case "delete_request":
      return {
        title: "Y?u c?u x? l? tour qu? l?ch",
        message: tourTitle
          ? `Tour ${tourTitle} ?? qua l?ch tr?nh. Vui l?ng ki?m tra v? x? l?/x?a tour.`
          : "C? tour ?? qua l?ch tr?nh. Vui l?ng ki?m tra ?? x? l? ho?c x?a.",
      };
    case "booking_success":
    case "booking_confirmation":
    case "booking_confirmed":
      return {
        title: "??t tour th?nh c?ng",
        message: bookingCode
          ? `??n ${bookingCode} ?? ???c t?o. Ch?ng t?i s? th?ng b?o khi ??i t?c x?c nh?n.`
          : "??n ??t tour c?a b?n ?? ???c t?o th?nh c?ng.",
      };
    case "payment_reminder":
      return {
        title: "Nh?c thanh to?n",
        message: bookingCode
          ? `??n ${bookingCode} v?n ch?a ???c thanh to?n. Vui l?ng ho?n t?t ?? gi? ch?.`
          : "??n ??t tour c?a b?n ch?a ???c thanh to?n. H?y ho?n t?t ?? gi? ch?.",
      };
    case "payment_status":
    case "payment_update":
      return {
        title: "C?p nh?t tr?ng th?i thanh to?n",
        message: bookingCode
          ? `??n ${bookingCode}: ${statusLabel}.`
          : `Tr?ng th?i thanh to?n: ${statusLabel}.`,
      };
    case "booking_update":
      return {
        title: "C?p nh?t ??n ??t tour",
        message: bookingCode
          ? `??n ${bookingCode} c? c?p nh?t m?i: ${statusLabel}.`
          : `??n ??t tour c?a b?n c? c?p nh?t m?i: ${statusLabel}.`,
      };
    case "booking_status":
      return {
        title: "Tr?ng th?i ??n ??t tour",
        message: bookingCode
          ? `??n ${bookingCode}: ${statusLabel}.`
          : "??n ??t tour c?a b?n c? c?p nh?t tr?ng th?i.",
      };
    case "inventory_update":
      return {
        title: "Tr?ng th?i ch? tr?ng thay ??i",
        message: bookingCode
          ? `Ch? tr?ng c?a ??n ${bookingCode} v?a thay ??i. H?y ki?m tra l?i h?nh tr?nh c?a b?n.`
          : "M?t tour trong danh s?ch c?a b?n v?a thay ??i s? ch?. H?y ki?m tra ?? k?p ?i?u ch?nh.",
      };
    case "refund_request":
      return {
        title: "?? g?i y?u c?u ho?n ti?n",
        message: bookingCode
          ? `Y?u c?u ho?n ti?n cho ??n ${bookingCode} ?? ???c ghi nh?n. Ch?ng t?i s? th?ng b?o khi c? c?p nh?t.`
          : "Y?u c?u ho?n ti?n c?a b?n ?? ???c ghi nh?n.",
      };
    case "refund_update":
    case "refund_partner":
      return {
        title: "C?p nh?t ho?n ti?n",
        message: bookingCode
          ? `??n ${bookingCode}: tr?ng th?i ho?n ti?n ${statusLabel}.`
          : `Tr?ng th?i ho?n ti?n hi?n t?i: ${statusLabel}.`,
      };
    case "refund_completed":
      return {
        title: "Ho?n ti?n th?nh c?ng",
        message: amountLabel
          ? `Ch?ng t?i ?? ho?n ${amountLabel} v?o t?i kho?n c?a b?n.`
          : "Y?u c?u ho?n ti?n c?a b?n ?? ???c x? l? th?nh c?ng.",
      };
    case "voucher": {
      const voucherCode = coerceString(data.voucher_code) ?? coerceString(data.code);
      return {
        title: "B?n nh?n ???c voucher m?i",
        message: voucherCode
          ? `M? ${voucherCode} ?? ???c g?i cho b?n. H?y d?ng tr??c khi h?t h?n.`
          : "M?t voucher m?i v?a ???c t?ng cho b?n.",
      };
    }
    case "promotion_update":
      return {
        title: "Khuy?n m?i m?i",
        message: data?.["promotion"]
          ? `?u ??i ${String(data["promotion"])} ?ang di?n ra. H?y ?p d?ng ngay!`
          : "M?t ch??ng tr?nh khuy?n m?i m?i v?a m?. ??ng b? l?!",
      };
    case "invoice":
    case "invoice_ready":
      return {
        title: "H?a ??n ?i?n t? ?? s?n s?ng",
        message: bookingCode
          ? `H?a ??n cho ??n ${bookingCode} ?? ???c ph?t h?nh.`
          : "H?a ??n ?i?n t? c?a b?n ?? s?n s?ng.",
      };
    case "post_trip_review":
      return {
        title: "Chia s? c?m nh?n c?a b?n",
        message: bookingCode
          ? `Chuy?n ?i c?a ??n ${bookingCode} ?? k?t th?c. H?y d?nh ?t ph?t ??nh gi? ?? nh?n ?u ??i!`
          : "Chuy?n ?i c?a b?n ?? k?t th?c. H?y g?i ??nh gi? ?? ch?ng t?i ph?c v? t?t h?n.",
      };
    default:
      return {
        title: TYPE_LABELS[type] ?? "Th?ng b?o m?i",
        message: bookingCode
          ? `??n ${bookingCode} c? c?p nh?t m?i. Vui l?ng ki?m tra chi ti?t.`
          : "B?n c? th?ng b?o m?i. Vui l?ng ki?m tra ?? bi?t th?m th?ng tin.",
      };
  }
};

