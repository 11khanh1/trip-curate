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
      title: explicitTitle ?? "Thông báo mới",
      message: explicitMessage ?? "Xem chi tiết để biết thêm thông tin.",
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
        title: "Đơn đặt tour mới",
        message: bookingCode
          ? `Đơn ${bookingCode} đã được tạo${tourTitle ? ` cho tour ${tourTitle}` : ""}.`
          : "Bạn vừa có một đơn đặt tour mới.",
      };
    case "booking_cancelled":
      return {
        title: "Đơn đặt tour đã bị hủy",
        message: bookingCode
          ? `Đơn ${bookingCode} đã bị hủy.${tourTitle ? ` Tour: ${tourTitle}.` : ""}`
          : "Một đơn đặt tour đã bị hủy.",
      };
    case "payment_success":
      return {
        title: "Thanh toán thành công",
        message: bookingCode
          ? `Đơn ${bookingCode} đã thanh toán thành công.`
          : "Thanh toán của bạn đã được ghi nhận.",
      };
    case "refund_requested":
      return {
        title: "Có yêu cầu hoàn tiền",
        message: bookingCode
          ? `Yêu cầu hoàn tiền cho đơn ${bookingCode} đã được gửi.`
          : "Một yêu cầu hoàn tiền vừa được tạo.",
      };
    case "booking_created_partner":
      return {
        title: "Bạn có booking mới",
        message: bookingCode
          ? `Khách vừa đặt đơn ${bookingCode}${tourTitle ? ` cho tour ${tourTitle}` : ""}. Vui lòng xác nhận.`
          : "Bạn có booking mới cần xác nhận.",
      };
    case "booking_cancelled_partner":
      return {
        title: "Khách đã hủy booking",
        message: bookingCode
          ? `Khách đã hủy đơn ${bookingCode}${tourTitle ? ` (${tourTitle})` : ""}.`
          : "Một booking của bạn vừa bị hủy.",
      };
    case "payment_success_partner":
      return {
        title: "Booking đã được thanh toán",
        message: bookingCode
          ? `Đơn ${bookingCode}${tourTitle ? ` (${tourTitle})` : ""} đã thanh toán. Chuẩn bị dịch vụ nhé!`
          : "Một booking của bạn đã được thanh toán.",
      };
    case "payment_failed_partner":
      return {
        title: "Thanh toán thất bại",
        message: bookingCode
          ? `Đơn ${bookingCode}${tourTitle ? ` (${tourTitle})` : ""} thanh toán thất bại. Liên hệ khách để hỗ trợ.`
          : "Một booking thanh toán thất bại. Vui lòng kiểm tra.",
      };
    case "payment_expired_partner":
      return {
        title: "Thanh toán quá hạn",
        message: bookingCode
          ? `Đơn ${bookingCode}${tourTitle ? ` (${tourTitle})` : ""} chưa thanh toán và đã quá hạn.`
          : "Có booking chưa thanh toán đã quá hạn.",
      };
    case "upcoming_departure_partner": {
      const pendingCount = coerceNumber(data.pending_count);
      const unpaidCount = coerceNumber(data.unpaid_count);
      const extra =
        pendingCount || unpaidCount
          ? `Còn ${pendingCount ?? 0} booking chưa xác nhận, ${unpaidCount ?? 0} booking chưa thanh toán.`
          : "";
      const base = startDate
        ? `Tour${tourTitle ? ` ${tourTitle}` : ""} sẽ khởi hành ngày ${startDate}.`
        : "Tour sắp khởi hành.";
      return {
        title: "Tour sắp khởi hành (Partner)",
        message: `${base} ${extra}`.trim(),
      };
    }
    case "refund_requested_partner":
      return {
        title: "Khách yêu cầu hoàn tiền",
        message: bookingCode
          ? `Khách yêu cầu hoàn tiền cho đơn ${bookingCode}${tourTitle ? ` (${tourTitle})` : ""}.`
          : "Có yêu cầu hoàn tiền mới từ khách.",
      };
    case "refund_processed_partner":
      return {
        title: "Cập nhật hoàn tiền",
        message: bookingCode
          ? `Đơn ${bookingCode} đã được cập nhật trạng thái hoàn tiền: ${statusLabel}.`
          : `Hoàn tiền: ${statusLabel}.`,
      };
    case "review_created_partner":
      return {
        title: "Có đánh giá mới",
        message: tourTitle
          ? `Tour ${tourTitle} vừa nhận được đánh giá mới.`
          : "Bạn vừa nhận một đánh giá mới cho tour.",
      };
    case "partner_profile_submitted":
      return {
        title: "Hồ sơ đối tác chờ duyệt",
        message: tourTitle
          ? `Đối tác ${tourTitle} vừa gửi hồ sơ. Vui lòng kiểm tra và duyệt.`
          : "Có hồ sơ đối tác mới chờ duyệt.",
      };
    case "tour_submitted":
    case "tour_updated_pending":
      return {
        title: "Tour chờ duyệt",
        message: tourTitle
          ? `Tour ${tourTitle} đang chờ duyệt nội dung.`
          : "Có tour mới/chỉnh sửa đang chờ duyệt.",
      };
    case "booking_anomaly":
      return {
        title: "Cảnh báo booking bất thường",
        message: bookingCode
          ? `Đơn ${bookingCode} có dấu hiệu bất thường: ${statusLabel}.`
          : "Hệ thống phát hiện giao dịch bất thường. Vui lòng kiểm tra.",
      };
    case "refund_requested_admin":
      return {
        title: "Yêu cầu hoàn tiền mới",
        message: bookingCode
          ? `Yêu cầu hoàn tiền cho đơn ${bookingCode}.`
          : "Có yêu cầu hoàn tiền mới cần xử lý.",
      };
    case "refund_processed_admin":
      return {
        title: "Hoàn tiền đã xử lý",
        message: bookingCode
          ? `Đơn ${bookingCode}: trạng thái hoàn tiền ${statusLabel}.`
          : `Hoàn tiền: ${statusLabel}.`,
      };
    case "payment_webhook_issue":
      return {
        title: "Sự cố webhook thanh toán",
        message:
          coerceString(data.provider) && coerceString(data.error_message)
            ? `Nhà cung cấp ${data.provider}: ${data.error_message}`
            : "Webhook thanh toán gặp lỗi. Vui lòng kiểm tra cấu hình.",
      };
    case "invoice_failed":
      return {
        title: "Gửi hóa đơn thất bại",
        message: bookingCode
          ? `Hóa đơn cho đơn ${bookingCode} gửi thất bại. Vui lòng kiểm tra và gửi lại.`
          : "Gửi hóa đơn thất bại. Vui lòng kiểm tra cấu hình email/billing.",
      };
    case "departure_reminder":
    case "upcoming_departure":
    case "departure_alert": {
      const base = startDate
        ? `Tour${tourTitle ? ` ${tourTitle}` : ""} sẽ khởi hành ngày ${startDate}.`
        : "Tour của bạn sắp khởi hành.";
      const suffix = bookingCode ? ` Mã đơn: ${bookingCode}.` : "";
      return {
        title: "Tour sắp khởi hành (trước 1 ngày)",
        message: `${base}${suffix}`,
      };
    }
    case "payment_pending_reminder":
    case "unpaid_booking":
    case "payment_pending":
      return {
        title: "Nhắc thanh toán đơn chưa trả",
        message: bookingCode
          ? `Đơn ${bookingCode} chưa thanh toán trong 2 ngày. Vui lòng hoàn tất để giữ chỗ.`
          : "Bạn có đơn đặt tour chưa thanh toán trong 2 ngày qua. Hãy hoàn tất để giữ chỗ.",
      };
    case "tour_cleanup":
    case "delete_request":
      return {
        title: "Yêu cầu xử lý tour quá lịch",
        message: tourTitle
          ? `Tour ${tourTitle} đã qua lịch trình. Vui lòng kiểm tra và xử lý/xóa tour.`
          : "Có tour đã qua lịch trình. Vui lòng kiểm tra để xử lý hoặc xóa.",
      };
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
    case "booking_status":
      return {
        title: "Trạng thái đơn đặt tour",
        message: bookingCode
          ? `Đơn ${bookingCode}: ${statusLabel}.`
          : "Đơn đặt tour của bạn có cập nhật trạng thái.",
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

