import { apiClient, extractData } from "@/lib/api-client";

export interface CartItemRequest {
  tour_id: string;
  package_id?: string;
  schedule_id?: string | null;
  adults: number;
  children: number;
}

export interface UpdateCartItemRequest {
  adults: number;
  children: number;
}

export type CartApiItem = Record<string, unknown>;

export interface CartApiResponse {
  items?: CartApiItem[];
  total_amount?: number;
  total_items?: number;
  total_adults?: number;
  total_children?: number;
  [key: string]: unknown;
}

export const fetchCart = async (): Promise<CartApiResponse> => {
  const response = await apiClient.get("/cart");
  return extractData<CartApiResponse>(response);
};

export const addCartItem = async (payload: CartItemRequest): Promise<CartApiResponse> => {
  const response = await apiClient.post("/cart/items", payload);
  return extractData<CartApiResponse>(response);
};

export const updateCartItem = async (
  id: string,
  payload: UpdateCartItemRequest,
): Promise<CartApiResponse> => {
  const response = await apiClient.put(`/cart/items/${id}`, payload);
  return extractData<CartApiResponse>(response);
};

export const deleteCartItem = async (id: string): Promise<CartApiResponse> => {
  const response = await apiClient.delete(`/cart/items/${id}`);
  return extractData<CartApiResponse>(response);
};
