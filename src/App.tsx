import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppLayout } from "@/components/AppLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const MemberForm = lazy(() => import("./pages/MemberForm"));
const Subscription = lazy(() => import("./pages/Subscription"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Install = lazy(() => import("./pages/Install"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { hasAccess, profileQuery } = useProfile();
  if (profileQuery.isLoading) return <PageLoader />;
  if (!profileQuery.data) return <>{children}</>;
  if (!hasAccess) return <Navigate to="/subscription" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="gymflow-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/install" element={<Install />} />

                <Route
                  path="/admin"
                  element={
                    <AdminAuthProvider>
                      <AdminLogin />
                    </AdminAuthProvider>
                  }
                />
                <Route
                  element={
                    <AdminAuthProvider>
                      <AdminLayout />
                    </AdminAuthProvider>
                  }
                >
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                </Route>

                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/dashboard" element={<SubscriptionGate><Dashboard /></SubscriptionGate>} />
                  <Route path="/members" element={<SubscriptionGate><Members /></SubscriptionGate>} />
                  <Route path="/members/new" element={<SubscriptionGate><MemberForm /></SubscriptionGate>} />
                  <Route path="/members/:id/edit" element={<SubscriptionGate><MemberForm /></SubscriptionGate>} />
                  <Route path="/attendance" element={<SubscriptionGate><AttendancePage /></SubscriptionGate>} />
                  <Route path="/expenses" element={<SubscriptionGate><ExpensesPage /></SubscriptionGate>} />
                  <Route path="/inventory" element={<SubscriptionGate><InventoryPage /></SubscriptionGate>} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
