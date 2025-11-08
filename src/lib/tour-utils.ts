import type { AutoPromotion, PublicTour, PublicTourPackage, PublicTourSchedule } from "@/services/publicApi";

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const collectNumericCandidates = (values: Array<unknown>): number[] => {
  const results: number[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      results.push(...collectNumericCandidates(value));
      continue;
    }
    const parsed = parseNumeric(value);
    if (parsed !== null) {
      results.push(parsed);
    }
  }
  return results;
};

const pickBestPrice = (candidates: number[]): number | undefined => {
  if (candidates.length === 0) return undefined;
  const positive = candidates.filter((value) => value > 0);
  if (positive.length > 0) {
    return Math.min(...positive);
  }
  const nonNegative = candidates.filter((value) => value >= 0);
  if (nonNegative.length > 0) {
    return Math.min(...nonNegative);
  }
  return undefined;
};

const extractPackagePrice = (pkg: PublicTourPackage | Record<string, unknown> | null | undefined) => {
  if (!pkg || typeof pkg !== "object") return undefined;
  const record = pkg as Record<string, unknown>;
  const candidates = collectNumericCandidates([
    record.adult_price,
    record.adultPrice,
    record.price,
    record.price_from,
    record.priceFrom,
    record.price_per_adult,
    record.pricePerAdult,
    record.priceAdult,
    record.min_price,
    record.minPrice,
    record.minimum_price,
    record.minimumPrice,
    record.starting_price,
    record.startingPrice,
    record.base_price,
    record.basePrice,
    record.child_price,
    record.childPrice,
    record.price_per_child,
    record.priceChild,
  ]);
  return pickBestPrice(candidates);
};

const extractSchedulePrice = (
  schedule: PublicTourSchedule | Record<string, unknown> | null | undefined,
) => {
  if (!schedule || typeof schedule !== "object") return undefined;
  const record = schedule as Record<string, unknown>;
  const candidates = collectNumericCandidates([
    record.season_price,
    record.price,
    record.price_from,
    record.priceFrom,
    record.min_price,
    record.minPrice,
    record.base_price,
    record.basePrice,
  ]);
  return pickBestPrice(candidates);
};

const resolveBasePriceField = (tour: PublicTour | Record<string, unknown>): number | undefined => {
  if (!tour || typeof tour !== "object") return undefined;
  const record = tour as Record<string, unknown>;
  const candidates = collectNumericCandidates([record.base_price, record.basePrice]);
  return candidates.find((value) => value >= 0);
};

const resolvePriceAfterDiscountField = (tour: PublicTour | Record<string, unknown>): number | undefined => {
  if (!tour || typeof tour !== "object") return undefined;
  const record = tour as Record<string, unknown>;
  const candidates = collectNumericCandidates([
    record.price_after_discount,
    record.priceAfterDiscount,
    record.price_after,
    record.priceAfter,
  ]);
  return candidates.find((value) => value >= 0);
};

const extractAutoPromotionFromTour = (
  tour: PublicTour | Record<string, unknown>,
): AutoPromotion | null => {
  if (!tour || typeof tour !== "object") return null;
  const record = tour as Record<string, unknown>;
  const candidate = record.auto_promotion ?? record.autoPromotion;
  if (candidate && typeof candidate === "object") {
    return candidate as AutoPromotion;
  }
  return null;
};

export const applyAutoPromotionToPrice = (
  price: number | null | undefined,
  promotion?: AutoPromotion | null,
) => {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return { finalPrice: price ?? null, originalPrice: null, discountPercent: null, discountAmount: null };
  }
  if (!promotion || promotion.is_active === false) {
    return {
      finalPrice: Math.round(price),
      originalPrice: null,
      discountPercent: null,
      discountAmount: null,
    };
  }

  const normalizedType = promotion.discount_type?.toString().toLowerCase() ?? null;
  const valueNumeric = parseNumeric(promotion.value);
  const discountAmountNumeric = parseNumeric(promotion.discount_amount);

  let nextPrice = price;
  if (typeof discountAmountNumeric === "number" && discountAmountNumeric > 0) {
    nextPrice = price - discountAmountNumeric;
  } else if (
    (normalizedType === "fixed" || normalizedType === "amount") &&
    typeof valueNumeric === "number" &&
    valueNumeric > 0
  ) {
    nextPrice = price - valueNumeric;
  } else if (
    (normalizedType === "percent" || normalizedType === "percentage") &&
    typeof valueNumeric === "number" &&
    valueNumeric > 0
  ) {
    nextPrice = price * (1 - valueNumeric / 100);
  } else {
    return {
      finalPrice: Math.round(price),
      originalPrice: null,
      discountPercent: null,
      discountAmount: null,
    };
  }

  const finalPrice = Math.max(0, Math.round(nextPrice));
  if (finalPrice >= price) {
    return {
      finalPrice: Math.round(price),
      originalPrice: null,
      discountPercent: null,
      discountAmount: null,
    };
  }

  const discountAmount = price - finalPrice;
  const discountPercent = price > 0 ? Math.round((discountAmount / price) * 100) : null;
  return {
    finalPrice,
    originalPrice: Math.round(price),
    discountPercent,
    discountAmount,
  };
};

