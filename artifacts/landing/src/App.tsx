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
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

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

const queryClient = new QueryClient();

const App = () => (
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

              {/* Dashboard (protected) */}
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
              </Route>

              {/* Admin panel (protected, admin-only) */}
              <Route path="/admin" element={<AdminPanel />} />

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

export default App;
