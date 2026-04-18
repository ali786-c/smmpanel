import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsent from "@/components/CookieConsent";
import { AuthProvider } from "@/hooks/useAuth";

import Index from "./pages/Index";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Maintenance from "./pages/Maintenance";

/**
 * MAINTENANCE MODE TOGGLE
 * Set to true to enable the maintenance page across the entire site.
 */
const MAINTENANCE_MODE = false;

// Dashboard sub-pages
import NewOrder from "./pages/dashboard/NewOrder";
import Orders from "./pages/dashboard/Orders";
import MassOrder from "./pages/dashboard/MassOrder";
import WalletPage from "./pages/dashboard/WalletPage";
import Tickets from "./pages/dashboard/Tickets";
import Services from "./pages/dashboard/Services";
import Updates from "./pages/dashboard/Updates";
import ApiDocs from "./pages/dashboard/ApiDocs";
import Affiliates from "./pages/dashboard/Affiliates";
import SpendingAnalytics from "./pages/dashboard/SpendingAnalytics";
import Settings from "./pages/dashboard/Settings";
import AccountManagement from "./pages/dashboard/AccountManagement";
import Support from "./pages/dashboard/Support";
import AddFunds from "./pages/dashboard/AddFunds";
import PaymentSuccess from "./pages/dashboard/PaymentSuccess";
import PaymentCancel from "./pages/dashboard/PaymentCancel";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminManualOrder from "./pages/admin/AdminManualOrder";
import AdminServices from "./pages/admin/AdminServices";
import AdminMarkupEditor from "./pages/admin/AdminMarkupEditor";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AdminRevenueExport from "./pages/admin/AdminRevenueExport";
import AdminProviderSync from "./pages/admin/AdminProviderSync";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminMassNotification from "./pages/admin/AdminMassNotification";
import AdminAffiliates from "./pages/admin/AdminAffiliates";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminGrowth from "./pages/admin/AdminGrowth";
import AdminSystemSettings from "./pages/admin/AdminSystemSettings";
import AdminAIBlogging from "./pages/admin/AdminAIBlogging";

const queryClient = new QueryClient();

const App = () => {
  if (MAINTENANCE_MODE) {
    return (
      <QueryClientProvider client={queryClient}>
        <Maintenance />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Index />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Blog */}
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />

                {/* User Dashboard (protected) */}
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route path="new-order" element={<NewOrder />} />
                  <Route path="mass-order" element={<MassOrder />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="wallet" element={<WalletPage />} />
                  <Route path="tickets" element={<Tickets />} />
                  <Route path="services" element={<Services />} />
                  <Route path="updates" element={<Updates />} />
                  <Route path="api" element={<ApiDocs />} />
                  <Route path="affiliates" element={<Affiliates />} />
                  <Route path="analytics" element={<SpendingAnalytics />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="account" element={<AccountManagement />} />
                  <Route path="support" element={<Support />} />
                  <Route path="deposit" element={<AddFunds />} />
                  <Route path="payment/success" element={<PaymentSuccess />} />
                  <Route path="payment/cancel" element={<PaymentCancel />} />
                </Route>

                {/* Admin panel (protected, admin-only) */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="users/:userId" element={<AdminUserDetail />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="create-order" element={<AdminManualOrder />} />
                  <Route path="services" element={<AdminServices />} />
                  <Route path="markup" element={<AdminMarkupEditor />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="tickets" element={<AdminTickets />} />
                  <Route path="finance" element={<AdminFinance />} />
                  <Route path="refunds" element={<AdminRefunds />} />
                  <Route path="revenue" element={<AdminRevenueExport />} />
                  <Route path="provider" element={<AdminProviderSync />} />
                  <Route path="blog" element={<AdminBlog />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                  <Route path="mass-notify" element={<AdminMassNotification />} />
                  <Route path="affiliates" element={<AdminAffiliates />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="activity" element={<AdminActivityLog />} />
                  <Route path="growth" element={<AdminGrowth />} />
                  <Route path="ai-blogging" element={<AdminAIBlogging />} />
                  <Route path="settings" element={<AdminSystemSettings />} />
                  <Route path="payments" element={<AdminFinance />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CookieConsent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
