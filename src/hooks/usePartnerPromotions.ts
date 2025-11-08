import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import {
  createPartnerPromotion,
  deletePartnerPromotion,
  fetchPartnerPromotions,
  updatePartnerPromotion,
  type PartnerPromotion,
  type PartnerPromotionPayload,
} from "@/services/partnerApi";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

const PARTNER_TOUR_ENDPOINT = "/partner/tours";

export type PromotionDiscountType = "percent" | "percentage" | "fixed";

export interface PromotionFormState {
  discount_type: PromotionDiscountType;
  value: string;
  max_usage: string;
  valid_from: string;
  valid_to: string;
  description: string;
  is_active: boolean;
}

export interface PromotionDateRange {
  from?: string;
  to?: string;
}

export type PromotionStatusFilter = "all" | "active" | "inactive" | "upcoming" | "expired";

export type PromotionTypeFilter = "all" | Exclude<PromotionDiscountType, "percentage">;

export interface PromotionFilters {
  search: string;
  status: PromotionStatusFilter;
  discountType: PromotionTypeFilter;
  dateRange: PromotionDateRange | null;
}

export interface UsePartnerPromotionsOptions {
  initialTourId?: string | number | null;
  autoFetch?: boolean;
}

export interface PartnerTourSummary {
  id: string | number;
  title: string;
  destination?: string | null;
  status?: string | null;
}

export const createInitialPromotionForm = (): PromotionFormState => ({
  discount_type: "percent",
  value: "",
  max_usage: "",
  valid_from: "",
  valid_to: "",
  description: "",
  is_active: true,
});

export const defaultPromotionFilters: PromotionFilters = {
  search: "",
  status: "all",
  discountType: "all",
  dateRange: null,
};

const extractTours = (payload: unknown): unknown[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload === "object") {
    const candidate = payload as Record<string, unknown>;
    if (Array.isArray(candidate.data)) return candidate.data;
    if (Array.isArray(candidate.tours)) return candidate.tours;
    if (candidate.data && typeof candidate.data === "object") {
      const nested = candidate.data as Record<string, unknown>;
      if (Array.isArray(nested.data)) return nested.data;
      if (Array.isArray(nested.tours)) return nested.tours;
    }
  }
  return [];
};

const normalizeTourSummary = (record: unknown): PartnerTourSummary | null => {
  if (!record || typeof record !== "object") return null;
  const payload = record as Record<string, unknown>;
  const rawId = payload.id ?? payload.uuid ?? payload.code ?? payload.slug;
  if (rawId === undefined || rawId === null) return null;
  const id =
    typeof rawId === "string" || typeof rawId === "number"
      ? rawId
      : typeof rawId === "object" && rawId !== null && "toString" in rawId
      ? String(rawId)
      : null;
  if (id === null) return null;
  const titleSource = payload.title ?? payload.name ?? `Tour ${String(id)}`;
  const title =
    typeof titleSource === "string" && titleSource.trim()
      ? titleSource.trim()
      : `Tour ${String(id)}`;

  return {
    id,
    title,
    destination: typeof payload.destination === "string" ? payload.destination : null,
    status:
      typeof payload.status === "string"
        ? payload.status
        : typeof payload.state === "string"
        ? payload.state
        : null,
  };
};

const toFormState = (promotion: PartnerPromotion): PromotionFormState => ({
  discount_type:
    (promotion.discount_type as PromotionDiscountType) && promotion.discount_type !== "percentage"
      ? (promotion.discount_type as PromotionDiscountType)
      : "percent",
  value:
    promotion.value !== undefined && promotion.value !== null ? String(promotion.value) : "",
  max_usage:
    promotion.max_usage !== undefined && promotion.max_usage !== null
      ? String(promotion.max_usage)
      : "",
  valid_from: promotion.valid_from ? promotion.valid_from.slice(0, 10) : "",
  valid_to: promotion.valid_to ? promotion.valid_to.slice(0, 10) : "",
  description: promotion.description ?? "",
  is_active: promotion.is_active ?? true,
});

const buildPayloadFromForm = (
  form: PromotionFormState,
  value: number,
): PartnerPromotionPayload => ({
  discount_type: form.discount_type === "percentage" ? "percent" : form.discount_type,
  value,
  max_usage: form.max_usage ? Number(form.max_usage) || 0 : undefined,
  valid_from: form.valid_from || undefined,
  valid_to: form.valid_to || undefined,
  description: form.description?.trim() || undefined,
  is_active: form.is_active,
});

