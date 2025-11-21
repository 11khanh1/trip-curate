import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatWidgetProvider } from "@/context/ChatWidgetContext";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";
import Index from "./pages/Index";
import AllActivities from "./pages/AllActivities";
import ActivityDetail from "./pages/ActivityDetail";
import NotFound from "./pages/NotFound";
import Partner from "./pages/partner/Partner";
import Deals from "./pages/Deals";
import OurStory from "./pages/about/OurStory";
import Careers from "./pages/about/Careers";
import Press from "./pages/about/Press";
import Partnership from "./pages/about/Partnership";
import Affiliate from "./pages/about/Affiliate";
import HelpCenter from "./pages/support/HelpCenter";
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
import PartnerSettings from "./pages/partner/Settings";
import PartnerPromotions from "./pages/partner/Promotions";
import PartnerRefundRequests from "./pages/partner/RefundRequests";
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
import RecentToursPage from "./pages/recent/RecentToursPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";

const App = () => (
  <TooltipProvider>
    <ChatWidgetProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/activities" element={<AllActivities />} />
            <Route path="/activity/:id" element={<ActivityDetail />} />
            <Route path="/recent" element={<RecentToursPage />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/resultsearch" element={<ResultSearch />} />
            <Route path="/bookings" element={<BookingsList />} />
            <Route path="/bookings/new" element={<BookingCheckout />} />
            <Route path="/bookings/:id" element={<BookingDetail />} />
            <Route path="/payments/sepay/gateway" element={<SepayGateway />} />
            <Route path="/payments/sepay/return" element={<SepayReturn />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/about/our-story" element={<OurStory />} />
            <Route path="/about/careers" element={<Careers />} />
            <Route path="/about/press" element={<Press />} />
            <Route path="/about/partnership" element={<Partnership />} />
            <Route path="/about/affiliate" element={<Affiliate />} />
            <Route path="/support/help-center" element={<HelpCenter />} />
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
          <Route path="promotions" element={<PartnerPromotions />} />
          <Route path="refund-requests" element={<PartnerRefundRequests />} />
          <Route path="bookings" element={<PartnerBookings />} />
          <Route path="settings" element={<PartnerSettings />} />
        </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      <FloatingChatWidget />
    </ChatWidgetProvider>
  </TooltipProvider>
);

export default App;
