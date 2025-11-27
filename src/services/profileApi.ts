import { apiClient, ensureCsrfToken, extractData } from "@/lib/api-client";

export interface UserProfile {
  id?: string | number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  preferences?: string[] | null;
  gender?: string | null;
  date_of_birth?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

export type UpdateProfilePayload = Partial<{
  name: string;
  email: string;
  phone: string;
  preferences: string[];
  gender: string;
  date_of_birth: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}>;

export interface ProfileUpdateResult {
  profile: UserProfile;
  message?: string;
}

export const PROFILE_QUERY_KEY = ["profile", "current"] as const;

const unwrapProfile = (payload: unknown): UserProfile => {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (record.profile && typeof record.profile === "object") {
      return record.profile as UserProfile;
    }
  }
  return (payload ?? {}) as UserProfile;
};

const readMessage = (response: any): string | undefined => {
  if (!response) return undefined;
  if (typeof response.message === "string") return response.message;
  if (response.data && typeof response.data.message === "string") {
    return response.data.message;
  }
  return undefined;
};

export const fetchProfile = async (): Promise<UserProfile> => {
  const res = await apiClient.get("/profile");
  const payload = extractData<unknown>(res);
  return unwrapProfile(payload);
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<ProfileUpdateResult> => {
  await ensureCsrfToken();
  const res = await apiClient.put("/profile", payload);
  const extracted = extractData<unknown>(res);
  return {
    profile: unwrapProfile(extracted),
    message: readMessage(res?.data ?? res),
  };
};
