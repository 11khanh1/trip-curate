import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addCartItem as addCartItemRequest,
  deleteCartItem as deleteCartItemRequest,
  fetchCart as fetchCartRequest,
  updateCartItem as updateCartItemRequest,
  type CartApiItem,
  type CartApiResponse,
} from "@/services/cartApi";
import type { CancellationPolicy, TourType } from "@/services/publicApi";
import { useUser } from "./UserContext";

export interface CartItem {
  id: string;
  apiId?: string | null;
  tourId: string;
  tourTitle: string;
  tourType?: TourType | null;
  childAgeLimit?: number | null;
  requiresPassport?: boolean | null;
  requiresVisa?: boolean | null;
  cancellationPolicies?: CancellationPolicy[] | null;
  packageId: string;
  packageName?: string | null;
  scheduleId?: string | null;
  scheduleTitle?: string | null;
  thumbnail?: string | null;
  adultCount: number;
  childCount: number;
  adultPrice: number;
  childPrice: number;
  totalPrice: number;
  addedAt: string;
}

export interface CartItemInput {
  tourId: string;
  tourTitle: string;
  packageId: string;
  packageName?: string | null;
  scheduleId?: string | null;
  scheduleTitle?: string | null;
  thumbnail?: string | null;
  adultCount: number;
  childCount: number;
  adultPrice: number;
  childPrice: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (input: CartItemInput) => Promise<void>;
  updateItemQuantity: (id: string, params: { adults: number; children: number }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: (options?: { persist?: boolean }) => Promise<void>;
  totalItems: number;
  totalAmount: number;
  totalAdults: number;
  totalChildren: number;
  isLoading: boolean;
  isSyncing: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const firstString = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value === "bigint") {
      return value.toString();
    }
  }
  return undefined;
};

const firstNumber = (...values: Array<unknown>): number | undefined => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "bigint") {
      return Number(value);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
};

const firstStringFromCollection = (value: unknown): string | undefined => {
  if (!Array.isArray(value)) return undefined;
  for (const candidate of value) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) return trimmed;
    } else if (isRecord(candidate)) {
      const nested = firstString(
        candidate.url,
        candidate.src,
        candidate.image,
        candidate.thumbnail,
      );
      if (nested) return nested;
    }
  }
  return undefined;
};

const parseCount = (value: unknown, fallback = 0) => {
  const number = firstNumber(value);
  if (number === undefined) return fallback;
  return Math.max(0, Math.round(number));
};

const parsePrice = (value: unknown, fallback = 0) => {
  const number = firstNumber(value);
  if (number === undefined) return fallback;
  return number >= 0 ? number : fallback;
};

const toIsoString = (value: unknown): string => {
  const raw = firstString(value);
  if (!raw) return new Date().toISOString();
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    if (["1", "true", "yes", "y"].includes(normalized)) return true;
    if (["0", "false", "no", "n"].includes(normalized)) return false;
  }
  return undefined;
};

const parsePolicies = (value: unknown): CancellationPolicy[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.filter((entry): entry is CancellationPolicy => {
    if (!entry || typeof entry !== "object") return false;
    return true;
  });
};