const promotionMatchesFilters = (
  promotion: PartnerPromotion,
  filters: PromotionFilters,
): boolean => {
  const { search, status, discountType, dateRange } = filters;
  const normalizedSearch = search.trim().toLowerCase();

  if (normalizedSearch) {
    const haystack = [
      promotion.code,
      promotion.description,
      promotion.tour_id ? String(promotion.tour_id) : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(normalizedSearch)) {
      return false;
    }
  }

  if (discountType !== "all") {
    const normalizedType = promotion.discount_type?.toString().toLowerCase();
    if (normalizedType !== discountType) {
      return false;
    }
  }

  if (status !== "all") {
    const now = Date.now();
    const start = promotion.valid_from ? Date.parse(promotion.valid_from) : null;
    const end = promotion.valid_to ? Date.parse(promotion.valid_to) : null;
    const isActive = Boolean(promotion.is_active);
    const isUpcoming = start !== null && start > now;
    const isExpired = end !== null && end < now;

    if (status === "active" && (!isActive || isExpired || isUpcoming)) return false;
    if (status === "inactive" && isActive) return false;
    if (status === "upcoming" && !isUpcoming) return false;
    if (status === "expired" && !isExpired) return false;
  }

  if (dateRange) {
    const from = dateRange.from ? Date.parse(dateRange.from) : null;
    const to = dateRange.to ? Date.parse(dateRange.to) : null;
    const promoStart = promotion.valid_from ? Date.parse(promotion.valid_from) : null;
    const promoEnd = promotion.valid_to ? Date.parse(promotion.valid_to) : null;

    if (from !== null && (promoEnd === null || promoEnd < from)) return false;
    if (to !== null && (promoStart === null || promoStart > to)) return false;
  }

  return true;
};

export const resolvePromotionTypeText = (type?: string | null) => {
  const normalized = type?.toString().toLowerCase();
  if (normalized === "fixed") return "Giảm cố định";
  if (normalized === "percent" || normalized === "percentage") return "Giảm theo %";
  return "Khuyến mãi";
};

export const resolvePromotionValueText = (promotion: PartnerPromotion) => {
  const numericValue =
    typeof promotion.value === "number" && Number.isFinite(promotion.value)
      ? promotion.value
      : 0;
  const normalized = promotion.discount_type?.toString().toLowerCase();
  if (normalized === "fixed") {
    return `${numericValue.toLocaleString("vi-VN")}₫`;
  }
  return `${numericValue}%`;
};

export const formatPromotionDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("vi-VN");
};

