import type { PublicTour, PublicTourPackage, PublicTourSchedule } from "@/services/publicApi";

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

export const getTourStartingPrice = (tour: PublicTour | Record<string, unknown>): number => {
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
