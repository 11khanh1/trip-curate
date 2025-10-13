import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { UserProvider } from "./context/UserContext";
import App from "./App.tsx";
import "./index.css";

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
    <UserProvider>
      <App />
    </UserProvider>
  </PersistQueryClientProvider>
) : (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <App />
    </UserProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(Root);
