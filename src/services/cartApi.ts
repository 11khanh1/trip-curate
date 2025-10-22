import { apiClient, extractData } from "@/lib/api-client";

type QuantityInputValue = number | string | null | undefined;

export interface CartItemQuantityInput {
  adults?: QuantityInputValue;
  adult_quantity?: QuantityInputValue;
  adultCount?: QuantityInputValue;
  children?: QuantityInputValue;
  child_quantity?: QuantityInputValue;
  childCount?: QuantityInputValue;
}

export interface CartItemRequest extends CartItemQuantityInput {
  tour_id: string;
  package_id?: string | null;
  schedule_id?: string | null;
}

export interface UpdateCartItemRequest extends CartItemQuantityInput {}

export type CartApiItem = Record<string, unknown>;

export interface CartApiResponse {
  items?: CartApiItem[];
  total_amount?: number;
  total_items?: number;
  total_adults?: number;
  total_children?: number;
  [key: string]: unknown;
}

const parseQuantity = (value: QuantityInputValue): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const normalizeQuantities = (input: CartItemQuantityInput) => {
  const adults =
    parseQuantity(input.adults) ??
    parseQuantity(input.adult_quantity) ??
    parseQuantity(input.adultCount);
  const children =
    parseQuantity(input.children) ??
    parseQuantity(input.child_quantity) ??
    parseQuantity(input.childCount);

  return {
    adults: typeof adults === "number" ? adults : 0,
    children: typeof children === "number" ? children : 0,
  };
};

const normalizeCartPayload = (payload: CartItemRequest) => {
  const { tour_id, package_id, schedule_id } = payload;
  if (!tour_id || typeof tour_id !== "string" || tour_id.trim().length === 0) {
    throw new Error("tour_id is required to add item to cart");
  }

  const trimmedTourId = tour_id.trim();
  const { adults, children } = normalizeQuantities(payload);

  const requestBody: Record<string, unknown> = {
    tour_id: trimmedTourId,
    adults,
    children,
  };
  requestBody.adult_quantity = adults;
  requestBody.child_quantity = children;
  requestBody.adultCount = adults;
  requestBody.childCount = children;

  if (typeof package_id === "string" && package_id.trim().length > 0) {
    requestBody.package_id = package_id.trim();
  }

  if (schedule_id === null) {
    requestBody.schedule_id = null;
  } else if (typeof schedule_id === "string") {
    const trimmedSchedule = schedule_id.trim();
    if (trimmedSchedule.length > 0) {
      requestBody.schedule_id = trimmedSchedule;
    }
  }

  return requestBody;
};

const normalizeUpdatePayload = (payload: UpdateCartItemRequest) => {
  const { adults, children } = normalizeQuantities(payload);
  return {
    adults,
    children,
    adult_quantity: adults,
    child_quantity: children,
    adultCount: adults,
    childCount: children,
  };
};

export const fetchCart = async (): Promise<CartApiResponse> => {
  const response = await apiClient.get("/cart");
  return extractData<CartApiResponse>(response);
};

export const addCartItem = async (payload: CartItemRequest): Promise<CartApiResponse> => {
  const normalizedPayload = normalizeCartPayload(payload);
  const response = await apiClient.post("/cart/items", normalizedPayload);
  return extractData<CartApiResponse>(response);
};

export const updateCartItem = async (
  id: string,
  payload: UpdateCartItemRequest,
): Promise<CartApiResponse> => {
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    throw new Error("cart item id is required to update cart");
  }
  const normalizedPayload = normalizeUpdatePayload(payload);
  const response = await apiClient.put(`/cart/items/${id.trim()}`, normalizedPayload);
  return extractData<CartApiResponse>(response);
};

export const deleteCartItem = async (id: string): Promise<CartApiResponse> => {
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    throw new Error("cart item id is required to delete cart item");
  }
  const response = await apiClient.delete(`/cart/items/${id.trim()}`);
  return extractData<CartApiResponse>(response);
};
