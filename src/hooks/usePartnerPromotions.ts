import { useState, useEffect, useCallback, useMemo } from "react";

import {
  createPartnerPromotion,
  deletePartnerPromotion,
  fetchPartnerPromotions,
  updatePartnerPromotion,
  type PartnerPromotion,
  type PartnerPromotionPayload,
  type PartnerPromotionType,
  type PartnerPromotionTourSummary,
  type PartnerPromotionListQuery,
} from "@/services/partnerApi";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

const PARTNER_TOUR_ENDPOINT = "/partner/tours";

export type PromotionDiscountType = "percent" | "percentage" | "fixed";

export interface PromotionFormState {
  type: PartnerPromotionType;
  discount_type: PromotionDiscountType;
  value: string;
  max_usage: string;
  valid_from: string;
  valid_to: string;
  description: string;
  is_active: boolean;
  tour_ids: string[];
  auto_issue_on_cancel: boolean;
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
  promotionType: "all" | PartnerPromotionType;
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
  type: "auto",
  discount_type: "percent",
  value: "",
  max_usage: "",
  valid_from: "",
  valid_to: "",
  description: "",
  is_active: true,
  tour_ids: [],
  auto_issue_on_cancel: false,
});

export const defaultPromotionFilters: PromotionFilters = {
  search: "",
  status: "all",
  discountType: "all",
  promotionType: "all",
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

const normalizePromotionType = (type?: unknown): PartnerPromotionType => {
  return type === "voucher" ? "voucher" : "auto";
};

const extractTourIds = (promotion: PartnerPromotion): string[] => {
  const ids = new Set<string>();
  if (Array.isArray(promotion.tour_ids)) {
    promotion.tour_ids.forEach((id) => {
      if (id !== undefined && id !== null) {
        ids.add(String(id));
      }
    });
  }
  if (promotion.tour_id !== undefined && promotion.tour_id !== null) {
    ids.add(String(promotion.tour_id));
  }
  if (Array.isArray(promotion.tours)) {
    (promotion.tours as PartnerPromotionTourSummary[]).forEach((tour) => {
      if (tour?.id !== undefined && tour.id !== null) {
        ids.add(String(tour.id));
      }
    });
  }
  return Array.from(ids);
};

const toFormState = (promotion: PartnerPromotion): PromotionFormState => ({
  type: normalizePromotionType(promotion.type),
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
  tour_ids: extractTourIds(promotion),
  auto_issue_on_cancel: Boolean(promotion.auto_issue_on_cancel),
});

const buildPayloadFromForm = (
  form: PromotionFormState,
  value: number,
): PartnerPromotionPayload => {
  const tourIds = (form.tour_ids ?? []).map((id) => {
    if (id === null || id === undefined) return null;
    const numeric = Number(id);
    if (Number.isFinite(numeric)) return numeric;
    return id;
  });
  const sanitizedTourIds = tourIds.filter((value): value is string | number => value !== null);

  return {
    type: form.type,
    discount_type: form.discount_type === "percentage" ? "percent" : form.discount_type,
    value,
    tour_ids: sanitizedTourIds,
    max_usage: form.max_usage ? Number(form.max_usage) || 0 : undefined,
    valid_from: form.valid_from || undefined,
    valid_to: form.valid_to || undefined,
    description: form.description?.trim() || undefined,
    is_active: form.is_active,
    auto_issue_on_cancel: form.auto_issue_on_cancel,
  };
};

const promotionMatchesFilters = (
  promotion: PartnerPromotion,
  filters: PromotionFilters,
): boolean => {
  const { search, status, discountType, dateRange, promotionType } = filters;
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

  if (promotionType !== "all") {
    const normalizedPromotionType = normalizePromotionType(promotion.type);
    if (normalizedPromotionType !== promotionType) {
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

  const resetForm = useCallback((defaults?: Partial<PromotionFormState>) => {
    setFormState({ ...createInitialPromotionForm(), ...(defaults ?? {}) });
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
    async (overrideQuery?: PartnerPromotionListQuery) => {
      const query: PartnerPromotionListQuery = {};
      const resolvedType =
        overrideQuery?.type ??
        (filters.promotionType !== "all" ? filters.promotionType : undefined);
      if (resolvedType) {
        query.type = resolvedType;
      }
      const resolvedTourId =
        overrideQuery?.tour_id ?? (selectedTourId !== null ? selectedTourId : undefined);
      if (resolvedTourId !== undefined && resolvedTourId !== null) {
        query.tour_id = resolvedTourId;
      }

      setIsListLoading(true);
      try {
        const data = await fetchPartnerPromotions(query);
        setPromotions(data);
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
    [filters.promotionType, selectedTourId, toast],
  );

  useEffect(() => {
    if (autoFetch) {
      void loadTours();
    }
  }, [autoFetch, loadTours]);

  useEffect(() => {
    if (autoFetch) {
      void loadPromotions();
    }
  }, [autoFetch, loadPromotions]);

  const startEditPromotion = useCallback((promotion: PartnerPromotion) => {
    setEditingPromotion(promotion);
    setFormState(toFormState(promotion));
  }, []);

  const startClonePromotion = useCallback((promotion: PartnerPromotion) => {
    setEditingPromotion(null);
    setFormState(toFormState(promotion));
  }, []);

  const savePromotion = useCallback(async () => {
    const numericValue = Number(formState.value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast({
        title: "Giá trị khuyến mãi chưa hợp lệ",
        description: "Vui lòng nhập số lớn hơn 0.",
        variant: "destructive",
      });
      throw new Error("Invalid promotion value");
    }

    const effectiveTourIds =
      formState.tour_ids.length > 0
        ? formState.tour_ids
        : selectedTourId !== null && selectedTourId !== undefined
        ? [String(selectedTourId)]
        : [];

    if (effectiveTourIds.length === 0) {
      toast({
        title: "Chưa chọn tour áp dụng",
        description: "Vui lòng chọn ít nhất một tour để áp dụng khuyến mãi.",
        variant: "destructive",
      });
      throw new Error("Missing tour ids");
    }

    const payload = buildPayloadFromForm({ ...formState, tour_ids: effectiveTourIds }, numericValue);
    setIsSaving(true);
    try {
      if (editingPromotion?.id) {
        await updatePartnerPromotion(editingPromotion.id, payload);
        toast({
          title: "Đã cập nhật khuyến mãi",
          description: "Thông tin khuyến mãi đã được lưu.",
        });
      } else {
        await createPartnerPromotion(payload);
        toast({
          title: "Đã tạo khuyến mãi",
          description: "Khuyến mãi mới đã được thêm.",
        });
      }
      resetForm({ tour_ids: effectiveTourIds });
      await loadPromotions();
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
  }, [editingPromotion, formState, selectedTourId, toast, resetForm, loadPromotions]);

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
        await loadPromotions();
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
    [toast, loadPromotions],
  );

  const togglePromotion = useCallback(
    async (promotion: PartnerPromotion, nextState: boolean) => {
      if (!promotion?.id) return;
      setIsSaving(true);
      try {
        const currentTourIds = extractTourIds(promotion);
        if (currentTourIds.length === 0 && selectedTourId !== null && selectedTourId !== undefined) {
          currentTourIds.push(String(selectedTourId));
        }
        await updatePartnerPromotion(promotion.id, {
          type: normalizePromotionType(promotion.type),
          discount_type:
            (promotion.discount_type as PromotionDiscountType) === "fixed" ? "fixed" : "percent",
          value: promotion.value ?? 0,
          tour_ids: currentTourIds,
          max_usage: promotion.max_usage,
          valid_from: promotion.valid_from ?? undefined,
          valid_to: promotion.valid_to ?? undefined,
          description: promotion.description ?? undefined,
          is_active: nextState,
          auto_issue_on_cancel: Boolean(promotion.auto_issue_on_cancel),
        });
        toast({
          title: nextState ? "Đã bật khuyến mãi" : "Đã tắt khuyến mãi",
        });
        await loadPromotions();
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
