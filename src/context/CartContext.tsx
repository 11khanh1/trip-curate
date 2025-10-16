import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  totalAdults: number;
  totalChildren: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "trip-curate-cart";

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const loadInitialCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem => typeof item === "object" && item !== null);
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadInitialCart());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Không thể lưu giỏ hàng vào localStorage:", error);
    }
  }, [items]);

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

  const clearCart = () => {
    setItems([]);
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
