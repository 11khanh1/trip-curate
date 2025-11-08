import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  List,
  Image,
  Calendar,
  Loader2,
  Eye,
  Send,
  ChevronLeft,
  ChevronRight,
  Shield,
  Gift,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
  createPartnerPromotion,
  deletePartnerPromotion,
  fetchPartnerPromotions,
  updatePartnerPromotion,
  type PartnerPromotion,
} from "@/services/partnerApi";

const PARTNER_TOUR_ENDPOINT = "/partner/tours";

// ---------------------------- INTERFACES ----------------------------
type ItineraryType = "single-day" | "multi-day";

interface ItineraryItem {
  day: number;
  title: string;
  detail: string;
}

interface Tour {
  id: string;
  title: string;
  description: string;
  destination: string;
  base_price: number;
  policy: string;
  tags: string[];
  media: string[];
  itinerary: string[];
  itinerary_type?: ItineraryType | string | null;
  type?: string | null;
  child_age_limit?: number | null;
  requires_passport?: boolean;
  requires_visa?: boolean;
  schedule?: {
    id?: string;
    start_date: string;
    end_date: string;
    seats_total: number;
    seats_available: number;
    season_price: number;
    min_participants?: number | null;
  } | null;
  schedules?: Array<{
    id?: string;
    start_date?: string | null;
    end_date?: string | null;
    seats_total?: number | null;
    seats_available?: number | null;
    season_price?: number | null;
    min_participants?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
  }>;
  packages?: Array<{
    id?: string;
    name?: string | null;
    description?: string | null;
    adult_price?: number | null;
    child_price?: number | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  }>;
  cancellation_policies?: Array<{
    id?: string;
    days_before?: number | null;
    refund_rate?: number | null;
    description?: string | null;
  }>;
  categories?: Array<{
    id?: string;
    name?: string | null;
    slug?: string | null;
  }>;
  status: "pending" | "approved" | "rejected" | "draft";
}

type FormSchedule = {
  id?: string;
  start_date: string;
  end_date: string;
  seats_total: number;
  seats_available: number;
  season_price: number;
  min_participants: number;
};

type FormPackage = {
  id?: string;
  name: string;
  description: string;
  adult_price: number;
  child_price: number;
  is_active: boolean;
};

type FormCancellationPolicy = {
  id?: string;
  days_before: number;
  refund_rate: number;
  description: string;
};

type FormCategory = {
  id?: string;
  name: string;
  slug: string;
};

// IMPROVEMENT: Tách riêng FormData để quản lý state của form dễ dàng hơn
type FormData = {
  title: string;
  description: string;
  destination: string;
  base_price: number;
  policy: string;
  tagsString: string;
  imageUrlsString: string;
  itineraryItems: ItineraryItem[];
  itineraryType: ItineraryType;
  type: string;
  child_age_limit: number | null;
  requires_passport: boolean;
  requires_visa: boolean;
  status: string;
  schedules: FormSchedule[];
  packages: FormPackage[];
  cancellationPolicies: FormCancellationPolicy[];
  categories: FormCategory[];
};

type PromotionFormState = {
  discount_type: "percent" | "percentage" | "fixed";
  value: string;
  max_usage: string;
  valid_from: string;
  valid_to: string;
  description: string;
  is_active: boolean;
};

const createInitialPromotionForm = (): PromotionFormState => ({
  discount_type: "percent",
  value: "",
  max_usage: "",
  valid_from: "",
  valid_to: "",
  description: "",
  is_active: true,
});

const createInitialFormData = (): FormData => ({
  title: "",
  description: "",
  destination: "",
  base_price: 4500000,
  policy: "",
  tagsString: "",
  imageUrlsString: "",
  itineraryItems: [{ day: 1, title: "", detail: "" }],
  itineraryType: "multi-day",
  type: "domestic",
  child_age_limit: null,
  requires_passport: false,
  requires_visa: false,
  status: "pending",
  schedules: [
    {
      start_date: "",
      end_date: "",
      seats_total: 0,
      seats_available: 0,
      season_price: 0,
      min_participants: 1,
    },
  ],
  packages: [
    {
      name: "Gói tiêu chuẩn",
      description: "",
      adult_price: 4500000,
      child_price: 3000000,
      is_active: true,
    },
  ],
  cancellationPolicies: [
    {
      days_before: 7,
      refund_rate: 50,
      description: "Hoàn 50% phí nếu hủy trước 7 ngày.",
    },
  ],
  categories: [
    {
      name: "",
      slug: "",
    },
  ],
});

