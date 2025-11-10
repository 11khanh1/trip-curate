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
  invoice: "Hóa đơn",
  invoice_ready: "Hóa đơn",
  chatbot: "Chatbot",
  booking_success: "Đặt tour",
  booking_status: "Trạng thái đơn",
  booking_confirmed: "Đơn đã xác nhận",
  booking_cancelled: "Đơn đã hủy",
  payment_status: "Thanh toán",
  payment_update: "Thanh toán",
  booking_confirmation: "Xác nhận đặt tour",
  payment_reminder: "Nhắc thanh toán",
  booking_update: "Cập nhật đơn",
  inventory_update: "Trạng thái chỗ",
  promotion_update: "Khuyến mãi",
  post_trip_review: "Mời đánh giá",
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
      title: explicitTitle ?? "Thông báo mới",
      message: explicitMessage ?? "Xem chi tiết để biết thêm thông tin.",
    };
  }

  const type = normalize(notification.type);
  const bookingCode = extractBookingCode(data);
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

  switch (type) {
    case "booking_success":
    case "booking_confirmation":
    case "booking_confirmed":
      return {
        title: "Đặt tour thành công",
        message: bookingCode
          ? `Đơn ${bookingCode} đã được tạo. Chúng tôi sẽ thông báo khi đối tác xác nhận.`
          : "Đơn đặt tour của bạn đã được tạo thành công.",
      };
    case "payment_reminder":
      return {
        title: "Nhắc thanh toán",
        message: bookingCode
          ? `Đơn ${bookingCode} vẫn chưa được thanh toán. Vui lòng hoàn tất để giữ chỗ.`
          : "Đơn đặt tour của bạn chưa được thanh toán. Hãy hoàn tất để giữ chỗ.",
      };
    case "payment_status":
    case "payment_update":
      return {
        title: "Cập nhật trạng thái thanh toán",
        message: bookingCode
          ? `Đơn ${bookingCode}: ${statusLabel}.`
          : `Trạng thái thanh toán: ${statusLabel}.`,
      };
    case "booking_update":
      return {
        title: "Cập nhật đơn đặt tour",
        message: bookingCode
          ? `Đơn ${bookingCode} có cập nhật mới: ${statusLabel}.`
          : `Đơn đặt tour của bạn có cập nhật mới: ${statusLabel}.`,
      };
    case "booking_cancelled":
    case "booking_status":
      return {
        title: "Đơn đặt tour đã bị hủy",
        message: bookingCode
          ? `Đơn ${bookingCode} đã bị hủy. Vui lòng xem chi tiết để biết hướng dẫn tiếp theo.`
          : "Đơn đặt tour của bạn đã bị hủy.",
      };
    case "inventory_update":
      return {
        title: "Trạng thái chỗ trống thay đổi",
        message: bookingCode
          ? `Chỗ trống của đơn ${bookingCode} vừa thay đổi. Hãy kiểm tra lại hành trình của bạn.`
          : "Một tour trong danh sách của bạn vừa thay đổi số chỗ. Hãy kiểm tra để kịp điều chỉnh.",
      };
    case "refund_request":
      return {
        title: "Đã gửi yêu cầu hoàn tiền",
        message: bookingCode
          ? `Yêu cầu hoàn tiền cho đơn ${bookingCode} đã được ghi nhận. Chúng tôi sẽ thông báo khi có cập nhật.`
          : "Yêu cầu hoàn tiền của bạn đã được ghi nhận.",
      };
    case "refund_update":
    case "refund_partner":
      return {
        title: "Cập nhật hoàn tiền",
        message: bookingCode
          ? `Đơn ${bookingCode}: trạng thái hoàn tiền ${statusLabel}.`
          : `Trạng thái hoàn tiền hiện tại: ${statusLabel}.`,
      };
    case "refund_completed":
      return {
        title: "Hoàn tiền thành công",
        message: amountLabel
          ? `Chúng tôi đã hoàn ${amountLabel} vào tài khoản của bạn.`
          : "Yêu cầu hoàn tiền của bạn đã được xử lý thành công.",
      };
    case "voucher": {
      const voucherCode = coerceString(data.voucher_code) ?? coerceString(data.code);
      return {
        title: "Bạn nhận được voucher mới",
        message: voucherCode
          ? `Mã ${voucherCode} đã được gửi cho bạn. Hãy dùng trước khi hết hạn.`
          : "Một voucher mới vừa được tặng cho bạn.",
      };
    }
    case "promotion_update":
      return {
        title: "Khuyến mãi mới",
        message: data?.["promotion"]
          ? `Ưu đãi ${String(data["promotion"])} đang diễn ra. Hãy áp dụng ngay!`
          : "Một chương trình khuyến mãi mới vừa mở. Đừng bỏ lỡ!",
      };
    case "invoice":
    case "invoice_ready":
      return {
        title: "Hóa đơn điện tử đã sẵn sàng",
        message: bookingCode
          ? `Hóa đơn cho đơn ${bookingCode} đã được phát hành.`
          : "Hóa đơn điện tử của bạn đã sẵn sàng.",
      };
    case "post_trip_review":
      return {
        title: "Chia sẻ cảm nhận của bạn",
        message: bookingCode
          ? `Chuyến đi của đơn ${bookingCode} đã kết thúc. Hãy dành ít phút đánh giá để nhận ưu đãi!`
          : "Chuyến đi của bạn đã kết thúc. Hãy gửi đánh giá để chúng tôi phục vụ tốt hơn.",
      };
    default:
      return {
        title: TYPE_LABELS[type] ?? "Thông báo mới",
        message: bookingCode
          ? `Đơn ${bookingCode} có cập nhật mới. Vui lòng kiểm tra chi tiết.`
          : "Bạn có thông báo mới. Vui lòng kiểm tra để biết thêm thông tin.",
      };
  }
};
