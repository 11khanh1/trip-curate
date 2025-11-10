import type { FC } from "react";
import { useGoogleMap } from "@/hooks/useGoogleMap";

interface GoogleMapEmbedProps {
  lat?: number;
  lng?: number;
  address?: string;
  zoom?: number;
  title?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const GoogleMapEmbed: FC<GoogleMapEmbedProps> = ({
  lat,
  lng,
  address,
  zoom = 13,
  title,
  className,
}) => {
  const normalizedLat = typeof lat === "number" ? clamp(lat, -90, 90) : undefined;
  const normalizedLng = typeof lng === "number" ? clamp(lng, -180, 180) : undefined;
  const { mapRef, isLoading, error } = useGoogleMap({
    lat: normalizedLat,
    lng: normalizedLng,
    address,
    zoom,
    title,
  });

  if (error) {
    return (
      <div
        className={`flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 text-sm text-red-600 ${className ?? ""}`}
      >
        {error}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 ${className ?? ""}`}>
      {isLoading ? (
        <div className="flex h-[260px] items-center justify-center bg-slate-50 text-sm text-muted-foreground">
          Đang tải bản đồ Google...
        </div>
      ) : null}
      <div ref={mapRef} className={`h-[260px] w-full ${isLoading ? "opacity-0" : "opacity-100"}`} />
    </div>
  );
};

export default GoogleMapEmbed;
