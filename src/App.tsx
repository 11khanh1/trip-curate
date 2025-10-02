import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AllActivities from "./pages/AllActivities";
import NotFound from "./pages/NotFound";
import Vietnam from "./pages/regions/Vietnam";
import Japan from "./pages/regions/Japan";
import Singapore from "./pages/regions/Singapore";
import Thailand from "./pages/regions/Thailand";
import China from "./pages/regions/China";
import SouthKorea from "./pages/regions/SouthKorea";
import Australia from "./pages/regions/Australia";
import UK from "./pages/regions/UK";
import Switzerland from "./pages/regions/Switzerland";
import USA from "./pages/regions/USA";
import Malaysia from "./pages/regions/Malaysia";
import Indonesia from "./pages/regions/Indonesia";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/activities" element={<AllActivities />} />
          <Route path="/regions/vietnam" element={<Vietnam />} />
          <Route path="/regions/japan" element={<Japan />} />
          <Route path="/regions/singapore" element={<Singapore />} />
          <Route path="/regions/thailand" element={<Thailand />} />
          <Route path="/regions/china" element={<China />} />
          <Route path="/regions/south-korea" element={<SouthKorea />} />
          <Route path="/regions/australia" element={<Australia />} />
          <Route path="/regions/uk" element={<UK />} />
          <Route path="/regions/switzerland" element={<Switzerland />} />
          <Route path="/regions/usa" element={<USA />} />
          <Route path="/regions/malaysia" element={<Malaysia />} />
          <Route path="/regions/indonesia" element={<Indonesia />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
