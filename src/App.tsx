import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import Index from "./pages/Index";
import AllActivities from "./pages/AllActivities";
import ActivityDetail from "./pages/ActivityDetail";
import NotFound from "./pages/NotFound";
import Partner from "./pages/partner/Partner";
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
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Promotions from "./pages/admin/Promotions";
import Settings from "./pages/admin/Settings";
import AdminUsers from "./pages/admin/Users";
import AdminPartners from "./pages/admin/Partners";
import AdminTours from "./pages/admin/Tours";
import AdminCategories from "./pages/admin/Categories";
import AdminReports from "./pages/admin/Reports";
import AdminAdmins from "./pages/admin/Admins";
import PartnerLayout from "./pages/partner/PartnerLayout";
import PartnerDashboard from "./pages/partner/Dashboard";
import PartnerActivities from "./pages/partner/Activities";
import PartnerBookings from "./pages/partner/Bookings";
import PartnerRevenue from "./pages/partner/Revenue";
import PartnerAnalytics from "./pages/partner/Analytics";
import PartnerSettings from "./pages/partner/Settings";
import AuthCallback from "./pages/AuthCallback";
import ResultSearch from "./pages/ResultSearch";
import ScrollToTop from "@/components/ScrollToTop";
import BookingsList from "./pages/bookings/BookingsList";
import BookingDetail from "./pages/bookings/BookingDetail";
import BookingCheckout from "./pages/bookings/BookingCheckout";
import SepayGateway from "./pages/payments/SepayGateway";
import SepayReturn from "./pages/payments/SepayReturn";
import CartPage from "./pages/Cart";
import Wishlist from "./pages/Wishlist";

const App = () => (
  <TooltipProvider>
    <AnalyticsProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
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
        <Route path="/resultsearch" element={<ResultSearch />} />
        <Route path="/bookings" element={<BookingsList />} />
        <Route path="/bookings/new" element={<BookingCheckout />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/payments/sepay/gateway" element={<SepayGateway />} />
        <Route path="/payments/sepay/return" element={<SepayReturn />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
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
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<AdminUsers />} />
            <Route path="partners" element={<AdminPartners />} />
            <Route path="tours" element={<AdminTours />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admins" element={<AdminAdmins />} />
        </Route>
        <Route path="/partner" element={<PartnerLayout />}>
          <Route index element={<PartnerDashboard />} />
          <Route path="activities" element={<PartnerActivities />} />
          <Route path="bookings" element={<PartnerBookings />} />
          <Route path="revenue" element={<PartnerRevenue />} />
          <Route path="analytics" element={<PartnerAnalytics />} />
          <Route path="settings" element={<PartnerSettings />} />
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </BrowserRouter>
    </AnalyticsProvider>
  </TooltipProvider>
);

export default App;