export const usePartnerPromotions = (
  options: UsePartnerPromotionsOptions = {},
) => {
  const { initialTourId = null, autoFetch = true } = options;
  const { toast } = useToast();

  const [tours, setTours] = useState<PartnerTourSummary[]>([]);
  const [isToursLoading, setIsToursLoading] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState<string | number | null>(
    initialTourId ?? null,
  );
  const [promotions, setPromotions] = useState<PartnerPromotion[]>([]);
  const promotionCacheRef = useRef<Record<string, PartnerPromotion[]>>({});
  const [isListLoading, setIsListLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PartnerPromotion | null>(null);
  const [formState, setFormState] = useState<PromotionFormState>(() =>
    createInitialPromotionForm(),
  );
  const [filters, setFilters] = useState<PromotionFilters>(defaultPromotionFilters);

  const filteredPromotions = useMemo(
    () => promotions.filter((promotion) => promotionMatchesFilters(promotion, filters)),
    [promotions, filters],
  );

  const selectTour = useCallback((tourId: string | number | null) => {
    setSelectedTourId(tourId);
    setFilters((prev) => ({ ...prev }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState(createInitialPromotionForm());
    setEditingPromotion(null);
  }, []);

  const handleFormChange = useCallback(
    <K extends keyof PromotionFormState>(field: K, value: PromotionFormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const loadTours = useCallback(async () => {
    setIsToursLoading(true);
    try {
      const res = await apiClient.get(PARTNER_TOUR_ENDPOINT);
      const raw = extractTours(res.data);
      const normalized = raw
        .map(normalizeTourSummary)
        .filter((tour): tour is PartnerTourSummary => Boolean(tour));
      setTours(normalized);
      setSelectedTourId((prev) => {
        if (prev !== null && prev !== undefined) {
          return prev;
        }
        return normalized.length > 0 ? normalized[0].id : prev;
      });
    } catch (error) {
      console.error("Không thể tải danh sách tour:", error);
      toast({
        title: "Lỗi tải tour",
        description: "Không thể tải danh sách tour, vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsToursLoading(false);
    }
  }, [toast]);

  const loadPromotions = useCallback(
    async (tourId?: string | number | null, opts: { skipCache?: boolean } = {}) => {
      const id = tourId ?? selectedTourId;
      if (!id) {
        setPromotions([]);
        return;
      }
      const cacheKey = String(id);
      const cached = promotionCacheRef.current[cacheKey];
      if (!opts.skipCache && cached) {
        setPromotions(cached);
      }
      setIsListLoading(true);
      try {
        const data = await fetchPartnerPromotions(id);
        setPromotions(data);
        promotionCacheRef.current = { ...promotionCacheRef.current, [cacheKey]: data };
      } catch (error) {
        console.error("Không thể tải khuyến mãi:", error);
        toast({
          title: "Lỗi tải khuyến mãi",
          description: "Không thể tải danh sách khuyến mãi, vui lòng thử lại.",
          variant: "destructive",
        });
      } finally {
        setIsListLoading(false);
      }
    },
    [selectedTourId, toast],
  );

  useEffect(() => {
    if (autoFetch) {
      void loadTours();
    }
  }, [autoFetch, loadTours]);

  useEffect(() => {
    if (!selectedTourId) {
      setPromotions([]);
      return;
    }
    if (autoFetch) {
      void loadPromotions(selectedTourId);
    }
  }, [selectedTourId, autoFetch, loadPromotions]);

  const startEditPromotion = useCallback((promotion: PartnerPromotion) => {
    setEditingPromotion(promotion);
    setFormState(toFormState(promotion));
  }, []);

  const startClonePromotion = useCallback((promotion: PartnerPromotion) => {
    setEditingPromotion(null);
    setFormState(toFormState(promotion));
  }, []);

  const savePromotion = useCallback(
    async (overrideTourId?: string | number | null) => {
      const tourId = overrideTourId ?? selectedTourId;
      const numericValue = Number(formState.value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        toast({
          title: "Giá trị khuyến mãi chưa hợp lệ",
          description: "Vui lòng nhập số lớn hơn 0.",
          variant: "destructive",
        });
        throw new Error("Invalid promotion value");
      }
      if (!editingPromotion && !tourId) {
        toast({
          title: "Chưa chọn tour",
          description: "Vui lòng chọn tour trước khi tạo khuyến mãi.",
          variant: "destructive",
        });
        throw new Error("Missing tour id");
      }

      const payload = buildPayloadFromForm(formState, numericValue);
      setIsSaving(true);
      try {
        if (editingPromotion?.id) {
          await updatePartnerPromotion(editingPromotion.id, payload);
          toast({
            title: "Đã cập nhật khuyến mãi",
            description: "Thông tin khuyến mãi đã được lưu.",
          });
        } else if (tourId) {
          await createPartnerPromotion({ ...payload, tour_id: tourId });
          toast({
            title: "Đã tạo khuyến mãi",
            description: "Khuyến mãi mới đã được thêm.",
          });
        }
        resetForm();
        if (tourId) {
          await loadPromotions(tourId, { skipCache: true });
        }
      } catch (error) {
        console.error("Không thể lưu khuyến mãi:", error);
        toast({
          title: "Lỗi lưu khuyến mãi",
          description: "Vui lòng thử lại sau.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [editingPromotion, formState, selectedTourId, toast, resetForm, loadPromotions],
  );

  const removePromotion = useCallback(
    async (promotion: PartnerPromotion) => {
      if (!promotion?.id) return;
      setIsSaving(true);
      try {
        await deletePartnerPromotion(promotion.id);
        toast({
          title: "Đã xoá khuyến mãi",
          description: "Khuyến mãi đã được xoá.",
        });
        if (selectedTourId) {
          await loadPromotions(selectedTourId, { skipCache: true });
        }
      } catch (error) {
        console.error("Không thể xoá khuyến mãi:", error);
        toast({
          title: "Lỗi xoá khuyến mãi",
          description: "Vui lòng thử lại sau.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [selectedTourId, toast, loadPromotions],
  );

  const togglePromotion = useCallback(
    async (promotion: PartnerPromotion, nextState: boolean) => {
      if (!promotion?.id) return;
      setIsSaving(true);
      try {
        await updatePartnerPromotion(promotion.id, {
          discount_type:
            (promotion.discount_type as PromotionDiscountType) === "fixed" ? "fixed" : "percent",
          value: promotion.value ?? 0,
          max_usage: promotion.max_usage,
          valid_from: promotion.valid_from ?? undefined,
          valid_to: promotion.valid_to ?? undefined,
          description: promotion.description ?? undefined,
          is_active: nextState,
        });
        toast({
          title: nextState ? "Đã bật khuyến mãi" : "Đã tắt khuyến mãi",
        });
        if (selectedTourId) {
          await loadPromotions(selectedTourId, { skipCache: true });
        }
      } catch (error) {
        console.error("Không thể cập nhật trạng thái khuyến mãi:", error);
        toast({
          title: "Lỗi cập nhật",
          description: "Không thể cập nhật trạng thái khuyến mãi.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [selectedTourId, toast, loadPromotions],
  );

  return {
    tours,
    isToursLoading,
    loadTours,
    selectedTourId,
    selectTour,
    promotions,
    filteredPromotions,
    loadPromotions,
    isListLoading,
    isSaving,
    filters,
    setFilters,
    resetForm,
    formState,
    handleFormChange,
    editingPromotion,
    startEditPromotion,
    startClonePromotion,
    savePromotion,
    removePromotion,
    togglePromotion,
  };
};