const computeLegacyStartingPrice = (tour: PublicTour | Record<string, unknown>): number => {
  if (!tour || typeof tour !== "object") return 0;
  const record = tour as Record<string, unknown>;

  const basePriceCandidate = collectNumericCandidates([record.base_price, record.basePrice]).find(
    (value) => value > 0,
  );
  if (basePriceCandidate !== undefined) {
    return Math.max(0, Math.round(basePriceCandidate));
  }

  const candidates: number[] = [];

  const otherBaseCandidates = collectNumericCandidates([
    record.price,
    record.price_from,
    record.priceFrom,
    record.season_price,
    record.seasonPrice,
    record.min_price,
    record.minPrice,
  ]);
  candidates.push(...otherBaseCandidates);

  if (Array.isArray((record as PublicTour).packages)) {
    for (const pkg of (record as PublicTour).packages ?? []) {
      const price = extractPackagePrice(pkg);
      if (price !== undefined) {
        candidates.push(price);
      }
    }
  }

  if (Array.isArray((record as PublicTour).schedules)) {
    for (const schedule of (record as PublicTour).schedules ?? []) {
      const price = extractSchedulePrice(schedule);
      if (price !== undefined) {
        candidates.push(price);
      }
    }
  }

  const best = pickBestPrice(candidates);
  if (best === undefined) return 0;
  return Math.max(0, Math.round(best));
};

export interface TourPriceInfo {
  price: number;
  originalPrice?: number;
  discountAmount?: number;
  discountPercent?: number;
  autoPromotion?: AutoPromotion | null;
}

export const getTourPriceInfo = (tour: PublicTour | Record<string, unknown>): TourPriceInfo => {
  const fallbackPrice = computeLegacyStartingPrice(tour);
  const discountPrice = resolvePriceAfterDiscountField(tour);
  const hasDiscountPrice =
    typeof discountPrice === "number" && Number.isFinite(discountPrice) && discountPrice > 0;
  let price = hasDiscountPrice ? Math.round(discountPrice!) : fallbackPrice;

  const baseField = resolveBasePriceField(tour);
  const originalCandidate =
    typeof baseField === "number" && Number.isFinite(baseField) && baseField > 0 ? baseField : undefined;

  let originalPrice =
    typeof originalCandidate === "number" && originalCandidate > 0 ? originalCandidate : undefined;
  let discountAmount: number | undefined;
  let discountPercent: number | undefined;

  if (typeof originalPrice === "number" && originalPrice > 0 && price < originalPrice) {
    discountAmount = originalPrice - price;
    discountPercent = Math.round((discountAmount / originalPrice) * 100);
  } else {
    originalPrice = undefined;
  }

  const autoPromotion = extractAutoPromotionFromTour(tour);

  if (
    (!hasDiscountPrice || price >= fallbackPrice) &&
    (!discountAmount || discountAmount <= 0) &&
    autoPromotion &&
    fallbackPrice > 0
  ) {
    const applied = applyAutoPromotionToPrice(originalPrice ?? fallbackPrice, autoPromotion);
    if (
      typeof applied.finalPrice === "number" &&
      Number.isFinite(applied.finalPrice) &&
      applied.finalPrice > 0 &&
      applied.finalPrice < price
    ) {
      price = applied.finalPrice;
      originalPrice = applied.originalPrice ?? originalPrice ?? fallbackPrice;
      discountAmount =
        typeof originalPrice === "number" && originalPrice > price ? originalPrice - price : undefined;
      discountPercent =
        typeof originalPrice === "number" && originalPrice > price
          ? Math.round(((originalPrice - price) / originalPrice) * 100)
          : undefined;
    }
  }

  return {
    price,
    originalPrice,
    discountAmount,
    discountPercent,
    autoPromotion,
  };
};

export const getTourStartingPrice = (tour: PublicTour | Record<string, unknown>): number => {
  return getTourPriceInfo(tour).price;
};

export const formatCurrency = (value: number | null | undefined, options?: Intl.NumberFormatOptions) => {
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  });
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return formatter.format(value);
  }
  return "Liên hệ";
};
