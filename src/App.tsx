import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useFcmService } from "@/services/fcm";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import ShortcutsHelpModal from "@/components/ShortcutsHelpModal";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import LeadsPage from "@/pages/LeadsPage";
import LeadDetailPage from "@/pages/LeadDetailPage";
import ListingsPage from "@/pages/ListingsPage";
import ListingDetailPage from "@/pages/ListingDetailPage";
import DealsPage from "@/pages/DealsPage";
import ViewingsPage from "@/pages/ViewingsPage";
import CommissionsPage from "@/pages/CommissionsPage";
import TasksPage from "@/pages/TasksPage";
import AgentsPage from "@/pages/AgentsPage";
import SettingsPage from "@/pages/SettingsPage";
import OfficesPage from "@/pages/OfficesPage";
import NotificationPreferencesPage from "@/pages/NotificationPreferencesPage";
import CalendarPage from "@/pages/CalendarPage";
import RemindersPage from "@/pages/RemindersPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OnboardingPage from "@/pages/OnboardingPage";
import AppLayout from "@/components/layout/AppLayout";
import BrochurePage from "@/pages/BrochurePage";
import ClientPortalPage from "@/pages/ClientPortalPage";
import ExpensesPage from "@/pages/ExpensesPage";
import PhToolsPage from "@/pages/PhToolsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import VaultPage from "@/pages/VaultPage";
import MortgagePage from "@/pages/MortgagePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ChecklistTemplatesPage from "@/pages/ChecklistTemplatesPage";
import ActivityPage from "@/pages/ActivityPage";
import ToursPage from "@/pages/ToursPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import { OfflineIndicator } from "@/components/OfflineIndicator";

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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/b/:listingId" element={<BrochurePage />} />
          <Route path="/p/:leadToken" element={<ClientPortalPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/leads/:id" element={<LeadDetailPage />} />
              <Route path="/listings" element={<ListingsPage />} />
              <Route path="/listings/:id" element={<ListingDetailPage />} />
              <Route path="/deals" element={<DealsPage />} />
              <Route path="/viewings" element={<ViewingsPage />} />
              <Route path="/commissions" element={<CommissionsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/ph-tools" element={<PhToolsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
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
              <Route path="/tours" element={<ToursPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route
                path="/settings/notifications"
                element={<NotificationPreferencesPage />}
              />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
