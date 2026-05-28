import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useFcmService } from "@/services/fcm";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import ShortcutsHelpModal from "@/components/ShortcutsHelpModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastContainer } from "@/components/ui/Toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { OfflineIndicator } from "@/components/OfflineIndicator";

// Lazy-loaded pages — code-split by route for faster initial load
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const LeadsPage = lazy(() => import("@/pages/LeadsPage"));
const LeadDetailPage = lazy(() => import("@/pages/LeadDetailPage"));
const ListingsPage = lazy(() => import("@/pages/ListingsPage"));
const ListingDetailPage = lazy(() => import("@/pages/ListingDetailPage"));
const DealsPage = lazy(() => import("@/pages/DealsPage"));
const ViewingsPage = lazy(() => import("@/pages/ViewingsPage"));
const CommissionsPage = lazy(() => import("@/pages/CommissionsPage"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const AgentsPage = lazy(() => import("@/pages/AgentsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const OfficesPage = lazy(() => import("@/pages/OfficesPage"));
const NotificationPreferencesPage = lazy(
  () => import("@/pages/NotificationPreferencesPage"),
);
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const RemindersPage = lazy(() => import("@/pages/RemindersPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const BrochurePage = lazy(() => import("@/pages/BrochurePage"));
const ClientPortalPage = lazy(() => import("@/pages/ClientPortalPage"));
const ExpensesPage = lazy(() => import("@/pages/ExpensesPage"));
const PhToolsPage = lazy(() => import("@/pages/PhToolsPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const VaultPage = lazy(() => import("@/pages/VaultPage"));
const MortgagePage = lazy(() => import("@/pages/MortgagePage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ChecklistTemplatesPage = lazy(
  () => import("@/pages/ChecklistTemplatesPage"),
);
const ActivityPage = lazy(() => import("@/pages/ActivityPage"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const ProjectDetailPage = lazy(
  () => import("@/components/projects/ProjectDetail"),
);
const MarketPage = lazy(() => import("@/pages/MarketPage"));
const LicensesPage = lazy(() => import("@/pages/LicensesPage"));
const ToursPage = lazy(() => import("@/pages/ToursPage"));
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage"));
const PayoutsPage = lazy(() => import("@/pages/PayoutsPage"));
const ImportPage = lazy(() => import("@/pages/ImportPage"));
const MapPage = lazy(() => import("@/pages/MapPage"));
const LoanCalculatorPage = lazy(() => import("@/pages/LoanCalculatorPage"));
const CoBrokeragePage = lazy(() => import("@/pages/CoBrokeragePage"));
const DocumentsPage = lazy(() => import("@/pages/DocumentsPage"));
const CompliancePage = lazy(() => import("@/pages/CompliancePage"));
const CMAPage = lazy(() => import("@/pages/CMAPage"));
const SeedDataPage = lazy(() => import("@/pages/SeedDataPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function AppContent() {
  useFcmService();
  return null;
}

function AppKeyboardShortcuts() {
  const { helpOpen, setHelpOpen, shortcuts } = useKeyboardShortcuts();
  return (
    <ShortcutsHelpModal
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      shortcuts={shortcuts}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineIndicator />
        <AppContent />
        <AppKeyboardShortcuts />
        <ToastContainer />
        <Suspense fallback={<PageLoader />}>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/b/:listingId" element={<BrochurePage />} />
              <Route path="/p/:leadToken" element={<ClientPortalPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/leads/:id" element={<LeadDetailPage />} />
                  <Route path="/listings" element={<ListingsPage />} />
                  <Route path="/listings/:id" element={<ListingDetailPage />} />
                  <Route path="/deals" element={<DealsPage />} />
                  <Route path="/viewings" element={<ViewingsPage />} />
                  <Route path="/commissions" element={<CommissionsPage />} />
                  <Route path="/payouts" element={<PayoutsPage />} />
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/agents" element={<AgentsPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/ph-tools" element={<PhToolsPage />} />
                  <Route
                    path="/notifications"
                    element={<NotificationsPage />}
                  />
                  <Route path="/offices" element={<OfficesPage />} />
                  <Route path="/vault" element={<VaultPage />} />
                  <Route path="/mortgages" element={<MortgagePage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/reminders" element={<RemindersPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route
                    path="/checklist-templates"
                    element={<ChecklistTemplatesPage />}
                  />
                  <Route path="/activity" element={<ActivityPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/market" element={<MarketPage />} />
                  <Route path="/licenses" element={<LicensesPage />} />
                  <Route path="/tours" element={<ToursPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/loans" element={<LoanCalculatorPage />} />
                  <Route path="/cobrokerage" element={<CoBrokeragePage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                  <Route path="/compliance" element={<CompliancePage />} />
                  <Route path="/cma" element={<CMAPage />} />
                  <Route
                    path="/settings/notifications"
                    element={<NotificationPreferencesPage />}
                  />
                  <Route path="/seed-data" element={<SeedDataPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
