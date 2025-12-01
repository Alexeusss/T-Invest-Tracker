
import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/Dashboard';
import { SettingsPage } from './pages/Settings';
import { ForecastPage } from './pages/Forecast';
import { OperationsPage } from './pages/Operations';

const App: React.FC = () => {
  return (
    <AppProvider>
      <MemoryRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </MemoryRouter>
    </AppProvider>
  );
};

export default App;
