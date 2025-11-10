interface GeocodeResult {
  lat: number;
  lng: number;
}

const geocodeCache = new Map<string, GeocodeResult | null>();

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const normalizedAddress = address.trim();
  if (!normalizedAddress) return null;
  if (geocodeCache.has(normalizedAddress)) {
    return geocodeCache.get(normalizedAddress) ?? null;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("Thiếu VITE_GOOGLE_MAPS_API_KEY - không thể geocode.");
    geocodeCache.set(normalizedAddress, null);
    return null;
  }

  const endpoint = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  endpoint.searchParams.set("address", normalizedAddress);
  endpoint.searchParams.set("key", apiKey);

  try {
    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      throw new Error(`Geocode API trả về ${response.status}`);
    }
    const payload = (await response.json()) as {
      status?: string;
      results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
    };
    if (payload.status === "OK" && payload.results && payload.results.length > 0) {
      const location = payload.results[0].geometry?.location;
      if (location && typeof location.lat === "number" && typeof location.lng === "number") {
        const result: GeocodeResult = { lat: location.lat, lng: location.lng };
        geocodeCache.set(normalizedAddress, result);
        return result;
      }
    } else if (payload.status === "ZERO_RESULTS") {
      console.info(`Geocode không tìm thấy tọa độ cho: ${normalizedAddress}`);
    } else {
      console.warn(`Geocode API trả về trạng thái ${payload.status}`);
    }
  } catch (error) {
    console.error("Không thể geocode địa điểm:", error);
  }

  geocodeCache.set(normalizedAddress, null);
  return null;
}
