import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/layout/Layout';

import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { RequestsPage } from './pages/employee/RequestsPage';
import { RequestDetailPage } from './pages/employee/RequestDetailPage';
import { LeaveDashboardPage } from './pages/employee/LeaveDashboardPage';
import { LeaveDetailPage } from './pages/employee/LeaveDetailPage';
import { PolicySearchPage } from './pages/employee/PolicySearchPage';
import { AdvocacyPage } from './pages/employee/AdvocacyPage';

import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';
import { HRDashboardPage } from './pages/hr/HRDashboardPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route path="/" element={<Layout />}>
                <Route index element={<EmployeeDashboard />} />
                <Route path="requests" element={<RequestsPage />} />
                <Route path="requests/:id" element={<RequestDetailPage />} />
                <Route path="leave" element={<LeaveDashboardPage />} />
                <Route path="leave/:id" element={<LeaveDetailPage />} />
                <Route path="policies" element={<PolicySearchPage />} />
                <Route path="advocacy" element={<AdvocacyPage />} />

                <Route path="manager" element={<ManagerDashboardPage />} />
                <Route path="hr" element={<HRDashboardPage />} />
                <Route path="admin" element={<AdminDashboardPage />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