const mapCartApiItemToCartItem = (item: CartApiItem): CartItem => {
  const tourData = isRecord(item.tour)
    ? item.tour
    : isRecord(item.tour_data)
    ? item.tour_data
    : isRecord(item.activity)
    ? item.activity
    : undefined;

  const packageData = isRecord(item.package)
    ? item.package
    : isRecord(item.package_data)
    ? item.package_data
    : undefined;

  const scheduleData = isRecord(item.schedule)
    ? item.schedule
    : isRecord(item.schedule_data)
    ? item.schedule_data
    : undefined;

  const apiId = firstString(
    item.id,
    item.uuid,
    item.cart_item_id,
    item.cartItemId,
    item.cart_item_uuid,
    item.item_id,
    item.itemId,
  );

  const tourId =
    firstString(item.tour_id, item.tourId, tourData?.id, tourData?.uuid) ?? createId();
  const packageId =
    firstString(item.package_id, item.packageId, packageData?.id, packageData?.uuid) ??
    `${tourId}-default`;

  const adultCount = parseCount(
    item.adults ??
      item.adult_count ??
      item.adultCount ??
      item.adult_quantity ??
      item.quantity_adults ??
      item.quantity_adult,
    0,
  );
  const childCount = parseCount(
    item.children ??
      item.child_count ??
      item.childCount ??
      item.child_quantity ??
      item.quantity_children ??
      item.quantity_child,
    0,
  );

  const adultPrice = parsePrice(
    item.adult_price ??
      item.adultPrice ??
      packageData?.adult_price ??
      packageData?.adultPrice ??
      packageData?.price_per_adult ??
      packageData?.priceAdult,
    0,
  );
  const childPrice = parsePrice(
    item.child_price ??
      item.childPrice ??
      packageData?.child_price ??
      packageData?.childPrice ??
      packageData?.price_per_child ??
      packageData?.priceChild,
    0,
  );
  const totalPriceValue =
    firstNumber(item.total_price, item.totalPrice, item.total_amount, item.subtotal) ??
    adultCount * adultPrice +
      childCount * childPrice;
  const totalPrice = Math.max(0, totalPriceValue);

  const thumbnail =
    firstString(item.thumbnail, item.thumbnail_url, tourData?.thumbnail, tourData?.thumbnail_url) ??
    firstStringFromCollection(tourData?.images) ??
    firstStringFromCollection(tourData?.media);

  const scheduleId = firstString(
    item.schedule_id,
    item.scheduleId,
    scheduleData?.id,
    scheduleData?.uuid,
  );

  return {
    id: apiId ?? `${tourId}-${packageId}-${Math.random().toString(36).slice(2, 10)}`,
    apiId: apiId ?? null,
    tourId,
    tourTitle:
      firstString(item.tour_title, item.tourTitle, tourData?.title, tourData?.name) ??
      "Tour chưa đặt tên",
    tourType: (tourData?.type as TourType | undefined) ?? null,
    childAgeLimit: firstNumber(
      tourData?.child_age_limit,
      (tourData as Record<string, unknown>)?.childAgeLimit,
    ) ?? null,
    requiresPassport: parseBoolean(
      (tourData as Record<string, unknown>)?.requires_passport ??
        (tourData as Record<string, unknown>)?.requiresPassport,
    ) ?? null,
    requiresVisa: parseBoolean(
      (tourData as Record<string, unknown>)?.requires_visa ??
        (tourData as Record<string, unknown>)?.requiresVisa,
    ) ?? null,
    cancellationPolicies:
      parsePolicies(
        (tourData as Record<string, unknown>)?.cancellation_policies ??
          (tourData as Record<string, unknown>)?.cancellationPolicies,
      ) ?? null,
    packageId,
    packageName: firstString(item.package_name, item.packageName, packageData?.name),
    scheduleId: scheduleId ?? undefined,
    scheduleTitle: firstString(
      item.schedule_title,
      item.scheduleTitle,
      scheduleData?.title,
      scheduleData?.name,
    ),
    thumbnail: thumbnail ?? undefined,
    adultCount,
    childCount,
    adultPrice,
    childPrice,
    totalPrice,
    addedAt: toIsoString(
      firstString(item.added_at, item.created_at, item.updated_at, item.inserted_at),
    ),
  };
};

