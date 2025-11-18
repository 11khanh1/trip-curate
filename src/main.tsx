import { createRoot } from "react-dom/client";
// --- BẮT ĐẦU SỬA LỖI 419 ---
import { useEffect } from "react";
// --- KẾT THÚC SỬA LỖI 419 ---
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { UserProvider } from "./context/UserContext";
import App from "./App.tsx";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";

// --- BẮT ĐẦU SỬA LỖI 419 ---
// Import hàm "mồi" token từ file api-client
import { primeCsrfToken } from "@/lib/api-client";
// --- KẾT THÚC SỬA LỖI 419 ---


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // keep cache 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

const persister = (() => {
  if (typeof window === "undefined") return null;
  try {
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: "trip-curate-admin-cache",
    });
  } catch (error) {
    console.warn("Không thể khởi tạo bộ nhớ cache cho React Query:", error);
    return null;
  }
})();

// --- BẮT ĐẦU SỬA LỖI 419 ---
/**
 * Tạo một component Wrapper cho <App />
 * để chúng ta có thể gọi hook useEffect
 */
const AppWrapper = () => {
  useEffect(() => {
    // Gọi API để lấy cookie CSRF ban đầu
    primeCsrfToken().catch((error) => {
      // Ghi log lỗi, nhưng không làm crash ứng dụng
      console.error("Could not prime CSRF token:", error);
    });
  }, []); // Mảng rỗng [] đảm bảo hàm này chỉ chạy 1 LẦN DUY NHẤT

  return <App />;
};
// --- KẾT THÚC SỬA LỖI 419 ---


const Root = persister ? (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister,
      maxAge: 1000 * 60 * 30, // 30 minutes
    }}
    onSuccess={() => {
      queryClient.resumePausedMutations().catch((error) => {
        console.error("Không thể khôi phục mutation đã tạm dừng:", error);
      });
    }}
  >
    <AnalyticsProvider>
      <UserProvider>
        <CartProvider>
          <AppWrapper /> {/* <-- Thay <App /> bằng <AppWrapper /> */}
        </CartProvider>
      </UserProvider>
    </AnalyticsProvider>
  </PersistQueryClientProvider>
) : (
  <QueryClientProvider client={queryClient}>
    <AnalyticsProvider>
      <UserProvider>
        <CartProvider>
          <AppWrapper /> {/* <-- Thay <App /> bằng <AppWrapper /> */}
        </CartProvider>
      </UserProvider>
    </AnalyticsProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(Root);
