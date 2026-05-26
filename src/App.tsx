import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import LeadsPage from '@/pages/LeadsPage';
import LeadDetailPage from '@/pages/LeadDetailPage';
import ListingsPage from '@/pages/ListingsPage';
import ListingDetailPage from '@/pages/ListingDetailPage';
import DealsPage from '@/pages/DealsPage';
import ViewingsPage from '@/pages/ViewingsPage';
import CommissionsPage from '@/pages/CommissionsPage';
import TasksPage from '@/pages/TasksPage';
import AgentsPage from '@/pages/AgentsPage';
import SettingsPage from '@/pages/SettingsPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import OnboardingPage from '@/pages/OnboardingPage';
import AppLayout from '@/components/layout/AppLayout';
import BrochurePage from '@/pages/BrochurePage';
import ClientPortalPage from '@/pages/ClientPortalPage';
import ExpensesPage from '@/pages/ExpensesPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
