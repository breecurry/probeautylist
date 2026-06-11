import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { AccountSettings } from '@/pages/AccountSettings';
import { AdminPage } from '@/pages/AdminPage';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import { AvailabilityPage } from '@/pages/AvailabilityPage';
import { BookingsPage } from '@/pages/BookingsPage';
import { ClientDashboard, ProfessionalDashboard } from '@/pages/Dashboards';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { Home } from '@/pages/Home';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { ProfessionalProfilePage } from '@/pages/ProfessionalProfilePage';
import { ProfessionalOnboarding } from '@/pages/ProfessionalOnboarding';
import { ProfessionalOperations } from '@/pages/ProfessionalOperations';
import { ProfessionalSettings } from '@/pages/ProfessionalSettings';
import { SavedSearchesPage } from '@/pages/SavedSearchesPage';
import { SearchPage } from '@/pages/SearchPage';
import { ServicesPage } from '@/pages/ServicesPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="pros/:slug" element={<ProfessionalProfilePage />} />
          <Route path="auth/login" element={<LoginPage />} />
          <Route path="auth/register" element={<RegisterPage />} />
          <Route element={<RequireAuth roles={['client', 'admin']} />}>
            <Route path="client" element={<ClientDashboard />} />
            <Route path="client/bookings" element={<BookingsPage />} />
            <Route path="client/favorites" element={<FavoritesPage />} />
            <Route path="client/saved-searches" element={<SavedSearchesPage />} />
          </Route>
          <Route element={<RequireAuth roles={['professional', 'admin']} />}>
            <Route path="professional" element={<ProfessionalDashboard />} />
            <Route path="professional/onboarding" element={<ProfessionalOnboarding />} />
            <Route path="professional/profile" element={<ProfessionalSettings />} />
            <Route path="professional/services" element={<ServicesPage />} />
            <Route path="professional/availability" element={<AvailabilityPage />} />
            <Route path="professional/operations" element={<ProfessionalOperations />} />
            <Route path="professional/portfolio" element={<PortfolioPage />} />
            <Route path="professional/bookings" element={<BookingsPage />} />
          </Route>
          <Route element={<RequireAuth roles={['client', 'professional', 'admin']} />}>
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="account" element={<AccountSettings />} />
          </Route>
          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
