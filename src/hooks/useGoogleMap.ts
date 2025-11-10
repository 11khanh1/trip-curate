import { useEffect, useRef, useState } from "react";

declare const google: any;

interface UseGoogleMapOptions {
  lat?: number;
  lng?: number;
  address?: string;
  zoom?: number;
  title?: string;
}

interface UseGoogleMapResult {
  mapRef: (node: HTMLDivElement | null) => void;
  isLoading: boolean;
  error: string | null;
}

const scriptStatus: {
  loaded: boolean;
  loading: boolean;
  callbacks: Array<() => void>;
} = {
  loaded: false,
  loading: false,
  callbacks: [],
};

const loadGoogleMapsScript = (apiKey: string) =>
  new Promise<void>((resolve, reject) => {
    if (scriptStatus.loaded) {
      resolve();
      return;
    }
    scriptStatus.callbacks.push(resolve);
    if (scriptStatus.loading) return;
    scriptStatus.loading = true;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=vi`;
    script.async = true;
    script.defer = true;
    script.onerror = (event) => reject(event);
    script.onload = () => {
      scriptStatus.loaded = true;
      scriptStatus.loading = false;
      scriptStatus.callbacks.forEach((cb) => cb());
      scriptStatus.callbacks = [];
    };
    document.head.appendChild(script);
  });

export const useGoogleMap = (options: UseGoogleMapOptions): UseGoogleMapResult => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Thiếu Google Maps API Key");
      setIsLoading(false);
      return;
    }
    let isMounted = true;

    const initializeMap = (center: { lat: number; lng: number }) => {
      if (!isMounted || !containerRef.current) return;
      const map = new google.maps.Map(containerRef.current, {
        center,
        zoom: options.zoom ?? 13,
        disableDefaultUI: true,
        zoomControl: true,
      });
      new google.maps.Marker({
        position: center,
        map,
        title: options.title,
      });
      setIsLoading(false);
    };

    const handleMissingData = () => {
      setError("Không có tọa độ hoặc địa chỉ hợp lệ.");
      setIsLoading(false);
    };

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (typeof options.lat === "number" && typeof options.lng === "number") {
          initializeMap({ lat: options.lat, lng: options.lng });
          return;
        }
        if (!options.address) {
          handleMissingData();
          return;
        }
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: options.address }, (results, status) => {
          if (!isMounted) return;
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            initializeMap({ lat: location.lat(), lng: location.lng() });
          } else {
            console.warn("Geocoder không tìm thấy địa điểm:", status);
            handleMissingData();
          }
        });
      })
      .catch((err) => {
        console.error("Không thể tải Google Maps:", err);
        if (isMounted) {
          setError("Không thể tải bản đồ Google");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [options.lat, options.lng, options.address, options.zoom, options.title]);

  return {
    mapRef: (node) => {
      containerRef.current = node;
    },
    isLoading,
    error,
  };
};