export default function PartnerActivities() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const baseFormDefaults = useMemo(() => createInitialFormData(), []);
  const [formData, setFormData] = useState<FormData>(() => createInitialFormData());
  const [promotionForm, setPromotionForm] = useState<PromotionFormState>(createInitialPromotionForm());
  const [editingPromotion, setEditingPromotion] = useState<PartnerPromotion | null>(null);
  const [partnerPromotions, setPartnerPromotions] = useState<PartnerPromotion[]>([]);
  const [promotionTourId, setPromotionTourId] = useState<string | number | null>(null);
  const [isPromotionLoading, setIsPromotionLoading] = useState(false);
  const [isPromotionSaving, setIsPromotionSaving] = useState(false);

  // Giả lập hàm toast để code chạy được
  const toast = ({ title, description, variant }: any) => {
    console.log(`[TOAST - ${variant || "default"}]: ${title} - ${description}`);
    alert(`${title}: ${description}`);
  };

  const mediaList = useMemo(() => {
    if (!selectedTour || !Array.isArray(selectedTour.media)) return [];
    return selectedTour.media
      .map((url) => (typeof url === "string" ? url.trim() : ""))
      .filter((url, idx, arr) => url && arr.indexOf(url) === idx);
  }, [selectedTour]);

  useEffect(() => {
    if (!isDetailOpen) {
      setSelectedImageIndex(0);
      return;
    }
    if (!mediaList.length) {
      setSelectedImageIndex(0);
    } else {
      setSelectedImageIndex((prev) => (prev < mediaList.length ? prev : 0));
    }
  }, [isDetailOpen, mediaList]);

  const loadPromotions = useCallback(
    async (tourId: string | number) => {
      setIsPromotionLoading(true);
      try {
        const data = await fetchPartnerPromotions(tourId);
        setPartnerPromotions(data);
      } catch (error) {
        console.error("Không thể tải khuyến mãi:", error);
        toast({
          title: "Lỗi tải khuyến mãi",
          description:
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setIsPromotionLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (editingTour?.id) {
      setPromotionTourId(editingTour.id);
    }
  }, [editingTour?.id]);

  useEffect(() => {
    if (promotionTourId) {
      setPromotionForm(createInitialPromotionForm());
      setEditingPromotion(null);
      void loadPromotions(promotionTourId);
    } else {
      setPartnerPromotions([]);
    }
  }, [promotionTourId, loadPromotions]);

  // ---------------------------- UTILS & API ----------------------------

  const resolvePromotionTypeText = (type?: string | null) => {
    const normalized = type?.toString().toLowerCase();
    if (normalized === "fixed") return "Giảm cố định";
    if (normalized === "percent" || normalized === "percentage") return "Giảm theo %";
    return "Khuyến mãi";
  };

  const resolvePromotionValueText = (promotion: PartnerPromotion) => {
    const numericValue =
      typeof promotion.value === "number" && Number.isFinite(promotion.value) ? promotion.value : 0;
    const normalized = promotion.discount_type?.toString().toLowerCase();
    if (normalized === "fixed") {
      return `${numericValue.toLocaleString("vi-VN")}₫`;
    }
    return `${numericValue}%`;
  };

  const formatPromotionDate = (value?: string | null) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("vi-VN");
  };

  // Chuẩn hoá dữ liệu trả về từ API (tags text[], media/itinerary jsonb, schedule có thể null)
  const toStringArray = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return (value as unknown[])
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object" && typeof (item as Record<string, unknown>).url === "string") {
            return ((item as Record<string, unknown>).url as string).trim();
          }
          return "";
        })
        .filter((s) => Boolean(s));
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          return toStringArray(parsed);
        } catch {
          return trimmed.split(/\s*,\s*/).filter(Boolean);
        }
      }
      return trimmed.split(/\s*,\s*/).filter(Boolean);
    }
    return [];
  };

  const coerceNumber = (value: unknown, fallback: number | null = null): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const coerceBoolean = (value: unknown, fallback = false): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return fallback;
      if (["1", "true", "yes", "y"].includes(normalized)) return true;
      if (["0", "false", "no", "n"].includes(normalized)) return false;
    }
    return fallback;
  };

  const normalizeSchedule = (raw: any) => {
    if (!raw || typeof raw !== "object") return null;
    return {
      id: raw.id ? String(raw.id) : undefined,
      start_date: raw.start_date ? String(raw.start_date) : "",
      end_date: raw.end_date ? String(raw.end_date) : "",
    seats_total: coerceNumber(raw.seats_total, 0) ?? 0,
    seats_available: coerceNumber(raw.seats_available, 0) ?? 0,
    season_price: coerceNumber(raw.season_price, 0) ?? 0,
    min_participants: coerceNumber(raw.min_participants, 1) ?? 1,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    updated_at: raw.updated_at ? String(raw.updated_at) : undefined,
  };
};

  const normalizeTourFromAPI = (t: any): Tour => {
    const media = toStringArray(t.media);
    const itineraryRaw = Array.isArray(t.itinerary) ? t.itinerary : toStringArray(t.itinerary);
    const schedulesArray = Array.isArray(t.schedules) ? t.schedules.map(normalizeSchedule).filter(Boolean) : [];
    const fallbackSchedule = normalizeSchedule(t.schedule);
    const primarySchedule = schedulesArray.length > 0 ? schedulesArray[0] : fallbackSchedule;

    const itineraryStrings = Array.isArray(itineraryRaw)
      ? itineraryRaw.map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            const day = coerceNumber(record.day) ?? null;
            const title = typeof record.title === "string" ? record.title : typeof record.name === "string" ? record.name : "";
            const detail =
              typeof record.detail === "string"
                ? record.detail
                : typeof record.description === "string"
                ? record.description
                : "";
            const prefix = day !== null ? `Ngày ${day}: ` : "";
            return `${prefix}${title}${detail ? ` - ${detail}` : ""}`.trim();
          }
          return "";
        })
      : [];

    const rawItineraryType =
      typeof t.itinerary_type === "string" ? t.itinerary_type.toLowerCase().trim() : null;
    const normalizedItineraryType: ItineraryType | null =
      rawItineraryType === "single-day" || rawItineraryType === "multi-day"
        ? (rawItineraryType as ItineraryType)
        : null;

    return {
      id: String(t.id ?? t.uuid ?? ""),
      title: t.title || "",
      description: t.description || "",
      destination: t.destination || "",
      base_price: Number(t.base_price ?? 0),
      policy: t.policy || "",
      tags: toStringArray(t.tags),
      media,
      itinerary: itineraryStrings.filter(Boolean),
      itinerary_type: normalizedItineraryType,
      schedule: primarySchedule,
      schedules: schedulesArray.length > 0 ? (schedulesArray as NonNullable<typeof schedulesArray>) : fallbackSchedule ? [fallbackSchedule] : [],
      packages: Array.isArray(t.packages) ? (t.packages as any[]).map((pkg) => ({
        id: pkg?.id ? String(pkg.id) : undefined,
        name: typeof pkg?.name === "string" ? pkg.name : null,
        description: typeof pkg?.description === "string" ? pkg.description : null,
        adult_price: coerceNumber(pkg?.adult_price, null),
        child_price: coerceNumber(pkg?.child_price, null),
        is_active: coerceBoolean(pkg?.is_active, true),
        created_at: pkg?.created_at ? String(pkg.created_at) : null,
        updated_at: pkg?.updated_at ? String(pkg.updated_at) : null,
      })) : [],
      cancellation_policies: Array.isArray(t.cancellation_policies)
        ? (t.cancellation_policies as any[]).map((policy) => ({
            id: policy?.id ? String(policy.id) : undefined,
            days_before: coerceNumber(policy?.days_before, null),
            refund_rate: coerceNumber(policy?.refund_rate, null),
            description: typeof policy?.description === "string" ? policy.description : null,
          }))
        : [],
      categories: Array.isArray(t.categories)
        ? (t.categories as any[]).map((category) => ({
            id: category?.id ? String(category.id) : undefined,
            name: typeof category?.name === "string" ? category.name : null,
            slug: typeof category?.slug === "string" ? category.slug : null,
          }))
        : [],
      type: typeof t.type === "string" ? t.type : null,
      child_age_limit: coerceNumber(t.child_age_limit, null),
      requires_passport: coerceBoolean(t.requires_passport, false),
      requires_visa: coerceBoolean(t.requires_visa, false),
      status: (t.status as Tour["status"]) || "pending",
    };
  };

const extractToursFromResponse = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.tours)) return payload.tours;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.tours)) return payload.data.tours;
  return [];
};

