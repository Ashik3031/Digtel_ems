import { Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesDashboard from './pages/sales/SalesDashboard';
import SalesManagerInsights from './pages/sales/SalesManagerInsights';
import SalesDiscussions from './pages/sales/SalesDiscussions';
import AMDashboard from './pages/am/AMDashboard';
import AMDiscussions from './pages/am/AMDiscussions';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDiscussions from './pages/admin/AdminDiscussions';
import UserManagement from './pages/admin/UserManagement';
import AuditLogViewer from './pages/admin/AuditLogViewer';
import AdminLayout from './layouts/AdminLayout';
import QCDashboard from './pages/qc/QCDashboard';
import QCDiscussions from './pages/qc/QCDiscussions';
import ProtectedRoute from './components/ProtectedRoute';
import SalesAnalytics from './pages/admin/SalesAnalytics';
import PerformanceOverview from './pages/admin/PerformanceOverview';
import TargetManagement from './pages/admin/TargetManagement';
import AgentPerformanceDetail from './pages/admin/AgentPerformanceDetail';
import ActiveProjects from './pages/admin/ActiveProjects';
import BMDashboard from './pages/bm/BMDashboard';
import BMDiscussions from './pages/bm/BMDiscussions';
import ProductionDashboard from './pages/production/ProductionDashboard';

function App() {
  return (
    <SocketProvider>
      <ThemeProvider>
        <ThemeToggle />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Sales Module */}
          <Route element={<ProtectedRoute allowedRoles={['Sales Executive', 'Sales Manager', 'Admin', 'Super Admin']} />}>
            <Route path="/sales" element={<SalesDashboard />} />
            <Route path="/sales/manager-insights" element={<SalesManagerInsights />} />
            <Route path="/sales/discussions" element={<SalesDiscussions />} />
          </Route>

          {/* Account Manager Module */}
          <Route element={<ProtectedRoute allowedRoles={['Account Manager', 'Admin', 'Super Admin']} />}>
            <Route path="/account-manager" element={<AMDashboard />} />
            <Route path="/account-manager/discussions" element={<AMDiscussions />} />
          </Route>

          {/* Admin Module */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="analytics" element={<SalesAnalytics />} />
            <Route path="performance" element={<PerformanceOverview />} />
            <Route path="performance/:agentId" element={<AgentPerformanceDetail />} />
            <Route path="targets" element={<TargetManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="logs" element={<AuditLogViewer />} />
            <Route path="projects" element={<ActiveProjects />} />
            <Route path="discussions" element={<AdminDiscussions />} />
            <Route path="sales-view" element={<SalesDashboard isEmbedded={true} />} />
          </Route>

          {/* Standalone QC Route */}
          <Route element={<ProtectedRoute allowedRoles={['QC', 'Admin', 'Super Admin']} />}>
            <Route path="/qc" element={<QCDashboard />} />
            <Route path="/qc/discussions" element={<QCDiscussions />} />
          </Route>

          {/* Production Route */}
          <Route element={<ProtectedRoute allowedRoles={['Production', 'Admin', 'Super Admin']} />}>
            <Route path="/production" element={<ProductionDashboard />} />
          </Route>

          {/* Other Protect Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'HR', 'Sales Manager', 'Sales Executive', 'Backend Manager', 'Account Manager', 'Backend Team Member', 'QC', 'Production', 'Performance Marketing', 'Client']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Backend Manager', 'Admin', 'Super Admin']} />}>
            <Route path="/backend-manager" element={<BMDashboard />} />
            <Route path="/backend-manager/discussions" element={<BMDiscussions />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Backend Team Member']} />}>
            <Route path="/backend-team" element={<Dashboard title="Developer Console" />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Client']} />}>
            <Route path="/client-portal" element={<Dashboard title="Client Portal" />} />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    </SocketProvider>
  );
}

export default App;
