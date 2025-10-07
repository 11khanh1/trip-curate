import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import Index from "./pages/Index";
import AllActivities from "./pages/AllActivities";
import ActivityDetail from "./pages/ActivityDetail";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Partner from "./pages/Partner";
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
import Deals from "./pages/Deals";
import OurStory from "./pages/about/OurStory";
import Careers from "./pages/about/Careers";
import Press from "./pages/about/Press";
import Partnership from "./pages/about/Partnership";
import Affiliate from "./pages/about/Affiliate";
import HelpCenter from "./pages/support/HelpCenter";
import ContactUs from "./pages/support/ContactUs";
import CancellationPolicy from "./pages/support/CancellationPolicy";
import PrivacyPolicy from "./pages/support/PrivacyPolicy";
import TermsOfService from "./pages/support/TermsOfService";
import AccountSettings from "./pages/AccountSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/activities" element={<AllActivities />} />
          <Route path="/activity/:id" element={<ActivityDetail />} />
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
          <Route path="/deals" element={<Deals />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/about/our-story" element={<OurStory />} />
          <Route path="/about/careers" element={<Careers />} />
          <Route path="/about/press" element={<Press />} />
          <Route path="/about/partnership" element={<Partnership />} />
          <Route path="/about/affiliate" element={<Affiliate />} />
          <Route path="/support/help-center" element={<HelpCenter />} />
          <Route path="/support/contact" element={<ContactUs />} />
          <Route path="/support/cancellation-policy" element={<CancellationPolicy />} />
          <Route path="/support/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/support/terms-of-service" element={<TermsOfService />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