const mapCartApiResponseToItems = (response?: CartApiResponse | null): CartItem[] => {
  if (!response || !Array.isArray(response.items)) return [];
  return response.items
    .map((item) => {
      try {
        return mapCartApiItemToCartItem(item);
      } catch (error) {
        console.warn("Bỏ qua mục giỏ hàng không hợp lệ:", error, item);
        return null;
      }
    })
    .filter((item): item is CartItem => item !== null);
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useUser();
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const userIdentifier = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.id !== undefined && currentUser.id !== null) {
      return String(currentUser.id);
    }
    if ("email" in currentUser && currentUser.email) {
      return `email:${currentUser.email}`;
    }
    return null;
  }, [currentUser]);
  const activeUserIdentifierRef = useRef<string | null>(userIdentifier);

  useEffect(() => {
    activeUserIdentifierRef.current = userIdentifier;
  }, [userIdentifier]);

  const commitItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const resolveApiItemId = useCallback(
    (id: string) => {
      const trimmed = id?.trim?.() ?? id;
      const target =
        itemsRef.current.find((item) => item.id === trimmed) ??
        itemsRef.current.find((item) => item.apiId === trimmed);
      return target?.apiId?.trim?.() ?? trimmed;
    },
    [],
  );

  const applyResource = useCallback(
    (resource?: CartApiResponse | null) => {
      const mapped = mapCartApiResponseToItems(resource);
      commitItems(mapped);
    },
    [commitItems],
  );

  const loadCart = useCallback(async () => {
    if (!currentUser) {
      commitItems([]);
      setError(null);
      return;
    }
    const targetIdentifier = userIdentifier;
    try {
      const resource = await fetchCartRequest();
      if (targetIdentifier !== activeUserIdentifierRef.current) {
        return;
      }
      applyResource(resource);
      setError(null);
    } catch (err) {
      const normalized =
        err instanceof Error ? err : new Error("Không thể tải giỏ hàng từ máy chủ");
      setError(normalized);
      console.error("Không thể tải giỏ hàng:", err);
      throw normalized;
    }
  }, [currentUser, userIdentifier, applyResource]);

  useEffect(() => {
    let cancelled = false;

    if (!currentUser) {
      commitItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const bootstrap = async () => {
      if (!cancelled) {
        setIsLoading(true);
      }
      try {
        await loadCart();
      } catch {
        // loadCart đã xử lý lỗi và log
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [currentUser, loadCart, commitItems]);

  const addItem = useCallback(
    async (input: CartItemInput) => {
      if (!currentUser) {
        const errorInstance = new Error("Vui lòng đăng nhập để thêm vào giỏ hàng.");
        setError(errorInstance);
        return Promise.reject(errorInstance);
      }

      const payload = {
        tour_id: input.tourId,
        package_id: input.packageId,
        schedule_id: input.scheduleId ?? null,
        adults: Math.max(0, Math.round(input.adultCount)),
        children: Math.max(0, Math.round(input.childCount)),
      };

      setIsSyncing(true);
      try {
        const resource = await addCartItemRequest(payload);
        applyResource(resource);
        setError(null);
      } catch (err) {
        const normalized =
          err instanceof Error ? err : new Error("Không thể thêm mục vào giỏ hàng");
        setError(normalized);
        console.error("Không thể thêm mục vào giỏ hàng:", err);
        throw normalized;
      } finally {
        setIsSyncing(false);
      }
    },
    [currentUser, applyResource, resolveApiItemId],
  );

  const updateItemQuantity = useCallback(
    async (id: string, params: { adults: number; children: number }) => {
      if (!currentUser) {
        const errorInstance = new Error("Vui lòng đăng nhập để cập nhật giỏ hàng.");
        setError(errorInstance);
        return Promise.reject(errorInstance);
      }

      const payload = {
        adults: Math.max(0, Math.round(params.adults)),
        children: Math.max(0, Math.round(params.children)),
      };

      setIsSyncing(true);
      try {
        const apiId = resolveApiItemId(id);
        const resource = await updateCartItemRequest(apiId, payload);
        applyResource(resource);
        setError(null);
      } catch (err) {
        const normalized =
          err instanceof Error ? err : new Error("Không thể cập nhật mục trong giỏ hàng");
        setError(normalized);
        console.error("Không thể cập nhật mục trong giỏ hàng:", err);
        throw normalized;
      } finally {
        setIsSyncing(false);
      }
    },
    [currentUser, applyResource, resolveApiItemId],
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!currentUser) {
        const errorInstance = new Error("Vui lòng đăng nhập để xoá mục khỏi giỏ hàng.");
        setError(errorInstance);
        return Promise.reject(errorInstance);
      }

      const apiId = resolveApiItemId(id);
      const snapshot = itemsRef.current;
      const nextItems = snapshot.filter(
        (item) => item.id !== id && item.apiId !== id && item.apiId !== apiId,
      );
      commitItems(nextItems);

      setIsSyncing(true);
      try {
        const resource = await deleteCartItemRequest(apiId);
        if (resource && Array.isArray(resource.items)) {
          applyResource(resource);
        } else {
          const reconciled = itemsRef.current.filter(
            (item) => item.id !== id && item.apiId !== apiId && item.apiId !== id,
          );
          commitItems(reconciled);
        }
        setError(null);
      } catch (err) {
        const maybeResponse =
          err && typeof err === "object" && "response" in err
            ? ((err as { response?: { status?: number } }).response ?? null)
            : null;
        if (maybeResponse?.status === 404) {
          setError(null);
          return;
        }

        try {
          await loadCart();
          const stillExists = itemsRef.current.some(
            (item) => item.id === id || item.apiId === id || item.apiId === apiId,
          );
          if (!stillExists) {
            setError(null);
            return;
          }
        } catch (refreshError) {
          console.error("Không thể làm mới giỏ hàng sau khi xoá thất bại:", refreshError);
        }

        commitItems(snapshot);
        const normalized =
          err instanceof Error ? err : new Error("Không thể xoá mục khỏi giỏ hàng");
        setError(normalized);
        console.error("Không thể xoá mục khỏi giỏ hàng:", err);
        throw normalized;
      } finally {
        setIsSyncing(false);
      }
    },
    [currentUser, applyResource, commitItems, loadCart, resolveApiItemId],
  );

  const clearCart = useCallback(
    async (options?: { persist?: boolean }) => {
      if (options?.persist === false) {
        commitItems([]);
        setError(null);
        return;
      }

      if (!currentUser) {
        commitItems([]);
        setError(null);
        return;
      }

      const snapshot = itemsRef.current;
      if (snapshot.length === 0) {
        setError(null);
        return;
      }

      setIsSyncing(true);
      try {
        for (const item of snapshot) {
          const apiId = resolveApiItemId(item.id);
          await deleteCartItemRequest(apiId);
        }
        await loadCart();
        setError(null);
      } catch (err) {
        const normalized =
          err instanceof Error ? err : new Error("Không thể xoá toàn bộ giỏ hàng");
        setError(normalized);
        console.error("Không thể xoá toàn bộ giỏ hàng:", err);
        throw normalized;
      } finally {
        setIsSyncing(false);
      }
    },
    [currentUser, loadCart, commitItems, resolveApiItemId],
  );

  const refetch = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  const totalItems = items.length;
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items],
  );
  const totalAdults = useMemo(
    () => items.reduce((sum, item) => sum + item.adultCount, 0),
    [items],
  );
  const totalChildren = useMemo(
    () => items.reduce((sum, item) => sum + item.childCount, 0),
    [items],
  );

  const value: CartContextValue = {
    items,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalAmount,
    totalAdults,
    totalChildren,
    isLoading,
    isSyncing,
    error,
    refetch,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được sử dụng bên trong CartProvider");
  }
  return context;
};
