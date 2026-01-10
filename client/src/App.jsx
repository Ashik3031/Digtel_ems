import { Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesDashboard from './pages/sales/SalesDashboard';
import AMDashboard from './pages/am/AMDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AuditLogViewer from './pages/admin/AuditLogViewer';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import SalesAnalytics from './pages/admin/SalesAnalytics';
import PerformanceOverview from './pages/admin/PerformanceOverview';
import TargetManagement from './pages/admin/TargetManagement';
import AgentPerformanceDetail from './pages/admin/AgentPerformanceDetail';
import ActiveProjects from './pages/admin/ActiveProjects';

function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Sales Module */}
        <Route element={<ProtectedRoute allowedRoles={['Sales Executive', 'Sales Manager', 'Admin', 'Super Admin']} />}>
          <Route path="/sales" element={<SalesDashboard />} />
        </Route>

        {/* Account Manager Module */}
        <Route element={<ProtectedRoute allowedRoles={['Account Manager', 'Admin', 'Super Admin']} />}>
          <Route path="/account-manager" element={<AMDashboard />} />
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
          <Route path="sales-view" element={<SalesDashboard isEmbedded={true} />} />
        </Route>

        {/* Generic Dashboard or Redirect */}
        <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'HR', 'Sales Manager', 'Sales Executive', 'Backend Manager', 'Account Manager', 'Backend Team Member', 'QC', 'Client']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;
