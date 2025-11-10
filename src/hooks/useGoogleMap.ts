import { useEffect, useRef, useState } from "react";

declare const google: any;

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

export const useGoogleMap = (options: {
  lat: number;
  lng: number;
  zoom?: number;
  title?: string;
}): UseGoogleMapResult => {
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

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!isMounted || !containerRef.current) return;
        const center = { lat: options.lat, lng: options.lng };
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
  }, [options.lat, options.lng, options.zoom, options.title]);

  return {
    mapRef: (node) => {
      containerRef.current = node;
    },
    isLoading,
    error,
  };
};