const fetchTours = async () => {
  setIsLoading(true);
  try {
    const res = await apiClient.get(PARTNER_TOUR_ENDPOINT);
    const raw = extractToursFromResponse(res.data);
    const normalized: Tour[] = raw.map(normalizeTourFromAPI);
    setTours(normalized);
  } catch (err: any) {
    console.error("Error fetching tours:", err);
    toast({
      title: "Lỗi tải Tour",
      description: err?.response?.data?.message || "Không thể tải danh sách tour.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => { fetchTours(); }, []);
  
  const parseItineraryString = (itinerary: unknown): ItineraryItem[] => {
    if (!Array.isArray(itinerary) || itinerary.length === 0) {
      return [{ day: 1, title: "Hành trình đang cập nhật", detail: "Chưa có thông tin chi tiết." }];
    }

    return itinerary.map((entry, index) => {
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const day = coerceNumber(record.day, index + 1) ?? index + 1;
        const title =
          typeof record.title === "string"
            ? record.title
            : typeof record.name === "string"
            ? record.name
            : `Hoạt động ngày ${day}`;
        const detail =
          typeof record.detail === "string"
            ? record.detail
            : typeof record.description === "string"
            ? record.description
            : "Chưa có chi tiết.";
        return {
          day,
          title: title || `Hoạt động ngày ${day}`,
          detail,
        };
      }

      if (typeof entry === "string") {
        const trimmed = entry.trim();
        if (!trimmed) {
          return {
            day: index + 1,
            title: `Hoạt động ngày ${index + 1}`,
            detail: "Chưa có chi tiết.",
          };
        }

        const dayPattern = /^ngày\s*(\d+)\s*[:-]?\s*/i;
        const dayMatch = trimmed.match(dayPattern);
        const day = dayMatch ? parseInt(dayMatch[1], 10) : index + 1;
        const withoutPrefix = dayMatch ? trimmed.replace(dayPattern, "") : trimmed;

        const hyphenParts = withoutPrefix.split(" - ");
        let titleCandidate = hyphenParts[0]?.trim() ?? "";
        let detailCandidate = hyphenParts.slice(1).join(" - ").trim();

        if (!detailCandidate && withoutPrefix.includes(":")) {
          const colonParts = withoutPrefix.split(":");
          titleCandidate = (colonParts[0] ?? titleCandidate).trim();
          detailCandidate = colonParts.slice(1).join(":").trim();
        }

        return {
          day,
          title: titleCandidate || (dayMatch ? `Ngày ${day}` : `Hoạt động ${index + 1}`),
          detail: detailCandidate || "Chưa có chi tiết.",
        };
      }

      return {
        day: index + 1,
        title: `Hoạt động ngày ${index + 1}`,
        detail: "Chưa có chi tiết.",
      };
    });
  };

  const detectItineraryType = (items: ItineraryItem[]): ItineraryType => {
    if (!items || items.length === 0) return "multi-day";
    const timePattern = /^([01]?\d|2[0-3])(:[0-5]\d)?(\s*(am|pm))?$/i;
    const normalizedTitles = items.map((item) => (item.title || "").trim().toLowerCase());
    const allTimes = normalizedTitles.length > 0
      && normalizedTitles.every((title) => timePattern.test(title) && !title.startsWith("ngày"));
    if (allTimes) {
      return "single-day";
    }

    const hasExplicitDay =
      normalizedTitles.some((title) => title.startsWith("ngày")) || items.some((item) => (item.day ?? 1) > 1);

    if (hasExplicitDay) {
      return "multi-day";
    }

    return items.length > 1 ? "multi-day" : "single-day";
  };

  const selectedTourItineraryItems = selectedTour
    ? parseItineraryString(selectedTour.itinerary)
    : [];

  const selectedTourItineraryType: ItineraryType =
    selectedTour &&
    (selectedTour.itinerary_type === "single-day" || selectedTour.itinerary_type === "multi-day")
      ? (selectedTour.itinerary_type as ItineraryType)
      : detectItineraryType(selectedTourItineraryItems);

  const postTour = async (payload: any, isEdit = false, id?: string) => {
    setIsSubmitting(true);
    try {
      const url = isEdit && id ? `${PARTNER_TOUR_ENDPOINT}/${id}` : PARTNER_TOUR_ENDPOINT;
      const method = isEdit ? "put" : "post";

      const res = await apiClient.request({
        method: method,
        url: url,
        data: payload,
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast({
        title: "Thành công",
        description: res.data.message || (isEdit ? "Tour đã được cập nhật." : "Tour đã được tạo."),
      });

      await fetchTours();
      setEditingTour(null);
      setFormData(createInitialFormData());
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || `Không thể ${isEdit ? "cập nhật" : "tạo"} tour.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTourForApproval = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn gửi yêu cầu duyệt tour này không?")) return;
    try {
      await apiClient.put(
        `${PARTNER_TOUR_ENDPOINT}/${id}`,
        { status: 'pending' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast({
        title: "Gửi duyệt thành công",
        description: "Tour đã chuyển sang trạng thái 'Chờ duyệt'.",
      });

      await fetchTours();
    } catch (err: any) {
      console.error("Error submitting tour:", err);
      toast({
        title: "Lỗi gửi yêu cầu",
        description: err.response?.data?.message || "Không thể gửi yêu cầu duyệt tour.",
        variant: "destructive",
      });
    }
  }


  const handleDeleteTour = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tour này không?")) {
        try {
            await apiClient.delete(`${PARTNER_TOUR_ENDPOINT}/${id}`);
            toast({ title: "Xóa thành công", description: "Tour đã bị xóa." });
            setTours((prev) => prev.filter((t) => t.id !== id));
        } catch (err: any) {
            console.error("Error deleting tour:", err);
            toast({
                title: "Lỗi xóa Tour",
                description: err.response?.data?.message || "Không thể xóa tour.",
                variant: "destructive",
            });
        }
    }
  };
  
  // ---------------------------- EFFECTS ----------------------------

  useEffect(() => {
    fetchTours();
  }, []); 

  useEffect(() => {
    const defaults = baseFormDefaults;
    if (editingTour) {
      const parsedItinerary = parseItineraryString(editingTour.itinerary);
      const schedulesForForm: FormSchedule[] =
        Array.isArray(editingTour.schedules) && editingTour.schedules.length > 0
          ? editingTour.schedules.map((schedule) => ({
              id: schedule?.id ? String(schedule.id) : undefined,
              start_date: schedule?.start_date ? String(schedule.start_date).split("T")[0] : "",
              end_date: schedule?.end_date ? String(schedule.end_date).split("T")[0] : "",
              seats_total: Number(schedule?.seats_total ?? 0),
              seats_available: Number(schedule?.seats_available ?? 0),
              season_price: Number(schedule?.season_price ?? 0),
              min_participants:
                typeof schedule?.min_participants === "number" && Number.isFinite(schedule.min_participants)
                  ? Math.max(1, Math.trunc(schedule.min_participants))
                  : 1,
            }))
          : editingTour.schedule
          ? [
              {
                id: editingTour.schedule.id ? String(editingTour.schedule.id) : undefined,
                start_date: editingTour.schedule.start_date
                  ? String(editingTour.schedule.start_date).split("T")[0]
                  : "",
                end_date: editingTour.schedule.end_date
                  ? String(editingTour.schedule.end_date).split("T")[0]
                  : "",
                seats_total: Number(editingTour.schedule.seats_total ?? 0),
                seats_available: Number(editingTour.schedule.seats_available ?? 0),
                season_price: Number(editingTour.schedule.season_price ?? 0),
                min_participants:
                  typeof editingTour.schedule.min_participants === "number" &&
                  Number.isFinite(editingTour.schedule.min_participants)
                    ? Math.max(1, Math.trunc(editingTour.schedule.min_participants))
                    : 1,
              },
            ]
          : defaults.schedules.map((schedule) => ({ ...schedule }));

      const packagesForForm: FormPackage[] =
        Array.isArray(editingTour.packages) && editingTour.packages.length > 0
          ? editingTour.packages.map((pkg) => ({
              id: pkg?.id ? String(pkg.id) : undefined,
              name: typeof pkg?.name === "string" ? pkg.name : "Gói dịch vụ",
              description: typeof pkg?.description === "string" ? pkg.description : "",
              adult_price: Number(pkg?.adult_price ?? 0),
              child_price: Number(pkg?.child_price ?? 0),
              is_active: pkg?.is_active !== false,
            }))
          : defaults.packages.map((pkg) => ({ ...pkg }));

      const policiesForForm: FormCancellationPolicy[] =
        Array.isArray(editingTour.cancellation_policies) && editingTour.cancellation_policies.length > 0
          ? editingTour.cancellation_policies.map((policy) => ({
              id: policy?.id ? String(policy.id) : undefined,
              days_before: Number(policy?.days_before ?? 0),
              refund_rate:
                typeof policy?.refund_rate === "number"
                  ? Math.max(0, Math.min(100, policy.refund_rate * 100))
                  : 0,
              description: typeof policy?.description === "string" ? policy.description : "",
            }))
          : defaults.cancellationPolicies.map((policy) => ({ ...policy }));

      const categoriesForForm: FormCategory[] =
        Array.isArray(editingTour.categories) && editingTour.categories.length > 0
          ? editingTour.categories.map((category) => ({
              id: category?.id ? String(category.id) : undefined,
              name: typeof category?.name === "string" ? category.name : "",
              slug: typeof category?.slug === "string" ? category.slug : "",
            }))
          : defaults.categories.map((category) => ({ ...category }));

      const normalizedEditingType =
        editingTour.itinerary_type === "single-day" || editingTour.itinerary_type === "multi-day"
          ? (editingTour.itinerary_type as ItineraryType)
          : null;
      const detectedItineraryType = normalizedEditingType ?? detectItineraryType(parsedItinerary);

      setFormData({
        title: editingTour.title || "",
        description: editingTour.description || "",
        destination: editingTour.destination || "",
        base_price: Number(
          editingTour.base_price ?? packagesForForm?.[0]?.adult_price ?? defaults.base_price,
        ),
        policy: editingTour.policy || "",
        tagsString: Array.isArray(editingTour.tags) ? editingTour.tags.join(", ") : "",
        imageUrlsString: Array.isArray(editingTour.media) ? editingTour.media.join("\n") : "",
        itineraryItems:
          parsedItinerary.length > 0 ? parsedItinerary : defaults.itineraryItems.map((item) => ({ ...item })),
        itineraryType: detectedItineraryType,
        type: editingTour.type ?? defaults.type,
        child_age_limit:
          editingTour.child_age_limit !== undefined && editingTour.child_age_limit !== null
            ? Number(editingTour.child_age_limit)
            : defaults.child_age_limit,
        requires_passport: editingTour.requires_passport ?? defaults.requires_passport,
        requires_visa: editingTour.requires_visa ?? defaults.requires_visa,
        status: editingTour.status ?? defaults.status,
        schedules: schedulesForForm,
        packages: packagesForForm,
        cancellationPolicies: policiesForForm,
        categories: categoriesForForm,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setFormData(createInitialFormData());
    }
  }, [editingTour, baseFormDefaults]);

  // ---------------------------- HANDLERS ----------------------------

  const handleViewTour = async (id: string) => {
      setSelectedTour(null);
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      try {
          const res = await apiClient.get(`${PARTNER_TOUR_ENDPOINT}/${id}`);

          const raw = res.data.tour || res.data;
          const tourData: Tour = normalizeTourFromAPI(raw);
          setSelectedTour(tourData);

      } catch (err: any) {
          toast({
              title: "Lỗi",
              description: "Không thể tải chi tiết tour. Vui lòng thử lại.",
              variant: "destructive",
          });
          setIsDetailOpen(false);
      } finally {
          setIsDetailLoading(false);
      }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    // IMPROVEMENT: Chuyển đổi sang số an toàn hơn
    if (["base_price"].includes(id)) {
      setFormData((prev) => ({ ...prev, [id]: Number(value) || 0 }));
    } else if (id === "child_age_limit") {
      setFormData((prev) => ({
        ...prev,
        child_age_limit: value === "" ? null : Number(value) || null,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleCheckboxChange = (id: "requires_passport" | "requires_visa") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setFormData((prev) => ({ ...prev, [id]: checked }));
  };

  const handleAddTour = () => {
    setEditingTour(null);
    setFormData(createInitialFormData());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItineraryTypeChange = (type: ItineraryType) => {
    setFormData((prev) => {
      if (prev.itineraryType === type) return prev;
      const updatedItems = prev.itineraryItems.map((item, index) => ({
        ...item,
        day: index + 1,
      }));
      return {
        ...prev,
        itineraryType: type,
        itineraryItems: updatedItems,
      };
    });
  };

  const handleItineraryChange = (
    index: number,
    field: "title" | "detail",
    value: string
  ) => {
    const newItems = [...formData.itineraryItems];
    newItems[index][field] = value;
    setFormData({ ...formData, itineraryItems: newItems });
  };

const addItineraryItem = () => {
  setFormData({
    ...formData,
    itineraryItems: [
      ...formData.itineraryItems,
      { day: formData.itineraryItems.length + 1, title: "", detail: "" },
    ],
  });
};

const handleMoveItinerary = (index: number, delta: number) => {
  setFormData((prev) => {
    const items = [...prev.itineraryItems];
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= items.length) return prev;
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    return {
      ...prev,
      itineraryItems: items.map((item, idx) => ({ ...item, day: idx + 1 })),
    };
  });
};

  const removeItineraryItem = (index: number) => {
    if (formData.itineraryItems.length > 1) {
      const newItems = formData.itineraryItems.filter((_, i) => i !== index);
      const reIndexedItems = newItems.map((item, i) => ({ ...item, day: i + 1 }));

      setFormData({ ...formData, itineraryItems: reIndexedItems });
    } else {
      toast({
        title: "Cảnh báo",
        description: "Cần có ít nhất một mục trong hành trình.",
        variant: "destructive",
      });
    }
  };

  const handlePromotionFormChange = <K extends keyof PromotionFormState>(
    field: K,
    value: PromotionFormState[K],
  ) => {
    setPromotionForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditPromotion = (promotion: PartnerPromotion) => {
    setPromotionForm({
      discount_type:
        (promotion.discount_type as PromotionFormState["discount_type"]) ?? "percent",
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
    setEditingPromotion(promotion);
  };

  const handleResetPromotionForm = () => {
    setPromotionForm(createInitialPromotionForm());
    setEditingPromotion(null);
  };

  const handlePromotionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericValue = Number(promotionForm.value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast({
        title: "Giá trị khuyến mãi chưa hợp lệ",
        description: "Vui lòng nhập số lớn hơn 0.",
        variant: "destructive",
      });
      return;
    }
    if (!editingPromotion && !promotionTourId) {
      toast({
        title: "Chưa chọn tour",
        description: "Hãy chọn tour cần quản lý khuyến mãi trước khi thêm mới.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      discount_type: promotionForm.discount_type,
      value: numericValue,
      max_usage: promotionForm.max_usage ? Number(promotionForm.max_usage) || 0 : undefined,
      valid_from: promotionForm.valid_from || undefined,
      valid_to: promotionForm.valid_to || undefined,
      description: promotionForm.description?.trim() || undefined,
      is_active: promotionForm.is_active,
    };

    setIsPromotionSaving(true);
    try {
      if (editingPromotion?.id) {
        await updatePartnerPromotion(editingPromotion.id, payload);
        toast({
          title: "Đã cập nhật khuyến mãi",
          description: "Thông tin khuyến mãi đã được lưu.",
        });
      } else if (promotionTourId) {
        await createPartnerPromotion({ ...payload, tour_id: promotionTourId });
        toast({
          title: "Đã tạo khuyến mãi",
          description: "Khuyến mãi mới đã được thêm cho tour.",
        });
      }
      handleResetPromotionForm();
      if (promotionTourId) {
        await loadPromotions(promotionTourId);
      }
    } catch (error) {
      console.error("Không thể lưu khuyến mãi:", error);
      toast({
        title: "Lỗi lưu khuyến mãi",
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsPromotionSaving(false);
    }
  };

  const handleDeletePromotion = async (promotion: PartnerPromotion) => {
    if (!promotion?.id) return;
    setIsPromotionSaving(true);
    try {
      await deletePartnerPromotion(promotion.id);
      toast({
        title: "Đã xoá khuyến mãi",
        description: "Khuyến mãi đã được xoá khỏi tour.",
      });
      if (promotionTourId) {
        await loadPromotions(promotionTourId);
      }
    } catch (error) {
      console.error("Không thể xoá khuyến mãi:", error);
      toast({
        title: "Lỗi xoá khuyến mãi",
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsPromotionSaving(false);
    }
  };

  const handleScheduleChange = (
    index: number,
    field: keyof FormSchedule,
    value: string | number,
  ) => {
    setFormData((prev) => {
      const next = [...prev.schedules];
      const target = { ...next[index] };
      if (field === "start_date" || field === "end_date") {
        target[field] = typeof value === "string" ? value : String(value);
      } else {
        const numeric = Number(value) || 0;
        if (field === "seats_total") {
          target.seats_total = numeric;
        } else if (field === "seats_available") {
          target.seats_available = numeric;
        } else if (field === "season_price") {
          target.season_price = numeric;
        } else if (field === "min_participants") {
          target.min_participants = Math.max(1, Math.trunc(numeric) || 1);
        }
      }
      next[index] = target;
      return { ...prev, schedules: next };
    });
  };

  const addSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        {
          start_date: "",
          end_date: "",
          seats_total: 0,
          seats_available: 0,
          season_price: 0,
          min_participants: 1,
        },
      ],
    }));
  };

  const removeSchedule = (index: number) => {
    setFormData((prev) => {
      if (prev.schedules.length <= 1) return prev;
      const next = prev.schedules.filter((_, i) => i !== index);
      return { ...prev, schedules: next };
    });
  };

  const handlePackageChange = (
    index: number,
    field: keyof FormPackage,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => {
      const next = [...prev.packages];
      const target = { ...next[index] };
      if (field === "is_active") {
        target.is_active = Boolean(value);
      } else if (field === "adult_price" || field === "child_price") {
        target[field] = Number(value) || 0;
      } else if (field === "name" || field === "description") {
        target[field] = typeof value === "string" ? value : String(value);
      }
      next[index] = target;
      return {
        ...prev,
        packages: next,
        base_price:
          index === 0 && field === "adult_price"
            ? target.adult_price
            : prev.base_price,
      };
    });
  };

  const addPackage = () => {
    setFormData((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        {
          name: "Gói dịch vụ",
          description: "",
          adult_price: 0,
          child_price: 0,
          is_active: true,
        },
      ],
    }));
  };

  const removePackage = (index: number) => {
    setFormData((prev) => {
      if (prev.packages.length <= 1) return prev;
      const next = prev.packages.filter((_, i) => i !== index);
      return { ...prev, packages: next };
    });
  };

  const handlePolicyChange = (
    index: number,
    field: keyof FormCancellationPolicy,
    value: string | number,
  ) => {
    setFormData((prev) => {
      const next = [...prev.cancellationPolicies];
      const target = { ...next[index] };
      if (field === "description") {
        target.description = typeof value === "string" ? value : String(value);
      } else if (field === "days_before") {
        target.days_before = Number(value) || 0;
      } else if (field === "refund_rate") {
        const numeric = Number(value);
        target.refund_rate = Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 0;
      }
      next[index] = target;
      return { ...prev, cancellationPolicies: next };
    });
  };

  const addPolicy = () => {
    setFormData((prev) => ({
      ...prev,
      cancellationPolicies: [
        ...prev.cancellationPolicies,
        {
          days_before: 0,
          refund_rate: 0,
          description: "",
        },
      ],
    }));
  };

  const removePolicy = (index: number) => {
    setFormData((prev) => {
      if (prev.cancellationPolicies.length <= 1) return prev;
      const next = prev.cancellationPolicies.filter((_, i) => i !== index);
      return { ...prev, cancellationPolicies: next };
    });
  };

  const handleCategoryChange = (
    index: number,
    field: keyof FormCategory,
    value: string,
  ) => {
    setFormData((prev) => {
      const next = [...prev.categories];
      const target = { ...next[index] };
      target[field] = value;
      next[index] = target;
      return { ...prev, categories: next };
    });
  };

  const addCategory = () => {
    setFormData((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          name: "",
          slug: "",
        },
      ],
    }));
  };

  const removeCategory = (index: number) => {
    setFormData((prev) => {
      if (prev.categories.length <= 1) return prev;
      const next = prev.categories.filter((_, i) => i !== index);
      return { ...prev, categories: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.itineraryItems.some((item) => !item.title || !item.detail)) {
      toast({
        title: "Thiếu thông tin hành trình",
        description: "Giờ/Ngày và mô tả hoạt động trong hành trình không được để trống.",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.schedules.some(
        (schedule) =>
          !schedule.start_date ||
          !schedule.end_date ||
          schedule.seats_total <= 0 ||
          (schedule.min_participants ?? 0) < 1,
      )
    ) {
      toast({
        title: "Lịch khởi hành chưa hợp lệ",
        description:
          "Mỗi lịch cần có ngày bắt đầu/kết thúc, tổng số chỗ lớn hơn 0 và số khách tối thiểu tối thiểu là 1.",
        variant: "destructive",
      });
      return;
    }

    if (formData.packages.some((pkg) => !pkg.name || pkg.adult_price <= 0)) {
      toast({
        title: "Thiếu thông tin gói dịch vụ",
        description: "Tên gói và giá người lớn phải được nhập và lớn hơn 0.",
        variant: "destructive",
      });
      return;
    }

    const tagsArray = formData.tagsString.split(",").map((t) => t.trim()).filter(Boolean);
    const mediaArray = Array.from(
      new Set(
        formData.imageUrlsString
          .split(/\r?\n/)
          .map((u) => u.trim())
          .filter(Boolean),
      ),
    ).filter((url) => /^(https?:\/\/|data:)/i.test(url));

    const itineraryPayload = formData.itineraryItems.map((item, index) => ({
      day: formData.itineraryType === "multi-day" ? item.day || index + 1 : index + 1,
      title: item.title.trim(),
      detail: item.detail.trim(),
    }));

    const schedulesPayload = formData.schedules.map((schedule) => ({
      ...(schedule.id ? { id: schedule.id } : {}),
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      seats_total: Number(schedule.seats_total) || 0,
      seats_available: Math.min(
        Number(schedule.seats_available) || 0,
        Number(schedule.seats_total) || 0,
      ),
      season_price: Number(schedule.season_price) || 0,
      min_participants: Math.max(1, Number(schedule.min_participants) || 1),
    }));

    const packagesPayload = formData.packages.map((pkg) => ({
      ...(pkg.id ? { id: pkg.id } : {}),
      name: pkg.name || "Gói dịch vụ",
      description: pkg.description,
      adult_price: Number(pkg.adult_price) || 0,
      child_price: Number(pkg.child_price) || 0,
      is_active: Boolean(pkg.is_active),
    }));

    const cancellationPayload = formData.cancellationPolicies.map((policy) => ({
      ...(policy.id ? { id: policy.id } : {}),
      days_before: Number(policy.days_before) || 0,
      refund_rate: Math.max(0, Math.min(1, (Number(policy.refund_rate) || 0) / 100)),
      description: policy.description,
    }));

    const categoriesPayload = formData.categories
      .map((category) => ({
        ...(category.id ? { id: category.id } : {}),
        name: category.name.trim(),
        slug: category.slug.trim(),
      }))
      .filter((category) => category.name);

    const payload = {
      title: formData.title,
      description: formData.description,
      destination: formData.destination,
      base_price: Number(formData.base_price) || (packagesPayload[0]?.adult_price ?? 0),
      policy: formData.policy,
      tags: tagsArray,
      media: mediaArray,
      itinerary: itineraryPayload,
      itinerary_type: formData.itineraryType,
      type: formData.type,
      child_age_limit: formData.child_age_limit ?? undefined,
      requires_passport: formData.requires_passport,
      requires_visa: formData.requires_visa,
      status: formData.status,
      schedules: schedulesPayload,
      schedule: schedulesPayload[0] ?? undefined,
      packages: packagesPayload,
      cancellation_policies: cancellationPayload,
      categories: categoriesPayload,
    };

    await postTour(payload, !!editingTour, editingTour?.id);
  };

  const getStatusBadge = (status: string): "default" | "secondary" | "destructive" => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      approved: "default",
      pending: "secondary",
      draft: "secondary",
      rejected: "destructive",
    };
    return variants[status] || "secondary";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      approved: "Đã duyệt",
      pending: "Chờ duyệt",
      draft: "Bản nháp",
      rejected: "Từ chối",
    };
    return texts[status] || status;
  };
  
  // FIX: Khai báo biến currentImage trước khi sử dụng
  const currentImage = mediaList[selectedImageIndex];

  // ---------------------------- RENDER ----------------------------
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>{editingTour ? "Cập nhật tour" : "Thêm tour mới"}</CardTitle>
          <CardDescription>
            {editingTour
              ? "Điều chỉnh thông tin tour. Sau khi lưu, tour sẽ quay về trạng thái chờ duyệt."
              : "Nhập thông tin chi tiết để tạo tour mới trên hệ thống."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="title">Tên tour *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Du thuyền Vịnh Hạ Long 3N2Đ"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Địa điểm *</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="Hạ Long, Quảng Ninh"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagsString">Thẻ nổi bật</Label>
                <Input
                  id="tagsString"
                  value={formData.tagsString}
                  onChange={handleInputChange}
                  placeholder="biển, resort, 3n2d"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_price">Giá cơ bản</Label>
                <Input
                  id="base_price"
                  type="number"
                  min="0"
                  value={formData.base_price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Loại tour</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="domestic">Tour nội địa</option>
                  <option value="international">Tour quốc tế</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="child_age_limit">Giới hạn tuổi trẻ em</Label>
                <Input
                  id="child_age_limit"
                  type="number"
                  min="0"
                  value={formData.child_age_limit ?? ""}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: 12"
                />
                <p className="text-xs text-muted-foreground">Để trống nếu tour không giới hạn độ tuổi.</p>
              </div>
              <div className="space-y-2">
                <Label>Giấy tờ yêu cầu</Label>
                <div className="flex flex-col gap-2 rounded-md border border-input bg-background px-3 py-2">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={formData.requires_passport}
                      onChange={handleCheckboxChange("requires_passport")}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    Cần hộ chiếu
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={formData.requires_visa}
                      onChange={handleCheckboxChange("requires_visa")}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    Cần visa
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
              <div className="space-y-2 xl:col-span-3">
                <Label htmlFor="imageUrlsString">Danh sách ảnh</Label>
                <Textarea
                  id="imageUrlsString"
                  value={formData.imageUrlsString}
                  onChange={handleInputChange}
                  rows={editingTour ? 3 : 4}
                  placeholder={"https://example.com/img1.jpg\nhttps://example.com/img2.jpg"}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả tổng quan *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Giới thiệu điểm đến, trải nghiệm chính, dịch vụ bao gồm..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy">Chính sách *</Label>
                <Textarea
                  id="policy"
                  value={formData.policy}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Chính sách hoàn/huỷ, điều kiện đặt tour..."
                  required
                />
              </div>
            </div>

            <Card className="border-none bg-white shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Gift className="h-5 w-5" />
                  Khuyến mãi tự động
                </CardTitle>
                <CardDescription>
                  Tạo các ưu đãi tự áp dụng cho tour này. Khuyến mãi sẽ tự động trừ tiền khi khách đặt tour.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[minmax(200px,280px)_1fr]">
                  <div className="space-y-2">
                    <Label>Chọn tour để quản lý khuyến mãi</Label>
                    <Select
                      value={promotionTourId ? String(promotionTourId) : ""}
                      onValueChange={(value) => {
                        setPromotionTourId(value);
                        handleResetPromotionForm();
                      }}
                      disabled={isPromotionSaving || isPromotionLoading || tours.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={tours.length === 0 ? "Chưa có tour nào" : "Chọn tour đã tạo"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {tours.map((tour) => (
                          <SelectItem key={tour.id} value={String(tour.id)}>
                            {tour.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {promotionTourId
                      ? "Bạn có thể thêm hoặc cập nhật khuyến mãi cho tour đã chọn."
                      : "Vui lòng chọn một tour đã lưu để bật khuyến mãi tự động."}
                  </div>
                </div>

                {promotionTourId ? (
                  <>
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePromotionSubmit}>
                      <div className="space-y-2">
                        <Label>Loại giảm giá</Label>
                        <Select
                          value={promotionForm.discount_type}
                          onValueChange={(value) =>
                            handlePromotionFormChange(
                              "discount_type",
                              value as PromotionFormState["discount_type"],
                            )
                          }
                          disabled={isPromotionSaving}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại giảm" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">Giảm theo %</SelectItem>
                            <SelectItem value="fixed">Giảm cố định</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Giá trị</Label>
                        <Input
                          type="number"
                          min="1"
                          value={promotionForm.value}
                          onChange={(event) => handlePromotionFormChange("value", event.target.value)}
                          placeholder={promotionForm.discount_type === "fixed" ? "500000" : "10"}
                          disabled={isPromotionSaving}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Số lượt tối đa</Label>
                        <Input
                          type="number"
                          min="0"
                          value={promotionForm.max_usage}
                          onChange={(event) =>
                            handlePromotionFormChange("max_usage", event.target.value)
                          }
                          placeholder="Không giới hạn"
                          disabled={isPromotionSaving}
                        />
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Hiệu lực từ</Label>
                          <Input
                            type="date"
                            value={promotionForm.valid_from}
                            onChange={(event) =>
                              handlePromotionFormChange("valid_from", event.target.value)
                            }
                            disabled={isPromotionSaving}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Đến</Label>
                          <Input
                            type="date"
                            value={promotionForm.valid_to}
                            onChange={(event) =>
                              handlePromotionFormChange("valid_to", event.target.value)
                            }
                            disabled={isPromotionSaving}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Mô tả hiển thị</Label>
                        <Textarea
                          rows={2}
                          value={promotionForm.description}
                          onChange={(event) =>
                            handlePromotionFormChange("description", event.target.value)
                          }
                          placeholder="Ví dụ: Giảm 10% cho khách đặt trước 30 ngày"
                          disabled={isPromotionSaving}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={promotionForm.is_active}
                          onCheckedChange={(checked) =>
                            handlePromotionFormChange("is_active", Boolean(checked))
                          }
                          disabled={isPromotionSaving}
                        />
                        <span className="text-sm text-muted-foreground">
                          {promotionForm.is_active ? "Đang kích hoạt" : "Tạm tắt"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Button type="submit" disabled={isPromotionSaving}>
                          {isPromotionSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                            </>
                          ) : editingPromotion ? (
                            "Cập nhật khuyến mãi"
                          ) : (
                            "Thêm khuyến mãi"
                          )}
                        </Button>
                        {editingPromotion ? (
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={isPromotionSaving}
                            onClick={handleResetPromotionForm}
                          >
                            Huỷ chỉnh sửa
                          </Button>
                        ) : null}
                      </div>
                    </form>
                    <div className="space-y-3">
                      {isPromotionLoading ? (
                        <Skeleton className="h-24 w-full rounded-xl" />
                      ) : partnerPromotions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Chưa có khuyến mãi nào được thiết lập cho tour này.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-muted-foreground">
                                <th className="px-3 py-2">Mã</th>
                                <th className="px-3 py-2">Loại</th>
                                <th className="px-3 py-2">Giá trị</th>
                                <th className="px-3 py-2">Thời gian</th>
                                <th className="px-3 py-2">Trạng thái</th>
                                <th className="px-3 py-2 text-right">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {partnerPromotions.map((promotion) => (
                                <tr key={promotion.id} className="border-t">
                                  <td className="px-3 py-2 font-medium">
                                    {promotion.code ?? "Tự động"}
                                  </td>
                                  <td className="px-3 py-2">
                                    {resolvePromotionTypeText(promotion.discount_type)}
                                  </td>
                                  <td className="px-3 py-2">{resolvePromotionValueText(promotion)}</td>
                                  <td className="px-3 py-2 text-sm text-muted-foreground">
                                    {formatPromotionDate(promotion.valid_from)} –{" "}
                                    {formatPromotionDate(promotion.valid_to)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge variant={promotion.is_active ? "default" : "secondary"}>
                                      {promotion.is_active ? "Đang bật" : "Tạm tắt"}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleEditPromotion(promotion)}
                                        aria-label="Chỉnh sửa khuyến mãi"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="text-destructive hover:text-red-600"
                                        onClick={() => handleDeletePromotion(promotion)}
                                        aria-label="Xoá khuyến mãi"
                                        disabled={isPromotionSaving}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Hiện chưa có tour nào được chọn. Hãy chọn tour ở phía trên để thêm và quản lý khuyến mãi tự động.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Calendar className="h-5 w-5" /> Lịch khởi hành
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={addSchedule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm lịch
                </Button>
              </div>
              <div className="space-y-3">
                {formData.schedules.map((schedule, index) => (
                  <Card key={`schedule-${index}`} className="border border-dashed border-primary/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                      <CardTitle className="text-base font-semibold text-foreground">
                        Lịch #{index + 1}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-red-600"
                          onClick={() => removeSchedule(index)}
                          disabled={formData.schedules.length === 1}
                          aria-label="Xóa lịch khởi hành"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                      <div className="space-y-1">
                        <Label>Ngày bắt đầu</Label>
                        <Input
                          type="date"
                          value={schedule.start_date}
                          onChange={(event) =>
                            handleScheduleChange(index, "start_date", event.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Ngày kết thúc</Label>
                        <Input
                          type="date"
                          value={schedule.end_date}
                          onChange={(event) =>
                            handleScheduleChange(index, "end_date", event.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Tổng số chỗ</Label>
                        <Input
                          type="number"
                          min="0"
                          value={schedule.seats_total}
                          onChange={(event) =>
                            handleScheduleChange(index, "seats_total", Number(event.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Số chỗ còn trống</Label>
                        <Input
                          type="number"
                          min="0"
                          value={schedule.seats_available}
                          onChange={(event) =>
                            handleScheduleChange(index, "seats_available", Number(event.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Giá mùa cao điểm</Label>
                        <Input
                          type="number"
                          min="0"
                          value={schedule.season_price}
                          onChange={(event) =>
                            handleScheduleChange(index, "season_price", Number(event.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Số khách tối thiểu</Label>
                        <Input
                          type="number"
                          min="1"
                          value={schedule.min_participants}
                          onChange={(event) =>
                            handleScheduleChange(index, "min_participants", Number(event.target.value))
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Lịch sẽ được duy trì khi đạt từ {schedule.min_participants || 1} khách trở lên.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <List className="h-5 w-5" /> Gói dịch vụ
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={addPackage}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm gói
                </Button>
              </div>
              <div className="space-y-3">
                {formData.packages.map((pkg, index) => (
                  <Card key={`package-${index}`} className="border border-dashed border-primary/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                      <CardTitle className="text-base font-semibold">Gói #{index + 1}</CardTitle>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={pkg.is_active}
                            onChange={(event) =>
                              handlePackageChange(index, "is_active", event.target.checked)
                            }
                          />
                          Đang mở bán
                        </label>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-red-600"
                          onClick={() => removePackage(index)}
                          disabled={formData.packages.length === 1}
                          aria-label="Xóa gói dịch vụ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1 md:col-span-2">
                        <Label>Tên gói</Label>
                        <Input
                          value={pkg.name}
                          onChange={(event) =>
                            handlePackageChange(index, "name", event.target.value)
                          }
                          placeholder="Gói tiêu chuẩn"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label>Mô tả ngắn</Label>
                        <Textarea
                          rows={2}
                          value={pkg.description}
                          onChange={(event) =>
                            handlePackageChange(index, "description", event.target.value)
                          }
                          placeholder="Bao gồm dịch vụ lưu trú, bữa ăn..."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Giá người lớn</Label>
                        <Input
                          type="number"
                          min="0"
                          value={pkg.adult_price}
                          onChange={(event) =>
                            handlePackageChange(index, "adult_price", Number(event.target.value))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Giá trẻ em</Label>
                        <Input
                          type="number"
                          min="0"
                          value={pkg.child_price}
                          onChange={(event) =>
                            handlePackageChange(index, "child_price", Number(event.target.value))
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Shield className="h-5 w-5" /> Chính sách hoàn hủy
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={addPolicy}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm chính sách
                </Button>
              </div>
              <div className="space-y-3">
                {formData.cancellationPolicies.map((policy, index) => (
                  <Card key={`policy-${index}`} className="border border-dashed border-primary/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                      <CardTitle className="text-base font-semibold">
                        Chính sách #{index + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-red-600"
                        onClick={() => removePolicy(index)}
                        disabled={formData.cancellationPolicies.length === 1}
                        aria-label="Xóa chính sách"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1">
                        <Label>Số ngày trước khởi hành</Label>
                        <Input
                          type="number"
                          min="0"
                          value={policy.days_before}
                          onChange={(event) =>
                            handlePolicyChange(index, "days_before", Number(event.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Tỷ lệ hoàn (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={policy.refund_rate}
                          onChange={(event) =>
                            handlePolicyChange(index, "refund_rate", Number(event.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label>Mô tả</Label>
                        <Textarea
                          rows={2}
                          value={policy.description}
                          onChange={(event) =>
                            handlePolicyChange(index, "description", event.target.value)
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <List className="h-5 w-5" /> Danh mục hiển thị
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={addCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm danh mục
                </Button>
              </div>
              <div className="space-y-3">
                {formData.categories.map((category, index) => (
                  <Card key={`category-${index}`} className="border border-dashed border-primary/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                      <CardTitle className="text-base font-semibold">
                        Danh mục #{index + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-red-600"
                        onClick={() => removeCategory(index)}
                        disabled={formData.categories.length === 1}
                        aria-label="Xóa danh mục"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Tên danh mục</Label>
                        <Input
                          value={category.name}
                          onChange={(event) =>
                            handleCategoryChange(index, "name", event.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Slug</Label>
                        <Input
                          value={category.slug}
                          onChange={(event) =>
                            handleCategoryChange(index, "slug", event.target.value)
                          }
                          placeholder="tour-bien"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <MapPin className="h-5 w-5" /> Hành trình & gói dịch vụ
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={formData.itineraryType === "single-day" ? "default" : "outline"}
                      onClick={() => handleItineraryTypeChange("single-day")}
                      aria-pressed={formData.itineraryType === "single-day"}
                    >
                      Tour trong ngày
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={formData.itineraryType === "multi-day" ? "default" : "outline"}
                      onClick={() => handleItineraryTypeChange("multi-day")}
                      aria-pressed={formData.itineraryType === "multi-day"}
                    >
                      Tour dài ngày
                    </Button>
                  </div>
                </div>
                <Button type="button" size="sm" onClick={addItineraryItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm dòng lịch trình
                </Button>
              </div>

              <div className="space-y-3">
                {formData.itineraryItems.map((item, i) => (
                  <Card key={i} className="border border-dashed border-primary/40">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4">
                      <CardTitle className="text-base font-semibold">
                        {formData.itineraryType === "multi-day"
                          ? `Ngày ${item.day}`
                          : item.title?.trim() || `Hoạt động ${i + 1}`}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleMoveItinerary(i, -1)}
                          disabled={i === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleMoveItinerary(i, 1)}
                          disabled={i === formData.itineraryItems.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 pt-0">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>
                            {formData.itineraryType === "single-day" ? "Giờ" : "Ngày"}
                          </Label>
                          <Input
                            value={item.title}
                            onChange={(e) => handleItineraryChange(i, "title", e.target.value)}
                            placeholder={
                              formData.itineraryType === "single-day"
                                ? "08:30"
                                : `Ngày ${item.day}: Tiêu đề`
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {formData.itineraryType === "single-day"
                              ? "Mô tả hành trình"
                              : "Mô tả"}
                          </Label>
                          <Textarea
                            value={item.detail}
                            onChange={(e) => handleItineraryChange(i, "detail", e.target.value)}
                            rows={3}
                            placeholder={
                              formData.itineraryType === "single-day"
                                ? "Hoạt động chính, địa điểm tham quan..."
                                : "Hoạt động chính, dịch vụ đi kèm..."
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-red-600"
                          onClick={() => removeItineraryItem(i)}
                          disabled={formData.itineraryItems.length === 1}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Xóa dòng
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {editingTour ? (
                <Button type="button" variant="outline" onClick={handleAddTour} disabled={isSubmitting}>
                  Hủy chỉnh sửa
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData(createInitialFormData())}
                  disabled={isSubmitting}
                >
                  Làm mới
                </Button>
              )}
              <Button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  editingTour ? "Cập nhật tour" : "Tạo tour"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle>{selectedTour ? selectedTour.title : "Đang tải chi tiết tour"}</DialogTitle>
            <DialogDescription>
              {selectedTour ? (
                <span className="inline-flex items-center gap-2">
                  Chi tiết đầy đủ của tour
                  <Badge variant={getStatusBadge(selectedTour.status)}>{getStatusText(selectedTour.status)}</Badge>
                </span>
              ) : (
                "Vui lòng chờ trong giây lát..."
              )}
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !selectedTour ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Không thể tải dữ liệu tour.</div>
          ) : (
            <div className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Thông tin cơ bản</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Địa điểm</p>
                    <p className="font-medium text-foreground">{selectedTour.destination}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Giá cơ bản</p>
                    <p className="font-medium text-foreground">
                      {typeof selectedTour.base_price === "number"
                        ? `${selectedTour.base_price.toLocaleString("vi-VN")}₫`
                        : "—"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-muted-foreground">Mô tả</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedTour.description}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-muted-foreground">Chính sách</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedTour.policy}</p>
                  </div>
                  {Array.isArray(selectedTour.tags) && selectedTour.tags.length > 0 ? (
                    <div className="md:col-span-2">
                      <p className="text-sm font-semibold text-muted-foreground">Tags</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedTour.tags.map((tag, index) => (
                          <Badge key={`${tag}-${index}`} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Calendar className="h-4 w-4" />
                    Lịch trình &amp; chỗ ngồi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(selectedTour.schedules) && selectedTour.schedules.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTour.schedules.map((schedule, index) => (
                        <div
                          key={schedule?.id ?? index}
                          className="grid grid-cols-2 gap-4 rounded-lg border border-dashed border-primary/30 p-3 md:grid-cols-3 lg:grid-cols-6"
                        >
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Ngày đi</p>
                            <p className="font-medium text-foreground">
                              {schedule?.start_date ? String(schedule.start_date).split("T")[0] : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Ngày về</p>
                            <p className="font-medium text-foreground">
                              {schedule?.end_date ? String(schedule.end_date).split("T")[0] : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Giá mùa cao điểm</p>
                            <p className="font-medium text-foreground">
                              {schedule?.season_price !== undefined && schedule?.season_price !== null
                                ? `${Number(schedule.season_price).toLocaleString("vi-VN")}₫`
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Tổng chỗ</p>
                            <p className="font-medium text-foreground">{schedule?.seats_total ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Còn trống</p>
                            <p className="font-medium text-foreground">{schedule?.seats_available ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Số khách tối thiểu</p>
                            <p className="font-medium text-foreground">
                              {typeof schedule?.min_participants === "number"
                                ? Math.max(1, schedule.min_participants)
                                : "—"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có lịch trình cho tour này.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <MapPin className="h-4 w-4" />
                    Hành trình chi tiết
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTourItineraryItems.length > 0 ? (
                    selectedTourItineraryItems.map((item, index) => {
                      const isSingleDay = selectedTourItineraryType === "single-day";
                      const trimmedTitle = item.title?.trim() ?? "";
                      const label = isSingleDay
                        ? trimmedTitle || `Hoạt động ${index + 1}`
                        : `Ngày ${item.day}: ${trimmedTitle || `Hoạt động ${item.day}`}`;
                      return (
                        <div key={`${item.day}-${index}`} className="border-l-4 border-orange-400 pl-4">
                          <p className="font-semibold text-foreground">{label}</p>
                          <p className="text-sm text-muted-foreground">{item.detail}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Chưa có hành trình cho tour này.
                    </p>
                  )}
                </CardContent>
              </Card>

              {Array.isArray(selectedTour.packages) && selectedTour.packages.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <List className="h-4 w-4" />
                      Gói dịch vụ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedTour.packages.map((pkg, index) => (
                      <div
                        key={pkg.id ?? index}
                        className="space-y-2 rounded-lg border border-dashed border-primary/30 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {pkg.name ?? `Gói dịch vụ #${index + 1}`}
                          </p>
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>
                            {pkg.is_active ? "Đang mở bán" : "Tạm dừng"}
                          </Badge>
                        </div>
                        {pkg.description && (
                          <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Giá người lớn</p>
                            <p className="font-medium text-foreground">
                              {pkg.adult_price !== undefined && pkg.adult_price !== null
                                ? `${Number(pkg.adult_price).toLocaleString("vi-VN")}₫`
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Giá trẻ em</p>
                            <p className="font-medium text-foreground">
                              {pkg.child_price !== undefined && pkg.child_price !== null
                                ? `${Number(pkg.child_price).toLocaleString("vi-VN")}₫`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {Array.isArray(selectedTour.cancellation_policies) &&
              selectedTour.cancellation_policies.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <Shield className="h-4 w-4" />
                      Chính sách hoàn hủy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedTour.cancellation_policies.map((policy, index) => (
                      <div
                        key={policy.id ?? index}
                        className="space-y-1 rounded-lg border border-dashed border-primary/20 p-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          Trước {policy.days_before ?? "—"} ngày
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Hoàn lại {policy.refund_rate !== undefined && policy.refund_rate !== null
                            ? `${Number(policy.refund_rate * 100).toFixed(0)}%`
                            : "Theo thỏa thuận"}
                        </p>
                        {policy.description && (
                          <p className="text-xs text-muted-foreground">{policy.description}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Image className="h-4 w-4" />
                    Bộ sưu tập ảnh
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mediaList.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border bg-muted">
                        {currentImage ? (
                          <img
                            src={currentImage}
                            alt={`Ảnh tour ${selectedImageIndex + 1}`}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              (event.currentTarget as HTMLImageElement).style.display = "none"
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                            Không thể hiển thị ảnh.
                          </div>
                        )}
                        {mediaList.length > 1 && (
                          <>
                            <button
                              type="button"
                              className={`absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white transition hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white ${
                                selectedImageIndex === 0 ? "cursor-not-allowed opacity-40" : ""
                              }`}
                              onClick={() => setSelectedImageIndex((index) => Math.max(index - 1, 0))}
                              disabled={selectedImageIndex === 0}
                              aria-label="Ảnh trước"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white transition hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white ${
                                selectedImageIndex === mediaList.length - 1 ? "cursor-not-allowed opacity-40" : ""
                              }`}
                              onClick={() =>
                                setSelectedImageIndex((index) => Math.min(index + 1, mediaList.length - 1))
                              }
                              disabled={selectedImageIndex === mediaList.length - 1}
                              aria-label="Ảnh tiếp theo"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        <span className="absolute bottom-3 right-4 rounded-full bg-black/40 px-3 py-1 text-xs text-white">
                          {Math.min(selectedImageIndex + 1, mediaList.length)} / {mediaList.length}
                        </span>
                      </div>

                      <div className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-y-auto">
                        {mediaList.map((url, index) => (
                          <button
                            type="button"
                            key={`${url}-${index}`}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border transition focus:outline-none focus:ring-2 focus:ring-primary ${
                              index === selectedImageIndex
                                ? "border-primary ring-1 ring-primary"
                                : "border-transparent opacity-80 hover:opacity-100"
                            }`}
                            aria-label={`Chọn ảnh ${index + 1}`}
                          >
                            <img
                              src={url}
                              alt={`Thumbnail ${index + 1}`}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                (event.currentTarget as HTMLImageElement).style.visibility = "hidden"
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có ảnh nào cho tour này.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            {selectedTour && (
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailOpen(false)
                  setEditingTour(selectedTour)
                }}
                disabled={selectedTour.status === "approved"}
              >
                Chỉnh sửa
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Tour đã đăng</CardTitle>
          <CardDescription>Tour cần được admin duyệt trước khi hiển thị công khai.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              <span className="text-lg text-muted-foreground">Đang tải danh sách Tour...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Tour</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      Chưa có tour nào được đăng.
                    </TableCell>
                  </TableRow>
                ) : (
                  tours.map((tour) => (
                    <TableRow key={tour.id}>
                      <TableCell className="font-medium max-w-xs truncate">{tour.title}</TableCell>
                      <TableCell>{tour.destination}</TableCell>
                      <TableCell>{(tour.base_price || 0).toLocaleString("vi-VN")}₫</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(tour.status)}>{getStatusText(tour.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* IMPROVEMENT: Thêm aria-label cho các nút icon */}
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleViewTour(tour.id)} aria-label="Xem chi tiết tour">
                            <Eye className="h-4 w-4" />
                          </Button>

                          {(tour.status === 'rejected') && (
                            <Button variant="default" size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={() => submitTourForApproval(tour.id)} aria-label="Gửi duyệt lại tour">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTour(tour)} disabled={tour.status === 'approved'} aria-label="Chỉnh sửa tour">
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-red-600" onClick={() => handleDeleteTour(tour.id)} disabled={tour.status === 'approved'} aria-label="Xóa tour">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
