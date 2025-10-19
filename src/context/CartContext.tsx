import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "./UserContext";

export interface CartItem {
  id: string;
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
  addItem: (input: CartItemInput) => void;
  updateItemQuantity: (id: string, params: { adults: number; children: number }) => void;
  removeItem: (id: string) => void;
  clearCart: (options?: { persist?: boolean }) => void;
  totalItems: number;
  totalAmount: number;
  totalAdults: number;
  totalChildren: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY_PREFIX = "trip-curate-cart";
const LEGACY_STORAGE_KEY = STORAGE_KEY_PREFIX;

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildStorageKey = (identifier: string | null) =>
  identifier ? `${STORAGE_KEY_PREFIX}-${identifier}` : null;

const readCartFromStorage = (storageKey: string | null): CartItem[] => {
  if (typeof window === "undefined" || !storageKey) return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem => typeof item === "object" && item !== null);
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useUser();
  const [items, setItems] = useState<CartItem[]>([]);
  const skipNextPersistRef = useRef(false);

  const storageIdentifier = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.id !== undefined && currentUser.id !== null) {
      return String(currentUser.id);
    }
    if (currentUser.email) {
      return `email:${currentUser.email}`;
    }
    return null;
  }, [currentUser]);

  const activeStorageKey = useMemo(() => buildStorageKey(storageIdentifier), [storageIdentifier]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!storageIdentifier) {
      setItems([]);
      return;
    }

    const storedCart = readCartFromStorage(activeStorageKey);
    if (storedCart.length > 0) {
      setItems(storedCart);
      return;
    }

    const legacyCart = readCartFromStorage(LEGACY_STORAGE_KEY);
    if (legacyCart.length > 0) {
      setItems(legacyCart);
      try {
        window.localStorage.setItem(activeStorageKey!, JSON.stringify(legacyCart));
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (error) {
        console.warn("Không thể migrate giỏ hàng sang tài khoản:", error);
      }
      return;
    }

    setItems([]);
  }, [activeStorageKey, storageIdentifier]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeStorageKey) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    try {
      window.localStorage.setItem(activeStorageKey, JSON.stringify(items));
    } catch (error) {
      console.warn("Không thể lưu giỏ hàng vào localStorage:", error);
    }
  }, [items, activeStorageKey]);

  const addItem = (input: CartItemInput) => {
    setItems((prev) => {
      const key = `${input.tourId}-${input.packageId}-${input.scheduleId ?? "none"}`;
      const existing = prev.find((item) => `${item.tourId}-${item.packageId}-${item.scheduleId ?? "none"}` === key);
      const adultCount = Math.max(0, input.adultCount);
      const childCount = Math.max(0, input.childCount);
      const totalPrice = adultCount * input.adultPrice + childCount * input.childPrice;

      if (existing) {
        return prev.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                adultCount: item.adultCount + adultCount,
                childCount: item.childCount + childCount,
                totalPrice:
                  (item.adultCount + adultCount) * item.adultPrice +
                  (item.childCount + childCount) * item.childPrice,
                addedAt: new Date().toISOString(),
              }
            : item,
        );
      }

      const newItem: CartItem = {
        id: createId(),
        tourId: input.tourId,
        tourTitle: input.tourTitle,
        packageId: input.packageId,
        packageName: input.packageName,
        scheduleId: input.scheduleId,
        scheduleTitle: input.scheduleTitle,
        thumbnail: input.thumbnail,
        adultCount,
        childCount,
        adultPrice: input.adultPrice,
        childPrice: input.childPrice,
        totalPrice,
        addedAt: new Date().toISOString(),
      };
      return [newItem, ...prev];
    });
  };

  const updateItemQuantity = (id: string, params: { adults: number; children: number }) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const adults = Math.max(0, params.adults);
          const children = Math.max(0, params.children);
          const totalPrice = adults * item.adultPrice + children * item.childPrice;
          return {
            ...item,
            adultCount: adults,
            childCount: children,
            totalPrice,
          };
        })
        .filter((item) => item.adultCount + item.childCount > 0),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = (options?: { persist?: boolean }) => {
    if (options?.persist === false) {
      skipNextPersistRef.current = true;
      setItems([]);
      return;
    }
    setItems([]);
    if (typeof window === "undefined" || !activeStorageKey) return;
    try {
      window.localStorage.removeItem(activeStorageKey);
    } catch (error) {
      console.warn("Không thể xóa giỏ hàng khỏi localStorage:", error);
    }
  };

  const totalItems = useMemo(() => items.length, [items]);
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
